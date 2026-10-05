package com.restaurant.service;

import com.restaurant.model.Reservation;
import com.restaurant.model.Table;
import com.restaurant.model.WaitlistEntry;

/** Outcome of a walk-in arriving: either seated straight away or placed on the waitlist. */
public final class WalkInResult {
    private final Reservation reservation;
    private final Table table;
    private final WaitlistEntry waitlistEntry;
    private final int position;
    private final int estimatedWaitMinutes;

    private WalkInResult(Reservation reservation, Table table, WaitlistEntry entry, int position, int estimatedWait) {
        this.reservation = reservation;
        this.table = table;
        this.waitlistEntry = entry;
        this.position = position;
        this.estimatedWaitMinutes = estimatedWait;
    }

    static WalkInResult seated(Reservation reservation, Table table) {
        return new WalkInResult(reservation, table, null, 0, 0);
    }

    static WalkInResult waitlisted(WaitlistEntry entry, int position, int estimatedWaitMinutes) {
        return new WalkInResult(null, null, entry, position, estimatedWaitMinutes);
    }

    public boolean isSeated() {
        return reservation != null;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public Table getTable() {
        return table;
    }

    public WaitlistEntry getWaitlistEntry() {
        return waitlistEntry;
    }

    public int getPosition() {
        return position;
    }

    public int getEstimatedWaitMinutes() {
        return estimatedWaitMinutes;
    }
}
