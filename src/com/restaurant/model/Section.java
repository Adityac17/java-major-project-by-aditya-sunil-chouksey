package com.restaurant.model;

/** Dining-room sections a table can belong to. */
public enum Section {
    MAIN_HALL("Main Hall"),
    PATIO("Patio"),
    BAR("Bar"),
    PRIVATE_ROOM("Private Room");

    private final String label;

    Section(String label) {
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
