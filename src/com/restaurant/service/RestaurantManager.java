package com.restaurant.service;

import com.restaurant.exception.InvalidReservationException;
import com.restaurant.exception.InvalidTableException;
import com.restaurant.exception.NotFoundException;
import com.restaurant.exception.RestaurantException;
import com.restaurant.exception.TableNotAvailableException;
import com.restaurant.model.Customer;
import com.restaurant.model.Reservation;
import com.restaurant.model.ReservationStatus;
import com.restaurant.model.Section;
import com.restaurant.model.Table;
import com.restaurant.model.TableStatus;
import com.restaurant.model.Waitlist;
import com.restaurant.model.WaitlistEntry;
import com.restaurant.persistence.RestaurantSnapshot;
import com.restaurant.util.TimeUtil;
import com.restaurant.util.Validator;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Front-of-house service: owns the floor plan, the reservation book and the walk-in waitlist.
 *
 * <p>Data structures:
 * <ul>
 *   <li>{@code ArrayList<Table>} / {@code ArrayList<Reservation>} - master lists of tables and reservations</li>
 *   <li>{@code HashMap<String, Reservation>} - O(1) lookup of a reservation by its id</li>
 *   <li>{@code TreeMap<LocalDateTime, List<Reservation>>} - reservations kept in time order, used for
 *       "what is due next" queries via {@code subMap}</li>
 *   <li>{@link Waitlist} - a {@code LinkedList} queue of walk-ins</li>
 * </ul>
 *
 * <p>Every public method is {@code synchronized}: the Swing GUI, the {@link ReservationMonitor} thread and
 * {@link WaitlistNotifier} threads all touch the same state.
 */
public class RestaurantManager {

    /** A table is held for a reservation this many minutes before (and after) its start time. */
    public static final int HOLD_WINDOW_MINUTES = 30;
    /** A confirmed party this late triggers a "consider no-show" warning. */
    public static final int LATE_GRACE_MINUTES = 15;

    public enum SearchField {
        CUSTOMER("Customer name / phone"),
        TABLE("Table number"),
        ID("Reservation ID");

        private final String label;

        SearchField(String label) {
            this.label = label;
        }

        @Override
        public String toString() {
            return label;
        }
    }

    public enum SortField {
        TIME("Time", Comparator.comparing(Reservation::getDateTime).thenComparing(Reservation::getId)),
        PARTY_SIZE("Party size", Comparator.comparingInt(Reservation::getPartySize)
                .thenComparing(Reservation::getDateTime)),
        CUSTOMER("Customer name", Comparator.comparing((Reservation r) -> r.getCustomer().getName(),
                String.CASE_INSENSITIVE_ORDER).thenComparing(Reservation::getDateTime)),
        TABLE("Table", Comparator.comparingInt((Reservation r) ->
                r.getTableNumber() == null ? Integer.MAX_VALUE : r.getTableNumber())
                .thenComparing(Reservation::getDateTime)),
        STATUS("Status", Comparator.comparing(Reservation::getStatus).thenComparing(Reservation::getDateTime));

        private final String label;
        private final Comparator<Reservation> comparator;

        SortField(String label, Comparator<Reservation> comparator) {
            this.label = label;
            this.comparator = comparator;
        }

        public Comparator<Reservation> comparator() {
            return comparator;
        }

        @Override
        public String toString() {
            return label;
        }
    }

    private final List<Table> tables = new ArrayList<>();
    private final List<Reservation> reservations = new ArrayList<>();
    private final Map<String, Reservation> reservationById = new HashMap<>();
    private final TreeMap<LocalDateTime, List<Reservation>> reservationsByTime = new TreeMap<>();
    private final Waitlist waitlist = new Waitlist();
    private final Set<String> lateAlertsSent = new HashSet<>();
    private final List<RestaurantListener> listeners = new CopyOnWriteArrayList<>();
    private final Clock clock;

    private boolean asyncNotifications = true;
    private long bussingDelayMs = 2000;

    public RestaurantManager() {
        this(Clock.systemDefaultZone());
    }

    /** A custom clock lets tests run against a fixed "now". */
    public RestaurantManager(Clock clock) {
        this.clock = clock;
    }

    public LocalDateTime now() {
        return LocalDateTime.now(clock).withSecond(0).withNano(0);
    }

    // ------------------------------------------------------------------ configuration & listeners

    public void addListener(RestaurantListener listener) {
        listeners.add(listener);
    }

    public void removeListener(RestaurantListener listener) {
        listeners.remove(listener);
    }

    /** When false, availability checks run inline instead of on a {@link WaitlistNotifier} thread (used by tests). */
    public synchronized void setAsyncNotifications(boolean async) {
        this.asyncNotifications = async;
    }

