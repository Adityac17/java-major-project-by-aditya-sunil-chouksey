package com.restaurant.exception;

/** Lookup by id or table number found nothing. */
public class NotFoundException extends RestaurantException {
    public NotFoundException(String message) {
        super(message);
    }
}
