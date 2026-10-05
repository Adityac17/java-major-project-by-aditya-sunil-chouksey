package com.restaurant.util;

import com.restaurant.exception.InvalidReservationException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

/** Parsing and formatting of the date/time strings used in the GUI and reports. */
public final class TimeUtil {
    public static final String INPUT_PATTERN = "yyyy-MM-dd HH:mm";

    // STRICT + 'uuuu' rejects impossible dates such as 2026-02-30 instead of silently adjusting them.
    private static final DateTimeFormatter INPUT =
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm").withResolverStyle(ResolverStyle.STRICT);
    private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("EEE dd MMM, HH:mm");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private TimeUtil() {
    }

    public static LocalDateTime parse(String text) throws InvalidReservationException {
        if (text == null || text.trim().isEmpty()) {
            throw new InvalidReservationException("Reservation date and time are required (" + INPUT_PATTERN + ").");
        }
        try {
            return LocalDateTime.parse(text.trim(), INPUT);
        } catch (DateTimeParseException e) {
            throw new InvalidReservationException("\"" + text.trim() + "\" is not a valid date/time. Use "
                    + INPUT_PATTERN + ", e.g. 2026-10-02 19:30.");
        }
    }

    public static String format(LocalDateTime dt) {
        return dt == null ? "" : INPUT.format(dt);
    }

    public static String formatDayTime(LocalDateTime dt) {
        return dt == null ? "" : DAY_TIME.format(dt);
    }

    public static String formatTime(LocalDateTime dt) {
        return dt == null ? "" : TIME.format(dt);
    }

    public static long minutesBetween(LocalDateTime from, LocalDateTime to) {
        return Duration.between(from, to).toMinutes();
    }

    /** Rounds up to the next 15-minute reservation slot. */
    public static LocalDateTime roundUpToSlot(LocalDateTime dt) {
        LocalDateTime t = dt.withSecond(0).withNano(0);
        int remainder = t.getMinute() % 15;
        return remainder == 0 ? t : t.plusMinutes(15 - remainder);
    }
}
