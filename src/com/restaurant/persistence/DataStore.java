package com.restaurant.persistence;

import com.restaurant.service.RestaurantManager;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Saves and loads the restaurant state with Java object serialization.
 *
 * <p>Saves are atomic: data is written to a temporary file first and then moved over the real file,
 * so a crash in the middle of a save can never leave a half-written data file behind.
 */
public final class DataStore {
    /** Default location, relative to the folder the app is started from. */
    public static final File DEFAULT_FILE = new File("data", "restaurant.dat");

    private DataStore() {
    }

    public static void save(RestaurantManager manager, File file) throws IOException {
        File dir = file.getAbsoluteFile().getParentFile();
        if (dir != null && !dir.exists() && !dir.mkdirs()) {
            throw new IOException("Could not create folder " + dir);
        }
        Path target = file.toPath();
        Path temp = new File(dir, file.getName() + ".tmp").toPath();
        // Lock the manager so background threads cannot change objects while they are being written.
        synchronized (manager) {
            try (ObjectOutputStream out = new ObjectOutputStream(
                    new BufferedOutputStream(Files.newOutputStream(temp)))) {
                out.writeObject(manager.createSnapshot());
            }
        }
        try {
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    /** Replaces the manager's state with the saved file. Returns a short summary for the host. */
    public static String load(RestaurantManager manager, File file) throws IOException {
        RestaurantSnapshot snapshot;
        try (ObjectInputStream in = new ObjectInputStream(
                new BufferedInputStream(Files.newInputStream(file.toPath())))) {
            Object obj = in.readObject();
            if (!(obj instanceof RestaurantSnapshot)) {
                throw new IOException(file + " is not a restaurant data file.");
            }
            snapshot = (RestaurantSnapshot) obj;
        } catch (ClassNotFoundException | InvalidClassException | ClassCastException e) {
            throw new IOException(file + " was saved by an incompatible version of the app (" + e.getMessage() + ").", e);
        }
        return manager.restoreSnapshot(snapshot);
    }

    /** Keeps an unreadable data file for inspection instead of silently overwriting it. */
    public static File quarantine(File file) {
        File backup = new File(file.getPath() + ".corrupt-" + System.currentTimeMillis());
        return file.renameTo(backup) ? backup : null;
    }
}
