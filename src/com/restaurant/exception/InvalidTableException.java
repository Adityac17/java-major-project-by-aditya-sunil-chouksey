package com.restaurant.exception;

/** Bad table setup data or an illegal change to a table. */
public class InvalidTableException extends RestaurantException {
    public InvalidTableException(String message) {
        super(message);
    }
}