    /** Simulated time to clear and reset a table after guests leave. */
    public synchronized void setBussingDelayMs(long delayMs) {
        this.bussingDelayMs = Math.max(0, delayMs);
    }

    private void fire(NotificationType type, String message) {
        for (RestaurantListener l : listeners) {
            l.onNotification(type, message);
        }
    }

    private void fireDataChanged() {
        for (RestaurantListener l : listeners) {
            l.onDataChanged();
        }
    }

    // ------------------------------------------------------------------ module 1: table setup

    public synchronized Table addTable(int number, int capacity, Section section) throws InvalidTableException {
        Validator.validateTableNumber(number);
        Validator.validateTableCapacity(capacity);
        if (section == null) {
            throw new InvalidTableException("Choose a section for the table.");
        }
        if (findTable(number) != null) {
            throw new InvalidTableException("Table " + number + " already exists.");
        }
        Table table = new Table(number, capacity, section);
        tables.add(table);
        Collections.sort(tables, Comparator.comparingInt(Table::getNumber));
        fire(NotificationType.INFO, "Added " + table + ".");
        fireDataChanged();
        return table;
    }

    public synchronized Table updateTable(int number, int capacity, Section section) throws RestaurantException {
        Table table = getTable(number);
        Validator.validateTableCapacity(capacity);
        if (section == null) {
            throw new InvalidTableException("Choose a section for the table.");
        }
        for (Reservation r : reservations) {
            if (r.getStatus().isActive() && isOnTable(r, number) && r.getPartySize() > capacity) {
                throw new InvalidTableException("Cannot reduce table " + number + " to " + capacity + " seats: "
                        + r.getId() + " has a party of " + r.getPartySize() + ".");
            }
        }
        WaitlistEntry holder = heldWaitlistEntry(table);
        table.setCapacity(capacity);
        table.setSection(section);
        if (holder != null && !holder.fits(table)) {
            holder.clearHold();
            table.free();
            scheduleAvailabilityCheck(table, 0);
        }
        fire(NotificationType.INFO, "Updated " + table + ".");
        fireDataChanged();
        return table;
    }

