package com.restaurant.exception;

/** Base checked exception for every business-rule failure; the message is safe to show to the host. */
public class RestaurantException extends Exception {
    public RestaurantException(String message) {
        super(message);
    }
}
