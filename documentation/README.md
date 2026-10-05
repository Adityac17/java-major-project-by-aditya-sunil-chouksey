# Restaurant Table Reservation & Waitlist System
## Documentation Hub

**Student:** Aditya Sunil Chouksey (Roll: `150096725070`)  
**Programme:** B.Tech CSE (2025-29), Semester III  
**Course:** Java Programming  
**Case Study:** Case Study 70 — Restaurant Table Reservation & Waitlist System  
**Repository:** [java-major-project-by-aditya-sunil-chouksey](https://github.com/Adityac17/java-major-project-by-aditya-sunil-chouksey)

---

## Overview

This directory contains the complete technical documentation, design specifications, setup guides, viva preparation material, and demonstration scripts for the **Restaurant Table Reservation & Waitlist System**.

The application is a standalone desktop system built strictly with standard Java (JDK 8+, no external third-party dependencies) using Java Swing for the graphical interface and standard JDK concurrency, collections, and I/O for business operations.

```
documentation/
├── README.md                          This documentation index
├── ARCHITECTURE_AND_DESIGN.md         Detailed system design, OOP principles, collections & threads
├── SETUP_AND_RUN.md                   Prerequisites, build scripts, IDE setup & troubleshooting
├── VIVA_QUESTIONS.md                  Comprehensive Q&A bank for viva evaluation
├── DEMO_SCRIPT.md                     Step-by-step 3-minute and 10-minute live demonstration script
├── Project_Report.docx                Formal university case study project report
├── Setup_and_Run_Guide.pdf            Formatted PDF guide for setup and verification
├── Concepts_and_Study_Guide_Java.pdf  Study guide connecting code to Java syllabus concepts
├── Viva_Questions_and_Answers.pdf     Formatted PDF of viva questions and answers
├── Live_Demo_Script.pdf               Formatted live demo script
├── Presentation_Guide.pdf             Slide-by-slide rehearsal guide and cue cards
├── Presentation_Slides.pptx           Official 9-slide presentation deck with speaker notes
├── uml/                               UML class diagrams and workflow diagrams (SVG & PNG)
│   ├── architecture.png               System architecture diagram
│   ├── class-diagram.svg              Full UML class diagram
│   ├── flowchart-booking.png          Reservation booking workflow
│   └── flowchart-waitlist-notification.png Table release & waitlist notification flow
└── screenshots/                       High-resolution UI screenshots of all tabs
    ├── floor-and-tables.png           Floor plan and live table status
    ├── reservations.png               Booking management, search and filters
    ├── waitlist.png                   Waitlist queue and walk-in arrivals
    └── reports.png                    Analytics, utilization and seating reports
```

---

## Documentation Index

### 1. [Architecture & Design Guide](./ARCHITECTURE_AND_DESIGN.md)
Deep dive into:
- Layered architectural design (Model, Service, Persistence, GUI, Exception, Util)
- Core OOP principles (Encapsulation, Inheritance, Polymorphism, Abstraction)
- Strategic selection and complexity analysis of Collections (`ArrayList`, `LinkedList`, `HashMap`, `TreeMap`)
- Multithreading architecture (`ReservationMonitor` daemon thread and `WaitlistNotifier` asynchronous paging worker)
- Thread synchronization and race-condition prevention across shared state
- Fault-tolerant atomic persistence design (`.tmp` -> `.dat` replacement)

### 2. [Setup & Run Guide](./SETUP_AND_RUN.md)
Comprehensive environment and execution manual:
- System prerequisites (JDK 8 or newer)
- Running via CLI with automated compile & run scripts:
  - macOS / Linux: `./run.sh`
  - Windows: `run.bat`
- IDE import instructions for IntelliJ IDEA, Eclipse, and Visual Studio Code
- Verification test cases and troubleshooting common environment issues

### 3. [Viva Questions & Model Answers](./VIVA_QUESTIONS.md)
Structured question bank for practical exams and viva:
- General project & design questions
- Classes, objects, constructors, and enums
- Collections framework & algorithmic choices
- Threads, concurrency, and Swing Event Dispatch Thread (EDT)
- Persistence, file I/O, and crash resilience
- Exception handling and strict input validation

### 4. [Live Demo Script](./DEMO_SCRIPT.md)
Rehearsed walkthrough for evaluation:
- **3-Minute Quick Demo**: Floor plan visualization, table turnover, automatic waitlist paging, booking validation error demonstration, and reports generation.
- **10-Minute Comprehensive Demo**: Full end-to-end operational flow with edge cases (late arrival notification, dining window protection, table release and auto-hold).

---

## Key Modules & Responsibilities

| Module | Description | Primary Classes |
|---|---|---|
| **Floor & Table Setup** | Floor layout, table capacity, section assignment, live table status (Available, Reserved, Occupied) | `Table`, `Section`, `TableStatus`, `TablesPanel` |
| **Reservation Booking** | Scheduling, customer tracking, automated best-fit table assignment, 90-minute conflict prevention | `Reservation`, `Customer`, `ReservationStatus`, `ReservationsPanel` |
| **Waitlist Management** | Walk-in registration, FIFO queue ordering, estimated wait calculation, manual seating/removal | `Waitlist`, `WaitlistEntry`, `WaitlistPanel` |
| **Availability Notification** | 30-min booking alert, 15-min late mark, auto-paging waitlisted guests when tables free up | `ReservationMonitor`, `WaitlistNotifier`, `RestaurantListener` |
| **Search & Filtering** | Instant search by customer name, phone, table number, or reservation ID, with dynamic sort | `RestaurantManager`, `ReservationsPanel` |
| **Seating Analytics** | Real-time seat utilization, section breakdowns, covers, peak dining hours, waitlist metrics | `ReportGenerator`, `ReportsPanel` |
| **Persistence Engine** | Atomic serialized snapshots, crash recovery, daily rollover of unfulfilled bookings | `DataStore`, `RestaurantSnapshot` |

---

## Formal Documents

- **Case Study Report:** `Project_Report.docx` - Complete academic report following university formatting standards.
- **Presentation Deck:** `Presentation_Slides.pptx` - 9-slide presentation deck with comprehensive speaker notes.
- **Slide Guide:** `Presentation_Guide.pdf` - Slide-by-slide delivery plan, timing recommendations, and cue cards.
