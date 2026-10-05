package com.restaurant.util;

import com.restaurant.exception.InvalidReservationException;
import com.restaurant.exception.InvalidTableException;
import com.restaurant.model.Table;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.regex.Pattern;

/** All input rules in one place, so the GUI, sample data and tests enforce exactly the same checks. */
public final class Validator {
    public static final int MIN_PARTY_SIZE = 1;
    public static final int MAX_PARTY_SIZE = 20;
    public static final int MIN_TABLE_CAPACITY = 1;
    public static final int MAX_TABLE_CAPACITY = 20;
    public static final int MAX_TABLE_NUMBER = 999;
    public static final LocalTime OPENING_TIME = LocalTime.of(11, 0);
    public static final LocalTime LAST_SEATING = LocalTime.of(22, 30);
    public static final int MAX_DAYS_AHEAD = 60;
    public static final int SLOT_MINUTES = 15;

    private static final Pattern NAME = Pattern.compile("^[A-Za-z][A-Za-z .'-]{1,49}$");
    private static final Pattern PHONE = Pattern.compile("^\\+?\\d{10,13}$");

    private Validator() {
    }

    public static String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("[\\s()-]", "");
    }

    public static void validateCustomer(String name, String phone) throws InvalidReservationException {
        if (name == null || name.trim().isEmpty()) {
            throw new InvalidReservationException("Customer name is required.");
        }
        if (!NAME.matcher(name.trim()).matches()) {
            throw new InvalidReservationException("Customer name must be 2-50 characters and may contain only "
                    + "letters, spaces, apostrophes, dots and hyphens.");
        }
        if (phone == null || phone.trim().isEmpty()) {
            throw new InvalidReservationException("Phone number is required so the host can reach the guest.");
        }
        if (!PHONE.matcher(normalizePhone(phone)).matches()) {
            throw new InvalidReservationException("Phone number must contain 10-13 digits (an optional leading + is allowed).");
        }
    }

    public static void validatePartySize(int partySize) throws InvalidReservationException {
        if (partySize < MIN_PARTY_SIZE) {
            throw new InvalidReservationException("Party size must be at least " + MIN_PARTY_SIZE + ".");
        }
        if (partySize > MAX_PARTY_SIZE) {
            throw new InvalidReservationException("Party size cannot exceed " + MAX_PARTY_SIZE
                    + ". Larger groups need an event booking with the manager.");
        }
    }

    public static void validateReservationTime(LocalDateTime dateTime, LocalDateTime now) throws InvalidReservationException {
        if (dateTime == null) {
            throw new InvalidReservationException("Reservation date and time are required.");
        }
        if (dateTime.isBefore(now)) {
            throw new InvalidReservationException("Reservation time " + TimeUtil.format(dateTime) + " is in the past.");
        }
        if (dateTime.isAfter(now.plusDays(MAX_DAYS_AHEAD))) {
            throw new InvalidReservationException("Reservations can only be made up to " + MAX_DAYS_AHEAD + " days in advance.");
        }
        LocalTime time = dateTime.toLocalTime();
        if (time.isBefore(OPENING_TIME) || time.isAfter(LAST_SEATING)) {
            throw new InvalidReservationException("Guests are seated between " + OPENING_TIME + " and " + LAST_SEATING
                    + "; " + time + " is outside service hours.");
        }
        if (dateTime.getMinute() % SLOT_MINUTES != 0) {
            throw new InvalidReservationException("Reservations are taken in " + SLOT_MINUTES
                    + "-minute slots (e.g. 19:00, 19:15, 19:30).");
        }
    }

    public static void validateTableNumber(int number) throws InvalidTableException {
        if (number < 1 || number > MAX_TABLE_NUMBER) {
            throw new InvalidTableException("Table number must be between 1 and " + MAX_TABLE_NUMBER + ".");
        }
    }

    public static void validateTableCapacity(int capacity) throws InvalidTableException {
        if (capacity < MIN_TABLE_CAPACITY || capacity > MAX_TABLE_CAPACITY) {
            throw new InvalidTableException("Table capacity must be between " + MIN_TABLE_CAPACITY
                    + " and " + MAX_TABLE_CAPACITY + " seats.");
        }
    }

    public static void validateFits(Table table, int partySize) throws InvalidReservationException {
        if (partySize > table.getCapacity()) {
            throw new InvalidReservationException("A party of " + partySize + " does not fit table "
                    + table.getNumber() + " (" + table.getCapacity() + " seats).");
        }
    }
}
