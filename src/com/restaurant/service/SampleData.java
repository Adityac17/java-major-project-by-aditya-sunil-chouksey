package com.restaurant.service;

import com.restaurant.exception.RestaurantException;
import com.restaurant.model.Section;
import com.restaurant.util.TimeUtil;
import com.restaurant.util.Validator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Seeds a realistic floor plan, bookings and a busy floor so the GUI has something to show. */
public final class SampleData {
    private SampleData() {
    }

    public static void load(RestaurantManager m) {
        try {
            m.addTable(1, 2, Section.MAIN_HALL);
            m.addTable(2, 2, Section.MAIN_HALL);
            m.addTable(3, 4, Section.MAIN_HALL);
            m.addTable(4, 4, Section.MAIN_HALL);
            m.addTable(5, 6, Section.MAIN_HALL);
            m.addTable(6, 8, Section.MAIN_HALL);
            m.addTable(7, 2, Section.PATIO);
            m.addTable(8, 4, Section.PATIO);
            m.addTable(9, 4, Section.PATIO);
            m.addTable(10, 2, Section.BAR);
            m.addTable(11, 2, Section.BAR);
            m.addTable(12, 12, Section.PRIVATE_ROOM);

            LocalDate tomorrow = m.now().toLocalDate().plusDays(1);
            m.createReservation("Aarav Sharma", "9876543210", 4, tomorrow.atTime(13, 0), null, null, "Anniversary - window seat");
            m.createReservation("Priya Nair", "9123456780", 2, tomorrow.atTime(19, 0), Section.PATIO, null, "");
            m.createReservation("Rohan Mehta", "9988776655", 6, tomorrow.atTime(19, 30), null, null, "Needs a high chair");
            m.createReservation("Kavya Iyer", "9012345678", 3, tomorrow.atTime(20, 0), Section.MAIN_HALL, null, "");
            m.createReservation("Vikram Singh", "9090909090", 10, tomorrow.atTime(20, 30), Section.PRIVATE_ROOM, null, "Office dinner");
            m.createReservation("Ananya Gupta", "9876501234", 2, tomorrow.atTime(21, 0), Section.BAR, null, "");

            // Bookings for later today, only if the kitchen is still taking them.
            LocalDateTime soon = TimeUtil.roundUpToSlot(m.now().plusMinutes(20));
            if (withinServiceHours(soon)) {
                m.createReservation("Meera Joshi", "9812345670", 2, soon, Section.MAIN_HALL, null, "Booked by phone");
            }
            LocalDateTime later = TimeUtil.roundUpToSlot(m.now().plusHours(2));
            if (withinServiceHours(later) && later.toLocalDate().equals(m.now().toLocalDate())) {
                m.createReservation("Arjun Rao", "9701234567", 4, later, null, null, "Birthday cake at 9");
            }

            // A busy floor: walk-ins already dining, the patio full, and people waiting.
            m.arriveWalkIn("Neha Kapoor", "9765432109", 2, null);
            m.arriveWalkIn("Sanjay Patel", "9654321098", 4, null);
            m.arriveWalkIn("Farhan Ali", "9543210987", 2, Section.PATIO);
            m.arriveWalkIn("Diya Reddy", "9432109876", 4, Section.PATIO);
            m.arriveWalkIn("Kabir Khanna", "9321098765", 3, Section.PATIO);
            m.addToWaitlist("Isha Verma", "9210987654", 2, Section.PATIO);
            m.addToWaitlist("Karan Malhotra", "9109876543", 5, null);
        } catch (RestaurantException e) {
            throw new IllegalStateException("Sample data is invalid: " + e.getMessage(), e);
        }
    }

    private static boolean withinServiceHours(LocalDateTime dt) {
        LocalTime t = dt.toLocalTime();
        return !t.isBefore(Validator.OPENING_TIME) && !t.isAfter(Validator.LAST_SEATING);
    }
}
