package com.restaurant.exception;

/** Bad reservation input: customer details, party size, time or an illegal state change. */
public class InvalidReservationException extends RestaurantException {
    public InvalidReservationException(String message) {
        super(message);
    }
}
