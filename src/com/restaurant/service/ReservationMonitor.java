package com.restaurant.service;

/**
 * Background daemon that periodically sweeps the reservation book: holds tables for guests arriving soon,
 * warns about late parties and offers idle tables to the waitlist.
 */
public class ReservationMonitor implements Runnable {
    private final RestaurantManager manager;
    private final long intervalMs;
    private volatile boolean running = true;

    public ReservationMonitor(RestaurantManager manager, long intervalMs) {
        this.manager = manager;
        this.intervalMs = intervalMs;
    }

    public void stop() {
        running = false;
    }

    @Override
    public void run() {
        while (running) {
            try {
                manager.runHousekeeping();
                Thread.sleep(intervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (RuntimeException e) {
                // Never let one bad sweep kill the monitor thread.
                System.err.println("Reservation monitor error: " + e);
            }
        }
    }
}
