package com.restaurant.model;

/** Live front-of-house state of a physical table. */
public enum TableStatus {
    AVAILABLE("Available"),
    RESERVED("Reserved"),
    OCCUPIED("Occupied");

    private final String label;

    TableStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    @Override
    public String toString() {
        return label;
    }
}
