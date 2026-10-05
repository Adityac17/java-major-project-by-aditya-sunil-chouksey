package com.restaurant.service;

/**
 * Runs on its own thread after a table frees up. It simulates the time staff need to clear and reset the
 * table, then asks the manager to offer the table to the next reservation or waitlisted party - which in
 * turn notifies the host.
 */
public class WaitlistNotifier implements Runnable {
    private final RestaurantManager manager;
    private final int tableNumber;
    private final long bussingDelayMs;

    public WaitlistNotifier(RestaurantManager manager, int tableNumber, long bussingDelayMs) {
        this.manager = manager;
        this.tableNumber = tableNumber;
        this.bussingDelayMs = bussingDelayMs;
    }

    @Override
    public void run() {
        try {
            if (bussingDelayMs > 0) {
                Thread.sleep(bussingDelayMs);
            }
            manager.processAvailability(tableNumber);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
