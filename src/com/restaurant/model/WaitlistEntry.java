package com.restaurant.model;

import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

/** A walk-in party waiting for a table. */
public class WaitlistEntry implements Serializable {
    private static final long serialVersionUID = 1L;

    private static final AtomicInteger SEQUENCE = new AtomicInteger(0);

    private final String id;
    private final Customer customer;
    private final int partySize;
    private final Section preferredSection;   // null means "first suitable table anywhere"
    private final LocalDateTime joinedAt;
    private Integer heldTableNumber;          // set once a table has been held for this party
    private LocalDateTime notifiedAt;

    public WaitlistEntry(Customer customer, int partySize, Section preferredSection, LocalDateTime joinedAt) {
        this.id = String.format("W%03d", SEQUENCE.incrementAndGet());
        this.customer = customer;
        this.partySize = partySize;
        this.preferredSection = preferredSection;
        this.joinedAt = joinedAt;
    }

    /** After loading saved data, make sure new ids continue after the highest saved one. */
    public static void ensureSequenceAtLeast(int value) {
        SEQUENCE.accumulateAndGet(value, Math::max);
    }

    /** Numeric part of an id such as "W003". */
    public static int numberOf(String id) {
        String digits = id == null ? "" : id.replaceAll("\\D", "");
        return digits.isEmpty() ? 0 : Integer.parseInt(digits);
    }

    public String getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public int getPartySize() {
        return partySize;
    }

    public Section getPreferredSection() {
        return preferredSection;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public Integer getHeldTableNumber() {
        return heldTableNumber;
    }

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void holdTable(int tableNumber, LocalDateTime when) {
        this.heldTableNumber = tableNumber;
        this.notifiedAt = when;
    }

    public void clearHold() {
        this.heldTableNumber = null;
        this.notifiedAt = null;
    }

    public boolean fits(Table table) {
        return table.getCapacity() >= partySize
                && (preferredSection == null || preferredSection == table.getSection());
    }

    public long minutesWaiting(LocalDateTime now) {
        return Math.max(0, Duration.between(joinedAt, now).toMinutes());
    }

    @Override
    public String toString() {
        return id + " - " + customer.getName() + ", party of " + partySize;
    }
}