    public synchronized void removeTable(int number) throws RestaurantException {
        Table table = getTable(number);
        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new TableNotAvailableException("Table " + number + " has guests seated. Release it before removing.");
        }
        for (Reservation r : reservations) {
            if (r.getStatus() == ReservationStatus.CONFIRMED && isOnTable(r, number)) {
                throw new InvalidTableException("Table " + number + " still has reservation " + r.getId() + " ("
                        + TimeUtil.formatDayTime(r.getDateTime()) + "). Move or cancel it first.");
            }
        }
        WaitlistEntry holder = heldWaitlistEntry(table);
        if (holder != null) {
            holder.clearHold();
        }
        tables.remove(table);
        fire(NotificationType.INFO, "Removed table " + number + ".");
        fireDataChanged();
    }

    public synchronized Table getTable(int number) throws NotFoundException {
        Table table = findTable(number);
        if (table == null) {
            throw new NotFoundException("Table " + number + " does not exist.");
        }
        return table;
    }

    public synchronized List<Table> getTables() {
        return new ArrayList<>(tables);
    }

    // ------------------------------------------------------------------ module 2: reservation booking (CRUD)

    public synchronized Reservation createReservation(String name, String phone, int partySize, LocalDateTime dateTime,
                                                      Section preferredSection, Integer requestedTable, String notes)
            throws RestaurantException {
        Validator.validateCustomer(name, phone);
        Validator.validatePartySize(partySize);
        Validator.validateReservationTime(dateTime, now());
        Customer customer = new Customer(name.trim(), Validator.normalizePhone(phone));
        ensureNoOverlappingBooking(customer, dateTime, null);

        Table table = chooseTable(partySize, dateTime, preferredSection, requestedTable, null);
        Reservation r = new Reservation(customer, partySize, dateTime, preferredSection, notes, false);
        r.setTableNumber(table.getNumber());
        index(r);

        fire(NotificationType.INFO, "Booked " + describe(r) + sectionNote(preferredSection, table));
        holdIfDue(r);
        fireDataChanged();
        return r;
    }

    public synchronized Reservation getReservation(String id) throws NotFoundException {
        Reservation r = id == null ? null : reservationById.get(id.trim().toUpperCase());
        if (r == null) {
            throw new NotFoundException("No reservation with id \"" + id + "\".");
        }
        return r;
    }

    public synchronized Reservation updateReservation(String id, String name, String phone, int partySize,
                                                      LocalDateTime dateTime, Section preferredSection,
                                                      Integer requestedTable, String notes) throws RestaurantException {
        Reservation r = getReservation(id);
        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new InvalidReservationException("Only confirmed reservations can be edited; " + r.getId()
                    + " is " + r.getStatus().getLabel().toLowerCase() + ".");
        }
        Validator.validateCustomer(name, phone);
        Validator.validatePartySize(partySize);
        Validator.validateReservationTime(dateTime, now());
        Customer customer = new Customer(name.trim(), Validator.normalizePhone(phone));
        ensureNoOverlappingBooking(customer, dateTime, r.getId());

        Table current = findTable(r.getTableNumber());
        Table target;
        boolean keepCurrent = requestedTable == null && current != null
                && current.getCapacity() >= partySize
                && (preferredSection == null || current.getSection() == preferredSection)
                && findConflict(current, dateTime, r.getId()) == null
                && !isBlockedByWaitlistHold(current, dateTime);
        if (keepCurrent) {
            target = current;
        } else {
            target = chooseTable(partySize, dateTime, preferredSection, requestedTable, r.getId());
        }

        boolean timeChanged = !r.getDateTime().equals(dateTime);
        if (timeChanged) {
            unindexTime(r);
        }
        r.setCustomer(customer);
        r.setPartySize(partySize);
        r.setDateTime(dateTime);
        r.setPreferredSection(preferredSection);
        r.setNotes(notes);
        r.setTableNumber(target.getNumber());
        if (timeChanged) {
            indexTime(r);
            lateAlertsSent.remove(r.getId());
        }

        // A hold on the old table no longer applies if the party moved tables or is no longer due soon.
        if (current != null && r.getId().equals(current.getHeldFor()) && (current != target || !isDueSoon(r))) {
            current.free();
            scheduleAvailabilityCheck(current, 0);
        }
        fire(NotificationType.INFO, "Updated " + describe(r) + sectionNote(preferredSection, target));
        holdIfDue(r);
        fireDataChanged();
        return r;
    }

    public synchronized void cancelReservation(String id) throws RestaurantException {
        closeUnseated(getReservation(id), ReservationStatus.CANCELLED, "Cancelled");
    }

    public synchronized void markNoShow(String id) throws RestaurantException {
        Reservation r = getReservation(id);
        if (r.getStatus() == ReservationStatus.CONFIRMED && now().isBefore(r.getDateTime())) {
            throw new InvalidReservationException(r.getId() + " is not due until "
                    + TimeUtil.formatDayTime(r.getDateTime()) + "; it cannot be a no-show yet.");
        }
        closeUnseated(r, ReservationStatus.NO_SHOW, "Marked no-show:");
    }

    /** Permanently removes a reservation record (the "D" in CRUD). Seated parties must be released first. */
    public synchronized void deleteReservation(String id) throws RestaurantException {
        Reservation r = getReservation(id);
        if (r.getStatus() == ReservationStatus.SEATED) {
            throw new InvalidReservationException(r.getId() + " is seated at table " + r.getTableNumber()
                    + ". Release the table before deleting the record.");
        }
        reservations.remove(r);
        reservationById.remove(r.getId());
        unindexTime(r);
        lateAlertsSent.remove(r.getId());
        releaseHoldFor(r);
        fire(NotificationType.INFO, "Deleted reservation " + r.getId() + ".");
        fireDataChanged();
    }

    /** All reservations in the order they were created. */
    public synchronized List<Reservation> getReservations() {
        return new ArrayList<>(reservations);
    }

    /** All reservations in time order, read straight from the TreeMap. */
    public synchronized List<Reservation> getReservationsSortedByTime() {
        List<Reservation> out = new ArrayList<>();
        for (List<Reservation> slot : reservationsByTime.values()) {
            out.addAll(slot);
        }
        return out;
    }

    /** Reservations starting in [from, to), using the TreeMap's range view. */
    public synchronized List<Reservation> getReservationsBetween(LocalDateTime from, LocalDateTime to) {
        List<Reservation> out = new ArrayList<>();
        for (List<Reservation> slot : reservationsByTime.subMap(from, true, to, false).values()) {
            out.addAll(slot);
        }
        return out;
    }

    public synchronized List<Reservation> getReservationsOn(LocalDate date) {
        return getReservationsBetween(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
    }

    // ------------------------------------------------------------------ module 6: search & sort

    public synchronized List<Reservation> searchReservations(String query, SearchField field) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return getReservations();
        }
        List<Reservation> out = new ArrayList<>();
        switch (field) {
            case ID: {
                Reservation r = reservationById.get(q.toUpperCase());
                if (r != null) out.add(r);
                break;
            }
            case TABLE: {
                int number;
                try {
                    number = Integer.parseInt(q);
                } catch (NumberFormatException e) {
                    return out;
                }
                for (Reservation r : reservations) {
                    if (isOnTable(r, number)) out.add(r);
                }
                break;
            }
            case CUSTOMER:
            default: {
                String lower = q.toLowerCase();
                String digits = Validator.normalizePhone(q);
                for (Reservation r : reservations) {
                    Customer c = r.getCustomer();
                    if (c.getName().toLowerCase().contains(lower)
                            || (!digits.isEmpty() && c.getPhone().contains(digits))) {
                        out.add(r);
                    }
                }
                break;
            }
        }
        return out;
    }

    public static List<Reservation> sort(Collection<Reservation> input, SortField field, boolean ascending) {
        List<Reservation> list = new ArrayList<>(input);
        Comparator<Reservation> comparator = field.comparator();
        Collections.sort(list, ascending ? comparator : comparator.reversed());
        return list;
    }

    // ------------------------------------------------------------------ module 3: waitlist management

    /** A walk-in arrives: seat them now if a suitable table is free, otherwise add them to the waitlist. */
    public synchronized WalkInResult arriveWalkIn(String name, String phone, int partySize, Section preferredSection)
            throws RestaurantException {
        Validator.validateCustomer(name, phone);
        Validator.validatePartySize(partySize);
        Customer customer = new Customer(name.trim(), Validator.normalizePhone(phone));
        ensureNotWaiting(customer);

        // Parties already in line get first claim on any free table.
        offerFreeTablesToWaitlist();

        Table table = bestFit(partySize, now(), preferredSection, null, true);
        if (table != null) {
            Reservation r = seatWalkIn(customer, partySize, preferredSection, table);
            fire(NotificationType.INFO, "Walk-in seated immediately: " + describe(r) + ".");
            fireDataChanged();
            return WalkInResult.seated(r, table);
        }
        WaitlistEntry entry = enqueue(customer, partySize, preferredSection);
        int position = waitlist.positionOf(entry.getId());
        fireDataChanged();
        return WalkInResult.waitlisted(entry, position, waitlist.estimatedWaitMinutes(position));
    }

    /** Adds a party straight to the waitlist (e.g. they would rather wait for the patio). */
    public synchronized WaitlistEntry addToWaitlist(String name, String phone, int partySize, Section preferredSection)
            throws RestaurantException {
        Validator.validateCustomer(name, phone);
        Validator.validatePartySize(partySize);
        Customer customer = new Customer(name.trim(), Validator.normalizePhone(phone));
        ensureNotWaiting(customer);
        WaitlistEntry entry = enqueue(customer, partySize, preferredSection);
        fireDataChanged();
        return entry;
    }

    /** Seats a waitlisted party at the table held for them, or at the best table free right now. */
    public synchronized Reservation seatFromWaitlist(String entryId) throws RestaurantException {
        WaitlistEntry entry = getWaitlistEntry(entryId);
        Table table = null;
        if (entry.getHeldTableNumber() != null) {
            table = findTable(entry.getHeldTableNumber());
        }
        if (table == null) {
            table = bestFit(entry.getPartySize(), now(), entry.getPreferredSection(), null, true);
            if (table == null) {
                throw new TableNotAvailableException("No suitable table is free yet for " + entry
                        + ". They remain #" + waitlist.positionOf(entry.getId()) + " on the waitlist.");
            }
        }
        waitlist.remove(entry.getId());
        Reservation r = seatWalkIn(entry.getCustomer(), entry.getPartySize(), entry.getPreferredSection(), table);
        fire(NotificationType.INFO, "Seated waitlisted party " + entry.getId() + " after "
                + entry.minutesWaiting(now()) + " min: " + describe(r) + ".");
        fireDataChanged();
        return r;
    }

    /** The party left or no longer wants a table. Any table held for them is offered to the next party. */
    public synchronized void removeFromWaitlist(String entryId) throws RestaurantException {
        WaitlistEntry entry = getWaitlistEntry(entryId);
        waitlist.remove(entry.getId());
        Table held = entry.getHeldTableNumber() == null ? null : findTable(entry.getHeldTableNumber());
        if (held != null && entry.getId().equals(held.getHeldFor())) {
            held.free();
            scheduleAvailabilityCheck(held, 0);
        }
        fire(NotificationType.INFO, "Removed " + entry + " from the waitlist.");
        fireDataChanged();
    }

    public synchronized WaitlistEntry getWaitlistEntry(String entryId) throws NotFoundException {
        WaitlistEntry entry = entryId == null ? null : waitlist.find(entryId.trim());
        if (entry == null) {
            throw new NotFoundException("No waitlist entry with id \"" + entryId + "\".");
        }
        return entry;
    }

    public synchronized List<WaitlistEntry> getWaitlist() {
        return waitlist.snapshot();
    }

    public synchronized int getWaitlistPosition(String entryId) {
        return waitlist.positionOf(entryId);
    }

    // ------------------------------------------------------------------ module 4: table assignment & seating

    /** Guests with a reservation arrive and are seated at their assigned table. */
    public synchronized Reservation checkIn(String id) throws RestaurantException {
        Reservation r = getReservation(id);
        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new InvalidReservationException("Only confirmed reservations can be checked in; " + r.getId()
                    + " is " + r.getStatus().getLabel().toLowerCase() + ".");
        }
        Table table = getTable(r.getTableNumber());
        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new TableNotAvailableException("Table " + table.getNumber() + " is still occupied. Edit "
                    + r.getId() + " to move the party to another table.");
        }
        if (table.getStatus() == TableStatus.RESERVED && !r.getId().equals(table.getHeldFor())) {
            throw new TableNotAvailableException("Table " + table.getNumber() + " is being held for "
                    + table.getHeldFor() + ". Edit " + r.getId() + " to move the party to another table.");
        }
        table.occupy(r.getId());
        r.setStatus(ReservationStatus.SEATED);
        r.setSeatedAt(now());
        lateAlertsSent.remove(r.getId());
        fire(NotificationType.INFO, "Checked in " + describe(r) + ".");
        fireDataChanged();
        return r;
    }

    /** Guests have left: close their visit and start the bussing -> waitlist notification cycle. */
    public synchronized void releaseTable(int number) throws RestaurantException {
        Table table = getTable(number);
        if (table.getStatus() != TableStatus.OCCUPIED) {
            throw new InvalidTableException("Table " + number + " is not occupied.");
        }
        Reservation r = reservationById.get(table.getOccupiedBy());
        if (r != null) {
            r.setStatus(ReservationStatus.COMPLETED);
            r.setCompletedAt(now());
        }
        table.free();
        fire(NotificationType.INFO, "Table " + number + " released"
                + (r != null ? " (" + r.getCustomer().getName() + " finished)" : "") + ". Resetting the table...");
        fireDataChanged();
        scheduleAvailabilityCheck(table, bussingDelayMs);
    }

    // ------------------------------------------------------------------ module 5: availability notification

    /**
     * Offers a free table to whoever should get it next: first a reservation due within the hold window,
     * otherwise the earliest waitlisted party that fits. Called by {@link WaitlistNotifier} threads.
     */
    public synchronized void processAvailability(int tableNumber) {
        Table table = findTable(tableNumber);
        if (table == null || table.getStatus() != TableStatus.AVAILABLE) {
            return;
        }
        if (!offerTable(table)) {
            fire(NotificationType.INFO, "Table " + tableNumber + " is ready and available.");
        }
        fireDataChanged();
    }

    /** Periodic sweep run by {@link ReservationMonitor}: hold tables, flag late parties, serve the waitlist. */
    public synchronized void runHousekeeping() {
        LocalDateTime now = now();
        for (Reservation r : getReservationsBetween(now.minusMinutes(HOLD_WINDOW_MINUTES),
                now.plusMinutes(HOLD_WINDOW_MINUTES).plusSeconds(1))) {
            holdIfDue(r);
        }
        for (Reservation r : getReservationsOn(now.toLocalDate())) {
            if (r.getStatus() == ReservationStatus.CONFIRMED
                    && !now.isBefore(r.getDateTime().plusMinutes(LATE_GRACE_MINUTES))
                    && lateAlertsSent.add(r.getId())) {
                fire(NotificationType.WARNING, describe(r) + " is " + TimeUtil.minutesBetween(r.getDateTime(), now)
                        + " min late. Call the guest or mark as no-show.");
            }
        }
        offerFreeTablesToWaitlist();
        fireDataChanged();
    }

    // ------------------------------------------------------------------ persistence

    public synchronized RestaurantSnapshot createSnapshot() {
        return new RestaurantSnapshot(tables, reservations, waitlist.snapshot(), now());
    }

    /**
     * Replaces all state with a saved snapshot and rebuilds the HashMap / TreeMap indexes.
     * Visits left open on an earlier day are closed, so the floor starts clean after an overnight restart.
     */
    public synchronized String restoreSnapshot(RestaurantSnapshot snapshot) {
        clearState();
        tables.addAll(snapshot.getTables());
        Collections.sort(tables, Comparator.comparingInt(Table::getNumber));
        for (Reservation r : snapshot.getReservations()) {
            index(r);
            Reservation.ensureSequenceAtLeast(Reservation.numberOf(r.getId()));
        }
        for (WaitlistEntry e : snapshot.getWaitlist()) {
            waitlist.enqueue(e);
            WaitlistEntry.ensureSequenceAtLeast(WaitlistEntry.numberOf(e.getId()));
        }

        LocalDate today = now().toLocalDate();
        int closedVisits = 0, missedBookings = 0;
        for (Reservation r : reservations) {
            if (r.getStatus() == ReservationStatus.SEATED && r.getSeatedAt().toLocalDate().isBefore(today)) {
                r.setStatus(ReservationStatus.COMPLETED);
                r.setCompletedAt(r.getSeatedAt().plusMinutes(Reservation.DINING_MINUTES));
                Table t = findTable(r.getTableNumber());
                if (t != null && r.getId().equals(t.getOccupiedBy())) t.free();
                closedVisits++;
            } else if (r.getStatus() == ReservationStatus.CONFIRMED && r.getDateTime().toLocalDate().isBefore(today)) {
                r.setStatus(ReservationStatus.NO_SHOW);
                missedBookings++;
            }
        }
        if (!snapshot.getSavedAt().toLocalDate().equals(today)) {
            // yesterday's walk-in queue has long gone home
            waitlist.clear();
        }
        // Drop holds that no longer make sense (booking closed, or no longer due soon).
        for (Table t : tables) {
            if (t.getStatus() != TableStatus.RESERVED) continue;
            Reservation r = reservationById.get(t.getHeldFor());
            WaitlistEntry e = waitlist.find(t.getHeldFor());
            boolean validReservationHold = r != null && r.getStatus() == ReservationStatus.CONFIRMED && isDueSoon(r);
            if (!validReservationHold && e == null) t.free();
        }

        String summary = "Loaded " + tables.size() + " tables, " + reservations.size() + " reservations and "
                + waitlist.size() + " waiting parties (saved " + TimeUtil.formatDayTime(snapshot.getSavedAt()) + ")."
                + (closedVisits > 0 ? " Closed " + closedVisits + " visit(s) left open from an earlier day." : "")
                + (missedBookings > 0 ? " Marked " + missedBookings + " past booking(s) as no-show." : "");
        fire(NotificationType.INFO, summary);
        fireDataChanged();
        return summary;
    }

    /** Wipes every table, reservation and waitlist entry. */
    public synchronized void reset() {
        clearState();
        fire(NotificationType.INFO, "All data cleared.");
        fireDataChanged();
    }

    private void clearState() {
        tables.clear();
        reservations.clear();
        reservationById.clear();
        reservationsByTime.clear();
        waitlist.clear();
        lateAlertsSent.clear();
    }

    // ------------------------------------------------------------------ helpers used by the GUI & reports

    /** Earliest confirmed reservation on this table from (now - hold window) onward, or null. */
    public synchronized Reservation nextReservationForTable(int number) {
        for (List<Reservation> slot : reservationsByTime.tailMap(now().minusMinutes(HOLD_WINDOW_MINUTES), true).values()) {
            for (Reservation r : slot) {
                if (r.getStatus() == ReservationStatus.CONFIRMED && isOnTable(r, number)) return r;
            }
        }
        return null;
    }

    /** Human-readable "who is at / waiting for this table". */
    public synchronized String describeTableAssignment(Table table) {
        String id = table.getStatus() == TableStatus.OCCUPIED ? table.getOccupiedBy() : table.getHeldFor();
        if (id == null) return "";
        Reservation r = reservationById.get(id);
        if (r != null) {
            return r.getId() + " - " + r.getCustomer().getName() + " (" + r.getPartySize() + ")";
        }
        WaitlistEntry e = waitlist.find(id);
        return e != null ? e.getId() + " - " + e.getCustomer().getName() + " (" + e.getPartySize() + ", waitlist)" : id;
    }

    public synchronized int countSeatedGuests() {
        int guests = 0;
        for (Reservation r : reservations) {
            if (r.getStatus() == ReservationStatus.SEATED) guests += r.getPartySize();
        }
        return guests;
    }

    public static String describe(Reservation r) {
        return r.getId() + " (" + r.getCustomer().getName() + ", party of " + r.getPartySize() + ", "
                + TimeUtil.formatDayTime(r.getDateTime())
                + (r.getTableNumber() != null ? ", table " + r.getTableNumber() : "") + ")";
    }

    // ------------------------------------------------------------------ internals

    private Table findTable(Integer number) {
        if (number == null) return null;
        for (Table t : tables) {
            if (t.getNumber() == number) return t;
        }
        return null;
    }

    private static boolean isOnTable(Reservation r, int number) {
        return r.getTableNumber() != null && r.getTableNumber() == number;
    }

    private void index(Reservation r) {
        reservations.add(r);
        reservationById.put(r.getId(), r);
        indexTime(r);
    }

    private void indexTime(Reservation r) {
        reservationsByTime.computeIfAbsent(r.getDateTime(), k -> new ArrayList<>()).add(r);
    }

    private void unindexTime(Reservation r) {
        List<Reservation> slot = reservationsByTime.get(r.getDateTime());
        if (slot != null) {
            slot.remove(r);
            if (slot.isEmpty()) reservationsByTime.remove(r.getDateTime());
        }
    }

    /** Picks the requested table if it is valid, otherwise the smallest free table that fits (best fit). */
    private Table chooseTable(int partySize, LocalDateTime start, Section preferred, Integer requestedTable,
                              String ignoreId) throws RestaurantException {
        if (requestedTable != null) {
            Table table = getTable(requestedTable);
            Validator.validateFits(table, partySize);
            Reservation clash = findConflict(table, start, ignoreId);
            if (clash != null) {
                throw new TableNotAvailableException("Table " + table.getNumber() + " is already booked by "
                        + clash.getId() + " around " + TimeUtil.formatDayTime(start) + ". Choose another table or time.");
            }
            if (isBlockedByWaitlistHold(table, start)) {
                throw new TableNotAvailableException("Table " + table.getNumber()
                        + " is being held for a waitlisted party right now.");
            }
            return table;
        }
        Table best = bestFit(partySize, start, preferred, ignoreId, false);
        if (best == null && preferred != null) {
            best = bestFit(partySize, start, null, ignoreId, false);
        }
        if (best == null) {
            throw new TableNotAvailableException("No table for a party of " + partySize + " is free around "
                    + TimeUtil.formatDayTime(start) + ". Try another time, or add the guests to the waitlist.");
        }
        return best;
    }

    private Table bestFit(int partySize, LocalDateTime start, Section section, String ignoreId, boolean mustBeFreeNow) {
        Table best = null;
        for (Table t : tables) {
            if (t.getCapacity() < partySize) continue;
            if (section != null && t.getSection() != section) continue;
            if (mustBeFreeNow && t.getStatus() != TableStatus.AVAILABLE) continue;
            if (findConflict(t, start, ignoreId) != null) continue;
            if (isBlockedByWaitlistHold(t, start)) continue;
            // tables are sorted by number, so ties keep the lowest-numbered table
            if (best == null || t.getCapacity() < best.getCapacity()) best = t;
        }
        return best;
    }

    /** An active reservation on this table whose dining window overlaps a new party starting at {@code start}. */
    private Reservation findConflict(Table table, LocalDateTime start, String ignoreId) {
        LocalDateTime end = start.plusMinutes(Reservation.DINING_MINUTES);
        for (Reservation r : reservations) {
            if (!r.getStatus().isActive() || !isOnTable(r, table.getNumber()) || r.getId().equals(ignoreId)) continue;
            LocalDateTime busyFrom;
            LocalDateTime busyTo;
            if (r.getStatus() == ReservationStatus.SEATED) {
                // A seated party keeps the table at least until now, even if they are staying longer than planned.
                busyFrom = r.getSeatedAt();
                LocalDateTime planned = r.getSeatedAt().plusMinutes(Reservation.DINING_MINUTES);
                busyTo = planned.isAfter(now()) ? planned : now().plusMinutes(1);
            } else {
                busyFrom = r.getDateTime();
                busyTo = r.getEndTime();
            }
            if (start.isBefore(busyTo) && end.isAfter(busyFrom)) return r;
        }
        return null;
    }

    private boolean isBlockedByWaitlistHold(Table table, LocalDateTime start) {
        return heldWaitlistEntry(table) != null && start.isBefore(now().plusMinutes(Reservation.DINING_MINUTES));
    }

    private WaitlistEntry heldWaitlistEntry(Table table) {
        return table.getStatus() == TableStatus.RESERVED && table.getHeldFor() != null
                ? waitlist.find(table.getHeldFor()) : null;
    }

    private void ensureNoOverlappingBooking(Customer customer, LocalDateTime start, String ignoreId)
            throws InvalidReservationException {
        for (Reservation r : reservations) {
            if (r.getStatus() == ReservationStatus.CONFIRMED && r.getCustomer().equals(customer)
                    && !r.getId().equals(ignoreId)
                    && Math.abs(TimeUtil.minutesBetween(r.getDateTime(), start)) < Reservation.DINING_MINUTES) {
                throw new InvalidReservationException(customer.getName() + " already has reservation " + r.getId()
                        + " at " + TimeUtil.formatDayTime(r.getDateTime()) + ".");
            }
        }
    }

    private void ensureNotWaiting(Customer customer) throws InvalidReservationException {
        WaitlistEntry existing = waitlist.findByPhone(customer.getPhone());
        if (existing != null) {
            throw new InvalidReservationException(existing.getCustomer().getName() + " is already on the waitlist as "
                    + existing.getId() + " (#" + waitlist.positionOf(existing.getId()) + ").");
        }
    }

    private WaitlistEntry enqueue(Customer customer, int partySize, Section preferred) {
        WaitlistEntry entry = new WaitlistEntry(customer, partySize, preferred, now());
        waitlist.enqueue(entry);
        int position = waitlist.positionOf(entry.getId());
        fire(NotificationType.INFO, "Added " + entry + " to the waitlist at #" + position + " (about "
                + waitlist.estimatedWaitMinutes(position) + " min"
                + (preferred != null ? ", wants " + preferred : "") + ").");
        return entry;
    }

    private Reservation seatWalkIn(Customer customer, int partySize, Section preferred, Table table) {
        Reservation r = new Reservation(customer, partySize, now(), preferred, "", true);
        r.setTableNumber(table.getNumber());
        r.setStatus(ReservationStatus.SEATED);
        r.setSeatedAt(now());
        index(r);
        table.occupy(r.getId());
        return r;
    }

    private void closeUnseated(Reservation r, ReservationStatus newStatus, String verb) throws InvalidReservationException {
        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new InvalidReservationException("Only confirmed reservations can be changed this way; " + r.getId()
                    + " is " + r.getStatus().getLabel().toLowerCase() + ".");
        }
        r.setStatus(newStatus);
        releaseHoldFor(r);
        fire(NotificationType.INFO, verb + " " + describe(r) + ".");
        fireDataChanged();
    }

    private void releaseHoldFor(Reservation r) {
        Table table = findTable(r.getTableNumber());
        if (table != null && r.getId().equals(table.getHeldFor())) {
            table.free();
            scheduleAvailabilityCheck(table, 0);
        }
    }

    private boolean isDueSoon(Reservation r) {
        LocalDateTime now = now();
        return !r.getDateTime().isBefore(now.minusMinutes(HOLD_WINDOW_MINUTES))
                && !r.getDateTime().isAfter(now.plusMinutes(HOLD_WINDOW_MINUTES));
    }

    /** Holds the assigned table for a reservation that is about to arrive. */
    private boolean holdIfDue(Reservation r) {
        if (r.getStatus() != ReservationStatus.CONFIRMED || !isDueSoon(r)) return false;
        Table table = findTable(r.getTableNumber());
        if (table == null || table.getStatus() != TableStatus.AVAILABLE) return false;
        table.hold(r.getId());
        fire(NotificationType.ALERT, "Table " + table.getNumber() + " is now held for " + describe(r) + ".");
        return true;
    }

    private void offerFreeTablesToWaitlist() {
        for (Table t : tables) {
            if (t.getStatus() == TableStatus.AVAILABLE) offerTable(t);
        }
    }

    private boolean offerTable(Table table) {
        for (Reservation r : getReservationsBetween(now().minusMinutes(HOLD_WINDOW_MINUTES),
                now().plusMinutes(HOLD_WINDOW_MINUTES).plusSeconds(1))) {
            if (isOnTable(r, table.getNumber()) && holdIfDue(r)) return true;
        }
        // Don't hand the table to a walk-in if a booked party needs it within the next dining window.
        if (findConflict(table, now(), null) != null) return false;
        WaitlistEntry entry = waitlist.firstFitFor(table);
        if (entry == null) return false;
        entry.holdTable(table.getNumber(), now());
        table.hold(entry.getId());
        fire(NotificationType.ALERT, table + " is free - page waitlisted party " + entry
                + " (#" + waitlist.positionOf(entry.getId()) + " in line, waited " + entry.minutesWaiting(now()) + " min).");
        return true;
    }

    private void scheduleAvailabilityCheck(Table table, long delayMs) {
        if (asyncNotifications) {
            Thread t = new Thread(new WaitlistNotifier(this, table.getNumber(), delayMs),
                    "waitlist-notifier-table-" + table.getNumber());
            t.setDaemon(true);
            t.start();
        } else {
            offerTable(table);
        }
    }

    private static String sectionNote(Section preferred, Table table) {
        if (preferred != null && table.getSection() != preferred) {
            return " - " + preferred + " was full, assigned " + table.getSection() + ".";
        }
        return ".";
    }
}
