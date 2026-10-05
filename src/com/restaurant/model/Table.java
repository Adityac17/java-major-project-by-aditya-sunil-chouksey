package com.restaurant.model;

import java.io.Serializable;

/** A physical table on the floor plan. */
public class Table implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int number;
    private int capacity;
    private Section section;
    private TableStatus status;
    private String heldFor;     // reservation or waitlist id the table is being held for
    private String occupiedBy;  // reservation id of the party currently seated

    public Table(int number, int capacity, Section section) {
        this.number = number;
        this.capacity = capacity;
        this.section = section;
        this.status = TableStatus.AVAILABLE;
    }

    public int getNumber() {
        return number;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public Section getSection() {
        return section;
    }

    public void setSection(Section section) {
        this.section = section;
    }

    public TableStatus getStatus() {
        return status;
    }

    public String getHeldFor() {
        return heldFor;
    }

    public String getOccupiedBy() {
        return occupiedBy;
    }

    public void hold(String id) {
        status = TableStatus.RESERVED;
        heldFor = id;
        occupiedBy = null;
    }

    public void occupy(String reservationId) {
        status = TableStatus.OCCUPIED;
        occupiedBy = reservationId;
        heldFor = null;
    }

    public void free() {
        status = TableStatus.AVAILABLE;
        heldFor = null;
        occupiedBy = null;
    }

    @Override
    public String toString() {
        return "Table " + number + " (" + capacity + " seats, " + section + ")";
    }
}
