package com.restaurant.model;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

/**
 * First-come-first-served queue of walk-in parties. A LinkedList gives O(1) enqueue at the tail and
 * O(1) removal of whoever is being seated, while still letting the host remove a party from the middle
 * when they leave or when a free table only suits someone further back.
 */
public class Waitlist {
    /** Rough table-turn estimate used to quote guests a wait time. */
    public static final int MINUTES_PER_PARTY_AHEAD = 15;

    private final LinkedList<WaitlistEntry> queue = new LinkedList<>();

    public void enqueue(WaitlistEntry entry) {
        queue.addLast(entry);
    }

    public WaitlistEntry peek() {
        return queue.peekFirst();
    }

    public WaitlistEntry dequeue() {
        return queue.pollFirst();
    }

    public WaitlistEntry find(String id) {
        for (WaitlistEntry e : queue) {
            if (e.getId().equalsIgnoreCase(id)) return e;
        }
        return null;
    }

    public WaitlistEntry findByPhone(String phone) {
        for (WaitlistEntry e : queue) {
            if (e.getCustomer().getPhone().equals(phone)) return e;
        }
        return null;
    }

    public boolean remove(String id) {
        Iterator<WaitlistEntry> it = queue.iterator();
        while (it.hasNext()) {
            if (it.next().getId().equalsIgnoreCase(id)) {
                it.remove();
                return true;
            }
        }
        return false;
    }

    /** 1-based queue position, or -1 when the id is not waiting. */
    public int positionOf(String id) {
        int pos = 1;
        for (WaitlistEntry e : queue) {
            if (e.getId().equalsIgnoreCase(id)) return pos;
            pos++;
        }
        return -1;
    }

    /** Earliest party in line that fits the table and is not already holding another table. */
    public WaitlistEntry firstFitFor(Table table) {
        for (WaitlistEntry e : queue) {
            if (e.getHeldTableNumber() == null && e.fits(table)) return e;
        }
        return null;
    }

    public int estimatedWaitMinutes(int position) {
        return Math.max(0, position) * MINUTES_PER_PARTY_AHEAD;
    }

    public void clear() {
        queue.clear();
    }

    public List<WaitlistEntry> snapshot() {
        return new ArrayList<>(queue);
    }

    public int size() {
        return queue.size();
    }

    public boolean isEmpty() {
        return queue.isEmpty();
    }
}
