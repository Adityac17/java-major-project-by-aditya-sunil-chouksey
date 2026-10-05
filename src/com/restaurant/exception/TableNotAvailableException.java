package com.restaurant.exception;

/** No suitable table is free for the requested party or time. */
public class TableNotAvailableException extends RestaurantException {
    public TableNotAvailableException(String message) {
        super(message);
    }
}
