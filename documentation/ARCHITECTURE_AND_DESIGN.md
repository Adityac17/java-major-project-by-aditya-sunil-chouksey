# Architecture & Design Specification

**Project:** Restaurant Table Reservation & Waitlist System  
**Case Study:** 70 (B.Tech CSE 2025-29, Semester III)  
**Author:** Aditya Sunil Chouksey (Roll: `150096725070`)  

---

## 1. Architectural Overview

The system follows a strict **Layered Architecture** adhering to **Separation of Concerns (SoC)** and **Single Responsibility Principle (SRP)**. The GUI layer contains no business rules, table assignment algorithms, or persistence logic; all domain operations are executed via the `RestaurantManager` service layer.

```
+-----------------------------------------------------------------+
|                           GUI Layer                             |
|  MainFrame  |  TablesPanel  |  ReservationsPanel                |
|  WaitlistPanel  |  ReportsPanel  |  StatusCellRenderer          |
+-----------------------------------------------------------------+
                                |
             Events & Actions   |   Observer Callbacks (EDT)
                                v
+-----------------------------------------------------------------+
|                         Service Layer                           |
|  RestaurantManager (Synchronized Core Engine)                   |
|  ReservationMonitor (Daemon Sweep Thread)                       |
|  WaitlistNotifier (Async Busser/Notification Thread)            |
|  ReportGenerator  |  SampleData  |  WalkInResult                |
+-----------------------------------------------------------------+
           |                                  |
           v                                  v
+-----------------------+          +------------------------------+
|     Model Layer       |          |      Persistence Layer       |
|  Table, Reservation   |          |  DataStore (Atomic write)    |
|  Customer, Waitlist   |          |  RestaurantSnapshot          |
|  WaitlistEntry, Enums |          +------------------------------+
+-----------------------+                         |
           |                                      v
           v                               +--------------+
+-----------------------+                  |  FileSystem  |
|      Util Layer       |                  |  restaurant  |
|  Validator, TimeUtil  |                  |  .dat file   |
+-----------------------+                  +--------------+
```

---

## 2. Object-Oriented Principles in Action

### A. Encapsulation & Information Hiding
- All class fields in `model/` and `service/` are marked `private`.
- Mutable states are modified solely through explicit domain methods with invariant validation (e.g., `Table.hold()`, `Table.occupy()`, `Table.release()`).
- In `RestaurantManager`, getter methods return defensive shallow copies or unmodifiable collections (`new ArrayList<>(tables)`), protecting internal state from external tampering.

### B. Polymorphism & Interface Segregation
- **Observer Pattern (`RestaurantListener`):** Decouples the business service layer from Swing UI. `RestaurantManager` notifies registered listeners of events (`onStateChanged`, `onNotification`) without knowing anything about Swing components.
- **Dynamic Sorting (`Comparator<Reservation>`):** The `SortField` enum defines polymorphically how reservations are compared across time, party size, customer name, table number, or status.
- **Search Abstraction (`SearchField`):** Enables partial match predicate filtering across customer names, phone numbers, table numbers, and reservation IDs.

