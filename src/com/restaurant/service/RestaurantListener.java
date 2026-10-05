package com.restaurant.service;

/**
 * Observer for {@link RestaurantManager} events. Callbacks may arrive on background threads,
 * so GUI implementations must hand work over to the Swing event thread.
 */
public interface RestaurantListener {
    void onNotification(NotificationType type, String message);

    void onDataChanged();
}
