package com.restaurant.model;

/** Life cycle of a reservation (or a seated walk-in). */
public enum ReservationStatus {
    CONFIRMED("Confirmed"),
    SEATED("Seated"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled"),
    NO_SHOW("No-show");

    private final String label;

    ReservationStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /** Active reservations still block a table; closed ones do not. */
    public boolean isActive() {
        return this == CONFIRMED || this == SEATED;
    }

    @Override
    public String toString() {
        return label;
    }
}
