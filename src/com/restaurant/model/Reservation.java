package com.restaurant.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

/** A table booking. Walk-ins who get seated are recorded as reservations too, so reports see every party. */
public class Reservation implements Serializable {
    private static final long serialVersionUID = 1L;

    /** How long a party is expected to hold a table. Used for double-booking checks. */
    public static final int DINING_MINUTES = 90;

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1000);

    private final String id;
    private final boolean walkIn;
    private final LocalDateTime createdAt;
    private Customer customer;
    private int partySize;
    private LocalDateTime dateTime;
    private Section preferredSection;   // null means "any section"
    private Integer tableNumber;
    private ReservationStatus status;
    private String notes;
    private LocalDateTime seatedAt;
    private LocalDateTime completedAt;

    public Reservation(Customer customer, int partySize, LocalDateTime dateTime,
                       Section preferredSection, String notes, boolean walkIn) {
        this.id = (walkIn ? "WI" : "R") + SEQUENCE.incrementAndGet();
        this.customer = customer;
        this.partySize = partySize;
        this.dateTime = dateTime;
        this.preferredSection = preferredSection;
        this.notes = notes == null ? "" : notes.trim();
        this.walkIn = walkIn;
        this.status = ReservationStatus.CONFIRMED;
        this.createdAt = LocalDateTime.now();
    }

    /** After loading saved data, make sure new ids continue after the highest saved one. */
    public static void ensureSequenceAtLeast(int value) {
        SEQUENCE.accumulateAndGet(value, Math::max);
    }

    /** Numeric part of an id such as "R1007" or "WI1008". */
    public static int numberOf(String id) {
        String digits = id == null ? "" : id.replaceAll("\\D", "");
        return digits.isEmpty() ? 0 : Integer.parseInt(digits);
    }

    public String getId() {
        return id;
    }

    public boolean isWalkIn() {
        return walkIn;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public int getPartySize() {
        return partySize;
    }

    public void setPartySize(int partySize) {
        this.partySize = partySize;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public LocalDateTime getEndTime() {
        return dateTime.plusMinutes(DINING_MINUTES);
    }

    public Section getPreferredSection() {
        return preferredSection;
    }

    public void setPreferredSection(Section preferredSection) {
        this.preferredSection = preferredSection;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes == null ? "" : notes.trim();
    }

    public LocalDateTime getSeatedAt() {
        return seatedAt;
    }

    public void setSeatedAt(LocalDateTime seatedAt) {
        this.seatedAt = seatedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    @Override
    public String toString() {
        return id + " - " + customer.getName() + ", party of " + partySize
                + (tableNumber != null ? ", table " + tableNumber : "");
    }
}
