package com.restaurant;

import com.restaurant.gui.MainFrame;
import com.restaurant.persistence.DataStore;
import com.restaurant.service.ReservationMonitor;
import com.restaurant.service.RestaurantManager;
import com.restaurant.service.SampleData;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import java.awt.GraphicsEnvironment;
import java.io.File;
import java.io.IOException;

/**
 * Entry point: loads saved data (or sample data on first run), opens the GUI and starts the
 * background reservation monitor. Optional argument: path of the data file to use.
 */
public class Main {
    private static final long MONITOR_INTERVAL_MS = 15_000;

    public static void main(String[] args) {
        if (GraphicsEnvironment.isHeadless()) {
            System.err.println("This application needs a graphical display (Swing GUI).");
            System.exit(1);
        }
        File dataFile = args.length > 0 ? new File(args[0]) : DataStore.DEFAULT_FILE;
        RestaurantManager manager = new RestaurantManager();
        String startupMessage = loadInitialData(manager, dataFile);

        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {
                // fall back to the default look and feel
            }
            new MainFrame(manager, dataFile, startupMessage).setVisible(true);

            Thread monitor = new Thread(new ReservationMonitor(manager, MONITOR_INTERVAL_MS), "reservation-monitor");
            monitor.setDaemon(true);
            monitor.start();
        });
    }

    private static String loadInitialData(RestaurantManager manager, File dataFile) {
        if (!dataFile.exists()) {
            SampleData.load(manager);
            return "First run: loaded sample data. Changes are saved automatically to "
                    + dataFile.getAbsolutePath() + ".";
        }
        try {
            return DataStore.load(manager, dataFile);
        } catch (IOException e) {
            File backup = DataStore.quarantine(dataFile);
            manager.reset();
            SampleData.load(manager);
            return "Could not read saved data (" + e.getMessage() + "). "
                    + (backup != null ? "The unreadable file was kept as " + backup.getName() + ". " : "")
                    + "Started with sample data instead.";
        }
    }
}
