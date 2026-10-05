# Restaurant Table Reservation & Waitlist System

[![Java Version](https://img.shields.io/badge/Java-8%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Swing GUI](https://img.shields.io/badge/GUI-Java%20Swing-5382a1?style=for-the-badge)](https://docs.oracle.com/javase/tutorial/uiswing/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20JDK)-brightgreen?style=for-the-badge)](#)
[![Academic Case Study](https://img.shields.io/badge/Case%20Study-70%20(B.Tech%20CSE)-blueviolet?style=for-the-badge)](#)

> **Student:** Aditya Sunil Chouksey (Roll: `150096725070`)  
> **Course:** Java Programming | B.Tech CSE (2025-29), Semester III  
> **Case Study:** Case Study 70 — Restaurant Table Reservation & Waitlist System  
> **Repository:** [java-major-project-by-aditya-sunil-chouksey](https://github.com/Adityac17/java-major-project-by-aditya-sunil-chouksey.git)

---

## Overview

A robust, multi-threaded desktop application designed for a restaurant front-desk host. It manages advance table reservations, handles walk-in arrivals via a fair first-come-first-served waitlist, performs automated best-fit table allocation across various floor sections, and issues real-time audio-visual availability alerts when tables are bused and released.

- **Pure Java:** Zero external dependencies or third-party frameworks. Builds on **Java 8 or newer**.
- **Separation of Concerns:** Clean layered architecture decoupling domain models, business services, multithreading, and the Swing UI.
- **Fault-Tolerant Persistence:** State is saved atomically to `data/restaurant.dat` with crash recovery and daily rollover.

---

## Documentation & Presentation

All core documentation and the presentation deck are organized in the [`documentation/`](./documentation/) folder:

| Document | Description |
|---|---|
| [**Documentation Hub**](./documentation/README.md) | Technical documentation, architecture overview, collections complexity analysis, and concurrency design. |
| [**Presentation Slides (PPTX)**](./documentation/Presentation_Slides.pptx) | Official 9-slide deck with comprehensive speaker notes for viva and project evaluation. |

---

## How to Run

### macOS / Linux
```bash
./run.sh          # compiles classes and launches the GUI
```

If `javac` is not on your `PATH`, specify your `JAVA_HOME`:
```bash
JAVA_HOME=/path/to/jdk ./run.sh
```

### Windows
```cmd
run.bat
```

### IDE Setup (IntelliJ / Eclipse / VS Code)
1. Mark the `src` folder as the **Sources Root**.
2. Run the main class: `com.restaurant.Main`.

On first launch, sample data is automatically populated (12 tables, advance bookings, seated walk-ins, and 2 waitlisted parties). Subsequent launches restore the latest saved state. The **File** menu provides options to *Save Now*, *Reload Saved Data*, *Load Sample Data*, and *Clear All Data*.

---

## Project Structure

```
.
├── documentation/                    Project documentation and presentation
│   ├── README.md                     Comprehensive documentation & technical guide
│   └── Presentation_Slides.pptx      Official 9-slide presentation deck (with notes)
├── src/                              Java source code
│   └── com/restaurant/
│       ├── Main.java                 Application bootstrap & monitor daemon starter
│       ├── model/                    Domain entities
│       │   ├── Table.java            Physical table (number, capacity, section, status)
│       │   ├── Reservation.java      Advance booking or seated walk-in entity
│       │   ├── Customer.java         Guest identity (name + 10-digit phone)
│       │   ├── WaitlistEntry.java    Waitlisted party entity
│       │   ├── Waitlist.java         Fair LinkedList queue
│       │   ├── TableStatus.java      Enum: AVAILABLE, RESERVED, OCCUPIED
│       │   ├── ReservationStatus.java Enum: CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW
│       │   └── Section.java          Enum: MAIN_HALL, PATIO, BAR, PRIVATE_ROOM
│       ├── service/                  Core business logic & multithreading
│       │   ├── RestaurantManager.java Synchronized core manager
│       │   ├── ReservationMonitor.java Background daemon thread (15s sweep)
│       │   ├── WaitlistNotifier.java Asynchronous busser/notification thread
│       │   ├── ReportGenerator.java  Seating & capacity utilization analytics
│       │   ├── RestaurantListener.java Observer callback interface
│       │   ├── WalkInResult.java     Result token (seated vs queued)
│       │   └── SampleData.java       Default demo dataset
│       ├── persistence/              Persistence engine
│       │   ├── DataStore.java        Atomic file serializer (.tmp -> .dat)
│       │   └── RestaurantSnapshot.java Serializable data envelope
│       ├── util/                     Validation & date/time helpers
│       │   ├── Validator.java        Defensive boundary validation
│       │   └── TimeUtil.java         Slot calculation & formatted timestamps
│       ├── exception/                Checked custom exceptions
│       │   ├── RestaurantException.java Base checked exception
│       │   ├── InvalidReservationException.java
│       │   ├── InvalidTableException.java
│       │   ├── TableNotAvailableException.java
│       │   └── NotFoundException.java
│       └── gui/                      Java Swing graphical interface
│           ├── MainFrame.java        Main window, tabs, notification log, banner
│           ├── TablesPanel.java      Live floor plan & table manager
│           ├── ReservationsPanel.java Booking form, search, sort, check-in
│           ├── WaitlistPanel.java    Walk-in intake & queue manager
│           ├── ReportsPanel.java     Operational analytics & text export
│           ├── StatusCellRenderer.java Color-coded table cell renderer
│           └── GuiUtil.java          Shared UI component builders
├── run.sh                            macOS/Linux compilation & execution script
├── run.bat                           Windows compilation & execution script
├── .gitignore                        Git exclusion rules
└── README.md                         This project overview
```

---

## Required Java Concepts & Implementation

| Java Concept | Application in Project | Implementation Details |
|---|---|---|
| **Classes & Objects** | Models physical and operational entities | `Table`, `Reservation`, `Customer`, `Waitlist`, `WaitlistEntry` in `model/`. |
| **Constructors** | Enforces invariant initial state | `Table` initializes as `AVAILABLE`; `Reservation` assigns atomic IDs (`R1001`, `WI1002`) and starts `CONFIRMED`. |
| **Enums** | Strong type safety for domain states | `TableStatus` (`AVAILABLE`, `RESERVED`, `OCCUPIED`), `ReservationStatus`, `Section`, and `NotificationType`. |
| **Multithreading** | Asynchronous operations & background sweeps | `ReservationMonitor` runs a daemon thread sweeping every 15 seconds. `WaitlistNotifier` executes on a worker thread simulating a 2-second busser delay before paging guests. UI updates are safely dispatched via `SwingUtilities.invokeLater()`. |
| **ArrayList** | Indexed collections and audit trails | `RestaurantManager.tables` and `RestaurantManager.reservations`. |
| **LinkedList** | Fair FIFO waitlist queue | `Waitlist.queue`: $O(1)$ `addLast` on arrival, $O(1)$ `pollFirst` for seating, and safe middle-of-queue removal via `Iterator.remove()`. |
| **HashMap** | Instant key-based lookup | `RestaurantManager.reservationById`: $O(1)$ average time complexity for check-ins, edits, and search by ID. |
| **TreeMap** | Self-balancing time-ordered calendar | `RestaurantManager.reservationsByTime`: $O(\log N)$ time range lookups. Uses `subMap()` for reservations due in 30 minutes and `tailMap()` for next-booking queries per table. |
| **CRUD Operations** | Complete lifecycle management | Create (`createReservation`), Read (`getReservation`, `searchReservations`), Update (`updateReservation`, `checkIn`, `cancelReservation`), and Delete (`deleteReservation`). |
| **Searching** | Multi-attribute search | Instant search by customer name (case-insensitive substring), phone digits, table number, or reservation ID. |
| **Sorting** | Dynamic multi-column ordering | Polymorphic sorting via `SortField` enum implementing `Comparator<Reservation>`, with `thenComparing()` tie-breaking. |
| **Swing GUI** | Front-desk host dashboard | `JTabbedPane`, `JTable`, custom `TableCellRenderer`, forms, banners, and beep notifications. |
| **Exception Handling**| Defensive error reporting | Hierarchical checked exceptions rooted at `RestaurantException`. Caught gracefully by UI action handlers with user dialogs. |
| **Validation** | Strict boundary checking | `Validator`: party sizes 1–20, table capacities 1–20, service hours 11:00–22:30, 15-minute slot alignment, max 60 days in advance, strict date verification. |

---

## Seating & Waitlist Rules

1. **Fair Waitlist Allocation:** When a table is freed, the waitlist queue (`LinkedList`) is inspected from head to tail. The earliest waiting party whose size fits the table is offered the seat.
2. **Reservation Dining Protection:** Walk-in or waitlisted guests will **not** be assigned a table if a confirmed reservation is scheduled for that table within the next 90 minutes.
3. **Advance Table Holding:** Exactly 30 minutes before a booked guest is due, the table status automatically switches to `RESERVED` and an alert is logged.
4. **Automatic Release on Cancellation:** Cancelling, marking a no-show, or removing a waitlisted guest immediately frees any held table and reallocates it to the next qualifying party.

---

## Persistence & Crash Safety

- **Atomic Writes:** State is serialized into `data/restaurant.dat.tmp` first. Once writing and flushing finish, the file is atomically renamed to `data/restaurant.dat`, preventing corrupted data in event of an unexpected crash.
- **Daily Rollover:** On subsequent service days, open visits from the previous day are closed, past unfulfilled bookings become no-shows, and outdated waitlists are cleared.
- **Corrupted File Quarantine:** If file corruption occurs, the damaged file is safely renamed to `restaurant.dat.corrupt-<timestamp>` and the system initializes with sample data.

---

## License

Developed by **Aditya Sunil Chouksey** for academic evaluation under B.Tech CSE (Semester III, 2025-29).