### C. Type Safety via Custom Enums
- `TableStatus`: `AVAILABLE`, `RESERVED`, `OCCUPIED`.
- `ReservationStatus`: `CONFIRMED`, `SEATED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. Provides helper methods like `isActive()` to identify bookings currently occupying or holding tables.
- `Section`: `MAIN_HALL`, `PATIO`, `BAR`, `PRIVATE_ROOM`.
- `NotificationType`: `INFO`, `WARNING`, `ALERT`.

---

## 3. Collections Framework & Algorithmic Complexities

The system purposefully utilizes distinct Java collection classes tailored to algorithmic demands:

| Collection | Purpose | Big-O Complexity | Justification |
|---|---|---|---|
| `ArrayList<Table>` | Fixed floor plan storage | Lookup: $O(1)$ by index<br>Iteration: $O(N)$ | The floor plan has fixed table count. Iterating for rendering and best-fit search is cache-friendly and fast. |
| `ArrayList<Reservation>` | Audit trail of all bookings | Append: $O(1)$ amortized<br>Iteration: $O(N)$ | Maintains a master log of bookings for historical records and report generation. |
| `HashMap<String, Reservation>` | Instant lookup by Reservation ID | Get: $O(1)$ average<br>Put: $O(1)$ average | Enables immediate lookups when checking in, editing, cancelling, or searching by reservation ID (e.g., `R1001`). |
| `TreeMap<LocalDateTime, List<Reservation>>` | Time-sorted booking calendar | Insert/Delete: $O(\log K)$<br>SubMap Range: $O(\log K + M)$ | Self-balancing Red-Black Tree. Provides logarithmic range extraction (`subMap`) to find bookings arriving within the next 30 minutes, and `tailMap` to query the next booking for any table. |
| `LinkedList<WaitlistEntry>` | Waitlist queue | Enqueue: $O(1)$<br>Dequeue: $O(1)$<br>Mid-removal: $O(1)$ via Iterator | Walk-ins arrive at the tail (`addLast`) and are seated from the front (`pollFirst`). Guests who leave or are seated out-of-order are removed safely using an `Iterator` without $O(N)$ array shifts. |

### Multi-Index Synchronization
To prevent state desynchronization, `RestaurantManager` synchronizes updates across `ArrayList`, `HashMap`, and `TreeMap` atomically inside synchronized methods:
```java
private void index(Reservation r) {
    reservationById.put(r.getId(), r);
    reservationsByTime.computeIfAbsent(r.getStartTime(), k -> new ArrayList<>()).add(r);
}
```

---

## 4. Concurrency & Multithreading Architecture

The application runs a multi-threaded architecture with three execution contexts:

### 1. Swing Event Dispatch Thread (EDT)
- Handles user interactions, button clicks, table selections, and painting.
- The UI never performs blocking I/O or sleep operations.

### 2. `ReservationMonitor` (Daemon Thread)
- A background worker thread running a continuous 15-second loop:
  - Sweeps active reservations.
  - Automatically identifies bookings whose start time is within 30 minutes and triggers a table hold.
  - Marks reservations arriving >15 minutes late as `NO_SHOW` and releases held tables.
- Runs as a daemon thread (`setDaemon(true)`), terminating automatically when the application exits.

### 3. `WaitlistNotifier` (Asynchronous Notification Worker)
- When a table is released, a `WaitlistNotifier` thread is spawned to simulate bussing/cleaning delay (e.g., 2 seconds).
- Once ready, it checks the waitlist for the earliest fitting party and raises a high-priority alert (`[READY]` beep and yellow banner) to the host.

### Thread Safety & Deadlock Prevention
- All mutation and query methods in `RestaurantManager` are `synchronized` on the manager instance.
- Whenever a background thread needs to push updates to the UI, it delegates to `SwingUtilities.invokeLater()` to ensure thread-safe execution on the EDT.

---

## 5. Persistence & Fault Tolerance

Data reliability is managed by `DataStore`:
- **Atomic File Swapping:** The serialized state is first written to a temporary file (`data/restaurant.dat.tmp`). Only upon successful write and flush is it atomically renamed/moved over `data/restaurant.dat`. A mid-save system crash or power cut cannot corrupt existing data.
- **Daily State Rollover:** When loading data from a previous day:
  - Open visits are automatically marked completed.
  - Expired reservations become no-shows.
  - Stale waitlist queues are cleared.
- **Corruption Recovery:** If a `.dat` file is corrupted, it is automatically quarantined to `restaurant.dat.corrupt-<timestamp>` and the system boots with pristine sample data.

---

## 6. Exception Handling & Defensive Validation

A dedicated checked exception hierarchy is rooted at `RestaurantException`:
- `InvalidReservationException`
- `InvalidTableException`
- `TableNotAvailableException`
- `NotFoundException`

All inputs are rigorously validated by `Validator` before reaching domain logic:
- Names: non-empty, letters/spaces only.
- Phone numbers: strict 10-digit Indian standard format (`^[6-9][0-9]{9}$`).
- Party sizes: range 1–20.
- Reservation slots: strict 15-minute grid (`:00`, `:15`, `:30`, `:45`), 11:00 to 22:30 operating hours.
- Strict calendar parsing: invalid calendar dates (e.g., February 30) are rejected immediately.
