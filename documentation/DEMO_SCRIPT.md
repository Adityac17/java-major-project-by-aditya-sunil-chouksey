# Live Demonstration Script & Evaluation Guide

**Project:** Restaurant Table Reservation & Waitlist System  
**Case Study:** Case Study 70 (B.Tech CSE 2025-29, Semester III)  
**Author:** Aditya Sunil Chouksey (Roll: `150096725070`)  

---

## Preparation Checklist (5 Minutes Prior)

1. **Service Hours Timing:** Run the demo between **11:00 and 22:30** (ideally 12:00-21:00). Sample data adds today's bookings within active service hours.
2. **Fresh Baseline Data:** Launch the app, then select **File** -> **Load Sample Data** -> **Yes** (or delete the `data/` folder and restart).
3. **Window Sizing:** Maximize the window or size it cleanly for projection.
4. **Audio Enabled:** Ensure system sound is turned on to hear the `[READY]` notification alert beep.
5. **Terminal Ready:** Keep a terminal window open in the project folder with `./run.sh` ready for restart demonstration.
6. **Code Editor Open:** Keep `RestaurantManager.java`, `Waitlist.java`, and `WaitlistNotifier.java` open in your editor to quickly show code upon request.

---

## 1. 10-Minute Comprehensive Evaluation Demo

### Timeline & Action Guide

| Time | Tab / Screen | Action (Do) | Explanation (Say) |
|---|---|---|---|
| **0:00 - 0:45** | **Floor & Tables** | Point at live table cards and header metrics. | *"This is my Restaurant Table Reservation and Waitlist System, built in pure Java with Swing. The host sees the whole floor here: 12 tables across four sections, color-coded: green for Available, yellow for Reserved, and red for Occupied. The header tracks live table availability, waitlist count, and current covers; the lower panel displays the live event and notification log."* |
| **0:45 - 2:00** | **Floor & Tables** | Point at Table 5 (Reserved for W002) and Table 1 (Reserved for Meera Joshi). Click **Add Table**: Table 13, 4 seats, Main Hall. Then select Table 13 -> **Edit Table** -> set Seats to 25. | *"Module 1: Table Setup. Table 5 is held for a waitlist party, and Table 1 for a reservation arriving within 30 minutes. When I add Table 13, it appears immediately. If I try to assign 25 seats, our Validator rejects it: valid tables have 1 to 20 seats. Strict input validation protects every form in the system."* |
| **2:00 - 3:45** | **Reservations** | Enter: Rahul Verma, `9811122233`, Party: 21 -> **Book** (Rejected). Change to Party 4, Time: `19:07` -> **Book** (Rejected: 15-min slots). Change date to `2026-02-30` -> **Book** (Rejected: strict date validation). Set tomorrow 19:00 -> **Book** (Confirmed!). Type "YA" in Search box and change Sort to "Party Size". | *"Module 2 & 4: Booking & Assignment. The form enforces strict rules: party limit is 20, reservations must sit on 15-minute clock intervals, and non-existent calendar dates like Feb 30 are rejected. For valid bookings, the system uses Best-Fit Table Assignment to reserve the smallest suitable table, keeping large tables free for larger groups. Module 6: Live search operates instantaneously with custom Comparators for multi-column sorting."* |
| **3:45 - 5:15** | **Walk-ins & Waitlist** | Walk-in 1: Kiran Das, `9877700011`, Party 2, Any -> **Walk-in Arrived**. Walk-in 2: Zoya Mirza, `9877700022`, Party 2, Patio -> **Walk-in Arrived**. | *"Module 3: Waitlist Management. Kiran is seated immediately at an available 2-top. Zoya requests Patio seating, which is currently full, so she is automatically enqueued at position #1 with an estimated wait time. The waitlist uses a LinkedList queue to ensure strict FIFO fairness."* |
| **5:15 - 6:45** | **Floor & Tables** | Select Table 8 (Occupied, Patio) -> **Release Table**. Wait ~2 seconds for the busser delay, audio beep, and yellow alert banner. Select Table 8 -> **Seat Held Party**. | *"Module 5: Availability Notification. When guests depart, a separate WaitlistNotifier thread simulates table cleaning and bussing for 2 seconds while the UI stays fully responsive. The background thread checks the waitlist for the earliest fitting guest. Isha Verma was waiting for Patio, so Table 8 is automatically held and a prompt instructs the host to page her. One click seats the party."* |
| **6:45 - 7:45** | **Reservations** | Select Meera Joshi (Confirmed, arriving soon) -> **Check In**. Show Table 1 turn red on the Floor tab. | *"Bookings are protected: Meera Joshi is arriving within 30 minutes, so Table 1 was held automatically by the ReservationMonitor daemon thread sweeping every 15 seconds. When the party arrives, checking them in occupies the table. If a guest is over 15 minutes late, a warning alerts the host to mark a no-show."* |
| **7:45 - 8:45** | **Seating Reports & CLI** | Click **Refresh** in Seating Reports. Close the application. Switch to terminal and run `./run.sh`. | *"Module 7: Seating Analytics & Persistence. Reports summarize floor status, capacity utilization, covers, and peak hours. When the application closes, all changes are saved atomically to data/restaurant.dat. Upon relaunching, the state is completely restored without data loss."* |
| **8:45 - 10:00** | **Source Code** | Show `RestaurantManager.java` collections, `WaitlistNotifier.java` thread, and `synchronized` methods. | *"Under the hood: ArrayList for tables, HashMap for O(1) ID lookups, TreeMap for time-range queries, and LinkedList for FIFO waitlist management. All operations are thread-safe and coordinated across the Swing Event Dispatch Thread."* |

---

## 2. 3-Minute Quick Demo (Speed Run)

1. **Floor Plan (30s):** Open the app. Point out Green (Available), Yellow (Held/Reserved), and Red (Occupied) tables. Note Table 5 is held for waitlist party W002. Click **Seat Held Party**.
2. **Table Release & Thread Paging (60s):** Select an Occupied patio table (e.g. Table 8) -> click **Release Table**. Watch the 2-second background cleaning delay, listen for the beep, and show the yellow banner prompting to page Isha Verma.
3. **Reservations & Validation (45s):** Switch to **Reservations**. Demonstrate validation: attempt party size 25 or invalid time `19:07`. Make a valid booking for 4 guests and show automatic best-fit table assignment.
4. **Reports & Save (45s):** Switch to **Seating Reports**, click **Refresh** to show updated occupancy numbers. Close the app and rerun `./run.sh` to prove atomic persistence.

---

## 3. Verbal Transitions for Smooth Delivery

- **Floor -> Reservations:** *"Now let me show how the host takes a advance booking."*
- **Reservations -> Waitlist:** *"Not all guests book ahead - here is what happens when walk-ins arrive."*
- **Waitlist -> Floor (Release):** *"Now the core automation of the system - how released tables trigger intelligent guest paging."*
- **Release -> Check-in:** *"The same engine actively protects pre-booked reservations."*
- **Check-in -> Reports:** *"At the end of service, the management needs clear operational analytics."*
- **Reports -> Code Architecture:** *"Let us briefly inspect the data structures and multithreading under the hood."*
