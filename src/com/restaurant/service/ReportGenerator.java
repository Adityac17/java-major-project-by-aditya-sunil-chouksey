package com.restaurant.service;

import com.restaurant.model.Reservation;
import com.restaurant.model.ReservationStatus;
import com.restaurant.model.Section;
import com.restaurant.model.Table;
import com.restaurant.model.TableStatus;
import com.restaurant.model.WaitlistEntry;
import com.restaurant.util.TimeUtil;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Builds the plain-text seating report shown on the Reports tab. */
public final class ReportGenerator {
    private static final int WIDTH = 72;

    private ReportGenerator() {
    }

    public static String generate(RestaurantManager manager) {
        LocalDateTime now = manager.now();
        LocalDate today = now.toLocalDate();
        List<Table> tables = manager.getTables();
        List<Reservation> todays = manager.getReservationsOn(today);
        List<WaitlistEntry> waiting = manager.getWaitlist();
        StringBuilder sb = new StringBuilder();

        sb.append("SEATING REPORT  -  ").append(TimeUtil.formatDayTime(now)).append('\n');
        sb.append(line('=')).append('\n');

        // ---- floor status
        Map<TableStatus, Integer> byStatus = new EnumMap<>(TableStatus.class);
        for (TableStatus s : TableStatus.values()) byStatus.put(s, 0);
        int totalSeats = 0;
        for (Table t : tables) {
            byStatus.put(t.getStatus(), byStatus.get(t.getStatus()) + 1);
            totalSeats += t.getCapacity();
        }
        int seatedGuests = manager.countSeatedGuests();
        sb.append("\nFLOOR STATUS\n").append(line('-')).append('\n');
        sb.append(String.format("  Tables: %d   Available: %d   Reserved: %d   Occupied: %d%n", tables.size(),
                byStatus.get(TableStatus.AVAILABLE), byStatus.get(TableStatus.RESERVED), byStatus.get(TableStatus.OCCUPIED)));
        sb.append(String.format("  Guests seated: %d of %d seats (%.1f%% seat utilisation)%n",
                seatedGuests, totalSeats, percent(seatedGuests, totalSeats)));

        // ---- by section
        sb.append("\nBY SECTION\n").append(line('-')).append('\n');
        sb.append(String.format("  %-14s %7s %7s %10s %10s%n", "Section", "Tables", "Seats", "Occupied", "Reserved"));
        for (Section section : Section.values()) {
            int count = 0, seats = 0, occupied = 0, reserved = 0;
            for (Table t : tables) {
                if (t.getSection() != section) continue;
                count++;
                seats += t.getCapacity();
                if (t.getStatus() == TableStatus.OCCUPIED) occupied++;
                if (t.getStatus() == TableStatus.RESERVED) reserved++;
            }
            if (count > 0) {
                sb.append(String.format("  %-14s %7d %7d %10d %10d%n", section, count, seats, occupied, reserved));
            }
        }

        // ---- today's reservations
        Map<ReservationStatus, Integer> resByStatus = new EnumMap<>(ReservationStatus.class);
        for (ReservationStatus s : ReservationStatus.values()) resByStatus.put(s, 0);
        TreeMap<Integer, Integer> byHour = new TreeMap<>();
        int covers = 0, walkIns = 0, booked = 0;
        for (Reservation r : todays) {
            resByStatus.put(r.getStatus(), resByStatus.get(r.getStatus()) + 1);
            if (r.getStatus() == ReservationStatus.CANCELLED || r.getStatus() == ReservationStatus.NO_SHOW) continue;
            covers += r.getPartySize();
            if (r.isWalkIn()) walkIns++; else booked++;
            int hour = r.getDateTime().getHour();
            byHour.put(hour, byHour.containsKey(hour) ? byHour.get(hour) + 1 : 1);
        }
        sb.append("\nTODAY'S PARTIES (").append(today).append(")\n").append(line('-')).append('\n');
        sb.append(String.format("  Total records: %d   Bookings: %d   Walk-ins: %d%n", todays.size(), booked, walkIns));
        sb.append(String.format("  Confirmed: %d   Seated: %d   Completed: %d   Cancelled: %d   No-show: %d%n",
                resByStatus.get(ReservationStatus.CONFIRMED), resByStatus.get(ReservationStatus.SEATED),
                resByStatus.get(ReservationStatus.COMPLETED), resByStatus.get(ReservationStatus.CANCELLED),
                resByStatus.get(ReservationStatus.NO_SHOW)));
        int parties = booked + walkIns;
        sb.append(String.format("  Covers (guests): %d   Average party size: %.1f%n", covers,
                parties == 0 ? 0.0 : (double) covers / parties));
        if (!byHour.isEmpty()) {
            int peakHour = byHour.firstKey();
            for (Map.Entry<Integer, Integer> e : byHour.entrySet()) {
                if (e.getValue() > byHour.get(peakHour)) peakHour = e.getKey();
            }
            sb.append(String.format("  Peak hour: %02d:00-%02d:00 (%d parties)%n", peakHour, peakHour + 1, byHour.get(peakHour)));
            sb.append("  Parties by hour:\n");
            for (Map.Entry<Integer, Integer> e : byHour.entrySet()) {
                sb.append(String.format("    %02d:00  %-30s %d%n", e.getKey(), bar(e.getValue()), e.getValue()));
            }
        }

        // ---- upcoming
        List<Reservation> upcoming = manager.getReservationsBetween(now, now.plusHours(3));
        sb.append("\nUPCOMING - NEXT 3 HOURS\n").append(line('-')).append('\n');
        int shown = 0;
        for (Reservation r : upcoming) {
            if (r.getStatus() != ReservationStatus.CONFIRMED) continue;
            sb.append(String.format("  %s  %-7s %-22s party %-3d table %s%n", TimeUtil.formatTime(r.getDateTime()),
                    r.getId(), truncate(r.getCustomer().getName(), 22), r.getPartySize(), r.getTableNumber()));
            shown++;
        }
        if (shown == 0) sb.append("  No confirmed reservations in the next 3 hours.\n");

        // ---- waitlist
        sb.append("\nWAITLIST\n").append(line('-')).append('\n');
        if (waiting.isEmpty()) {
            sb.append("  Nobody is waiting.\n");
        } else {
            long longest = 0, total = 0;
            for (WaitlistEntry e : waiting) {
                long m = e.minutesWaiting(now);
                longest = Math.max(longest, m);
                total += m;
            }
            sb.append(String.format("  Parties waiting: %d   Longest wait: %d min   Average wait: %d min%n",
                    waiting.size(), longest, total / waiting.size()));
            int pos = 1;
            for (WaitlistEntry e : waiting) {
                sb.append(String.format("  %2d. %-5s %-22s party %-3d %-13s %3d min %s%n", pos++, e.getId(),
                        truncate(e.getCustomer().getName(), 22), e.getPartySize(),
                        e.getPreferredSection() == null ? "Any" : e.getPreferredSection().toString(),
                        e.minutesWaiting(now),
                        e.getHeldTableNumber() != null ? "[table " + e.getHeldTableNumber() + " ready]" : ""));
            }
        }
        return sb.toString();
    }

    private static double percent(int part, int whole) {
        return whole == 0 ? 0 : part * 100.0 / whole;
    }

    private static String line(char c) {
        StringBuilder sb = new StringBuilder(WIDTH);
        for (int i = 0; i < WIDTH; i++) sb.append(c);
        return sb.toString();
    }

    private static String bar(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(n, 30); i++) sb.append('#');
        return sb.toString();
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + ".";
    }
}
