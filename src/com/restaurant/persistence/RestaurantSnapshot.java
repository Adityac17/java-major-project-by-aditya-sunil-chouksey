package com.restaurant.persistence;

import com.restaurant.model.Reservation;
import com.restaurant.model.Table;
import com.restaurant.model.WaitlistEntry;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Everything that needs to survive a restart, written as one serialized object graph.
 * The HashMap and TreeMap indexes are not saved - they are rebuilt from the reservation list on load.
 */
public class RestaurantSnapshot implements Serializable {
    private static final long serialVersionUID = 1L;

    private final ArrayList<Table> tables;
    private final ArrayList<Reservation> reservations;
    private final ArrayList<WaitlistEntry> waitlist;   // kept in queue order
    private final LocalDateTime savedAt;

    public RestaurantSnapshot(List<Table> tables, List<Reservation> reservations,
                              List<WaitlistEntry> waitlist, LocalDateTime savedAt) {
        this.tables = new ArrayList<>(tables);
        this.reservations = new ArrayList<>(reservations);
        this.waitlist = new ArrayList<>(waitlist);
        this.savedAt = savedAt;
    }

    public List<Table> getTables() {
        return Collections.unmodifiableList(tables);
    }

    public List<Reservation> getReservations() {
        return Collections.unmodifiableList(reservations);
    }

    public List<WaitlistEntry> getWaitlist() {
        return Collections.unmodifiableList(waitlist);
    }

    public LocalDateTime getSavedAt() {
        return savedAt;
    }
}
