# Restaurant Table Reservation & Waitlist System
## Project Documentation & Presentation

**Student:** Aditya Sunil Chouksey (Roll: `150096725070`)  
**Programme:** B.Tech CSE (2025-29), Semester III  
**Course:** Java Programming  
**Case Study:** Case Study 70 — Restaurant Table Reservation & Waitlist System  
**Repository:** [java-major-project-by-aditya-sunil-chouksey](https://github.com/Adityac17/java-major-project-by-aditya-sunil-chouksey)

---

## 1. Documentation Overview

This folder contains the core presentation and technical documentation for the **Restaurant Table Reservation & Waitlist System**.

```
documentation/
├── README.md                 Comprehensive technical documentation and viva guide
└── Presentation_Slides.pptx  Official 9-slide presentation deck (with full speaker notes)
```

---

## 2. Presentation Deck

The official project presentation is available in this folder:
- **Slide Deck:** [`Presentation_Slides.pptx`](./Presentation_Slides.pptx)

### Slide Contents & Structure:
1. **Title & Student Credentials:** Project name, author details, course, and case study number.
2. **Problem Statement & Objectives:** Host pain points, table turnover, waitlist fairness, and automated allocation.
3. **System Architecture:** Layered design separating GUI, Service, Model, Persistence, and Util layers.
4. **Core OOP & Collections:** Practical usage of `ArrayList`, `LinkedList`, `HashMap`, and `TreeMap`.
5. **Multithreading & Concurrency:** Background sweep daemon (`ReservationMonitor`) and asynchronous paging (`WaitlistNotifier`).
6. **Key Modules & UI Walkthrough:** Floor plan, reservation manager, waitlist queue, and seating reports.
7. **Business Rules & Seating Fairness:** 90-minute dining window, best-fit assignment, and 30-minute advance table holding.
8. **Crash-Resilient Persistence:** Atomic file replacement (`.tmp` -> `.dat`) and daily state rollover.
9. **Conclusion & Viva Highlights:** Summary of technical achievements and evaluation takeaways.

---

## 3. System Architecture & Technical Highlights

### A. Layered Architecture
- **GUI Layer (`com.restaurant.gui`):** Swing components (`MainFrame`, `TablesPanel`, `ReservationsPanel`, `WaitlistPanel`, `ReportsPanel`). Fully decoupled from business logic; dispatches updates safely via the Event Dispatch Thread (EDT).
- **Service Layer (`com.restaurant.service`):** `RestaurantManager` controls domain rules and coordinates threads. All mutation methods are `synchronized` to eliminate race conditions.
- **Model Layer (`com.restaurant.model`):** Domain entities (`Table`, `Reservation`, `Customer`, `Waitlist`, `WaitlistEntry`) and type-safe enums (`TableStatus`, `ReservationStatus`, `Section`, `NotificationType`).
- **Persistence Layer (`com.restaurant.persistence`):** `DataStore` manages atomic Java object serialization to prevent data corruption during unexpected halts.
- **Util & Exception Layers:** `Validator` enforces strict boundaries (1-20 party sizes, 15-minute slot alignment, valid calendar dates) and throws checked exceptions under `RestaurantException`.

### B. Collections Complexity & Justifications
- **`ArrayList<Table>` & `ArrayList<Reservation>`:** Efficient index-based rendering for floor layouts and complete historical audit logs.
- **`HashMap<String, Reservation>`:** Provides $O(1)$ average time complexity for instant lookups by reservation ID.
- **`TreeMap<LocalDateTime, List<Reservation>>`:** Self-balancing Red-Black Tree providing $O(\log N)$ time-range queries (`subMap` for bookings due within 30 minutes, `tailMap` for subsequent bookings).
- **`LinkedList<WaitlistEntry>`:** Fair FIFO waitlist queue enabling $O(1)$ enqueuing at tail, $O(1)$ dequeuing from head, and safe iterator removals without array reallocations.

### C. Concurrency Model
1. **`ReservationMonitor` (Daemon Thread):** Sweeps active reservations every 15 seconds, automatically holding tables 30 minutes before arrival and flagging no-shows after 15 minutes.
2. **`WaitlistNotifier` (Worker Thread):** Spawns asynchronously upon table release, simulating a 2-second cleaning/bussing delay before paging the earliest fitting guest on the waitlist.
3. **Thread Safety:** Coordinated through synchronized methods in `RestaurantManager` and non-blocking EDT delegation via `SwingUtilities.invokeLater()`.

---

## 4. Quick Execution Guide

From the root project directory:
- **macOS / Linux:** `./run.sh`
- **Windows:** `run.bat`
- **IDE:** Open project root, set `src` as Sources Root, and run `com.restaurant.Main`.
