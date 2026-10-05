// Final case-study report, laid out on the university "Sample Report" template.
const path = require('path');
const fs = require('fs');
const L = require('./lib');
const { Paragraph, TextRun, AlignmentType, ImageRun, PageBreak } = L.docx;
const { P, H1, H2, H3, B, I, C, bullet, numbered, table, tableCaption, figure, code, callout, gap, FACTS: F, STUDENT: S } = L;

const shot = (f) => path.join(L.DOCS, 'screenshots', f);
const diag = (f) => path.join(L.DOCS, 'uml', f);

// ------------------------------------------------------------------ cover (copied from the template)
function centered(text, { size, bold = false, color, before = 0, after = 0 } = {}) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after, line: 276 },
    children: [new TextRun({ text, size: size * 2, bold, color })] });
}
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 0 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(__dirname, 'itm-logo.png')),
      transformation: { width: 363, height: 114 },
      altText: { title: 'ITM Skills University', description: 'ITM Skills University logo', name: 'logo' } })] }),
  centered('School of Future Tech', { size: 23, bold: true, before: 1700 }),
  centered('Case Study Report', { size: 23, bold: true, before: 1500 }),
  centered('on', { size: 20, before: 440 }),
  centered(S.title, { size: 17, bold: true, before: 1100 }),
  centered('by', { size: 16, before: 420 }),
  centered(S.name, { size: 13, bold: true, before: 820 }),
  centered(S.roll, { size: 14, color: L.ROLLGREY, before: 240 }),
];

// ------------------------------------------------------------------ index (template style, real sections)
const SECTIONS = [
  ['1.', 'Introduction to the Case Study.', ['Objectives', 'How this report covers the brief']],
  ['2.', 'Problem Statement / Case Background (Abstract).', ['Background', 'Problem Statement', 'Abstract']],
  ['3.', 'Problem Statement / Case Study Design.', ['System architecture', 'Packages and classes', 'UML class diagram', 'Data structures', 'Process flowcharts', 'Business rules']],
  ['4.', 'Methods & Algorithms Technology Applied in the Problem Statement / Case Study.', ['Key methods and algorithms', 'Java concepts applied', 'Technology stack']],
  ['5.', 'Problem Statement / Case Study Implementation Details and Snapshots.', ['Source files by module', 'Key code', 'Snapshots']],
  ['6.', 'Problem Statement / Case Study Results and Conclusion.', ['Test cases and results', 'Findings', 'Limitations and future scope', 'Conclusion']],
  ['7.', 'References', []],
  ['A.', 'Appendix - Complete Source Code', []],
];
/** Sub-section heading generated from SECTIONS, so the Index and the body always agree. */
const sub = (sec, i) => H2(`${sec}.${i + 1}  ${SECTIONS[sec - 1][2][i]}`);

const indexPage = [
  new Paragraph({ pageBreakBefore: true, spacing: { before: 480, after: 300 }, children: [new TextRun({ text: 'Index', size: 30, color: L.GREY })] }),
  ...SECTIONS.flatMap(([n, t, subs]) => [
    new Paragraph({ indent: { left: 720, hanging: 360 }, spacing: { after: subs.length ? 40 : 60, line: 276 },
      children: [new TextRun({ text: `${n}\t${t}`, size: 24 })], tabStops: [{ type: 'left', position: 720 }] }),
    ...subs.map((s, i) => new Paragraph({ indent: { left: 1080 }, spacing: { after: i === subs.length - 1 ? 100 : 0, line: 264 },
      children: [new TextRun({ text: `${n.replace('.', '')}.${i + 1}  ${s}`, size: 20, color: L.GREY })] })),
  ]),
];

// ------------------------------------------------------------------ section 1
const s1 = [
  H1('1. Introduction to the Case Study', { pageBreakBefore: true }),
  P(['A busy restaurant has to keep three things in step at the same time: guests who booked a table in advance, guests who simply walk in, and tables that keep changing between free, held and occupied. When this is managed on paper or from memory, tables get double-booked, large tables are wasted on small groups, and walk-in guests are forgotten or seated out of turn. This case study designs and implements a ',
    B(S.title), ' - a Java desktop application used by the host at the front desk that manages reservations, the walk-in waitlist and seating, and tells the host exactly which guests should get a table the moment it becomes free.']),
  P(['The case study demonstrates how core Java - classes and objects, enums, the Collections Framework (', I('ArrayList, LinkedList, HashMap, TreeMap'),
    '), threads, exception handling, validation and a Swing GUI - can be combined into a realistic, working front-of-house system. A ', I('LinkedList'),
    ' is used as the natural structure for the sequential waitlist queue, as the brief suggests.']),
  sub(1, 0),
  ...numbered([
    'Maintain table and reservation information.',
    'Manage the walk-in customer waitlist.',
    'Assign tables based on party size.',
    'Notify availability for reserved and waitlisted guests.',
    'Search and sort reservations.',
    'Provide a reservation management GUI.',
  ]),
  sub(1, 1),
  P(`Table ${L.nextTableNo()} maps every item asked for in the problem statement to the part of this report that covers it.`),
  tableCaption('Problem-statement deliverables and where they are covered'),
  table(['Requirement in the brief', 'Delivered as', 'Section'], [
    ['Objective: maintain table and reservation information', 'Table Setup and Reservation Booking modules', '3.2, 5.1, 5.3'],
    ['Objective: manage walk-in customer waitlist', 'Waitlist Management module, LinkedList queue', '3.5, 4.1, 5.3'],
    ['Objective: assign tables based on party size', 'Best-fit table assignment', '4.1 (method 1)'],
    ['Objective: notify availability for reserved / waitlisted guests', 'WaitlistNotifier thread, holds, alerts', '3.5, 4.1 (methods 4-5)'],
    ['Objective: search and sort reservations', 'Live search and five sort orders', '4.1 (method 6), 5.3'],
    ['Objective: reservation management GUI', 'Swing window with four tabs', '5.3 (Figures 5-11)'],
    ['14 required Java concepts (Classes to Validation)', 'One row per concept', '4.2 (Table 4)'],
    ['7 expected modules (Table Setup to Seating Reports)', 'One tab or service per module', '3.2, 5.1'],
    ['Deliverable: realistic front-of-house workflow using a LinkedList waitlist', 'Complete working application', '3, 5, 6'],
  ], [3900, 3326, 1800]),
];

// ------------------------------------------------------------------ section 2
const s2 = [
  H1('2. Problem Statement / Case Background (Abstract)'),
  sub(2, 0),
  P('Restaurants take bookings by phone and in person, while walk-in guests arrive without notice. Each party has a different size, tables come in different sizes, and the dining room is split into sections such as the main hall, the patio and the bar. The host must decide, many times an hour, which party sits where - without seating a walk-in at a table that is booked twenty minutes later, without giving a six-seat table to a couple when a two-seat table is free, and without skipping guests who have been waiting longer. These decisions follow clear rules, which makes them a good fit for software.'),
  sub(2, 1),
  P('A restaurant needs a system to manage table reservations, walk-in waitlists, and seating assignments across different table sizes and sections. The system should notify hosts when a reserved or waitlisted table becomes available.'),
  sub(2, 2),
  P(['This case study presents the design and implementation of a ', B(S.title), ` in Java. Tables, reservations, customers and waitlisted parties are modelled as classes; table status is an enum (AVAILABLE, RESERVED, OCCUPIED). Reservations are stored in an ArrayList, indexed by ID in a HashMap and kept in time order in a TreeMap, while walk-in parties wait in a LinkedList queue. New bookings are given the smallest table that fits (best fit) and every party blocks its table for a ${F.dining}-minute dining window, so double bookings are impossible. When guests leave, a background thread waits ${F.bussingS} seconds while the table is reset and then offers it to the booking due next or to the first waitlisted party that fits, alerting the host. A second thread checks every ${F.monitorS} seconds to hold tables ${F.hold} minutes before booked guests arrive and to flag late parties. All input is validated, every rule violation is reported through custom checked exceptions, and the data is saved automatically to a file. The system is operated through a Swing GUI with four tabs, and all 16 planned test cases passed.`]),
];

// ------------------------------------------------------------------ section 3
const s3a = [
  H1('3. Problem Statement / Case Study Design'),
  P('The system is designed in layers so that the business rules do not depend on the user interface. The Swing GUI only collects input and displays results; every decision is made by one service class, RestaurantManager, which is shared by the GUI and the two background threads.'),
  sub(3, 0),
  ...figure(diag('architecture.png'), 600, 'System architecture: presentation, service, model, utility and persistence layers, the two background threads and how data flows between them'),
  sub(3, 1),
  tableCaption('Packages, their responsibilities and the expected modules they implement'),
  table(['Package', 'Responsibility', 'Main classes', 'Modules'], [
    ['model', 'Plain data classes and enums', 'Table, Reservation, Customer, Waitlist, WaitlistEntry, TableStatus, ReservationStatus, Section', '1, 2, 3'],
    ['service', 'All business rules, threads and reports', 'RestaurantManager, WaitlistNotifier, ReservationMonitor, ReportGenerator, RestaurantListener, WalkInResult, SampleData', '2-7'],
    ['persistence', 'Saving and loading', 'DataStore, RestaurantSnapshot', '-'],
    ['exception', 'Checked exception hierarchy', 'RestaurantException + InvalidReservation-, InvalidTable-, TableNotAvailable-, NotFoundException', 'all'],
    ['util', 'Validation and date/time handling', 'Validator, TimeUtil', 'all'],
    ['gui', 'Swing user interface', 'MainFrame, TablesPanel, ReservationsPanel, WaitlistPanel, ReportsPanel, StatusCellRenderer, GuiUtil', '1-7'],
  ], [1500, 2300, 4026, 1200]),
  P([I('Module numbers: 1 Table Setup, 2 Reservation Booking, 3 Waitlist Management, 4 Table Assignment, 5 Availability Notification, 6 Reservation Search, 7 Seating Reports. All packages sit under com.restaurant.')], { spacing: { before: 120, after: 200 } }),
  P([I('The UML class diagram (Figure 2) follows on a landscape page.')]),
];
const s3uml = [
  sub(3, 2),
  ...figure(diag('class-diagram.png'), 880, 'UML class diagram - every class with its key fields and methods, grouped by package (+ public, - private, ~ package)', { maxHeightPx: 590 }),
];
const s3b = [
  sub(3, 3),
  tableCaption('Collections used by RestaurantManager and why each was chosen'),
  table(['Structure', 'Holds', 'Why this structure'], [
    [[C('ArrayList<Table>')], 'All tables, sorted by table number', 'A small list that is scanned for the best-fit table; its order gives a stable tie-break (lowest table number wins).'],
    [[C('ArrayList<Reservation>')], 'Every reservation and seated walk-in', 'The master record in creation order; scanned for conflicts and for customer searches.'],
    [[C('HashMap<String, Reservation>')], 'Reservation ID -> reservation', 'O(1) lookup when the host checks in, edits, cancels or searches by ID.'],
    [[C('TreeMap<LocalDateTime, List<Reservation>>')], 'Reservations grouped by start time', 'Always sorted by time. subMap() answers "who is due in the next 30 minutes?" and "today\'s bookings" without scanning everything; tailMap() finds the next booking for a table.'],
    [[C('LinkedList<WaitlistEntry>')], 'The walk-in queue (inside Waitlist)', 'A natural first-come-first-served queue: addLast() to join, removal from the front or the middle when a party is seated or leaves, iteration in arrival order to find the first party that fits.'],
  ], [3000, 2300, 3726]),
  sub(3, 4),
  P('Flowchart 1 shows how a booking is validated and given a table. Flowchart 2 shows the two halves of the waitlist: a walk-in arriving (left) and a table being released, which starts the notification thread (right).'),
  ...figure(diag('flowchart-booking.png'), 520, 'Flowchart 1 - booking a reservation (validation, duplicate check, best-fit assignment, indexing, holding)'),
  ...figure(diag('flowchart-waitlist-notification.png'), 600, 'Flowchart 2 - walk-in arrival and the table-release notification thread'),
  sub(3, 5),
  bullet([B('Service hours: '), `guests are seated between ${F.open} and ${F.last}, in ${F.slot}-minute slots, up to ${F.maxDays} days ahead.`]),
  bullet([B('Party size: '), `${F.minParty} to ${F.maxParty} guests; the party must fit the table.`]),
  bullet([B('Dining window: '), `each party is expected to use its table for ${F.dining} minutes; two parties on one table may not overlap.`]),
  bullet([B('Holding tables: '), `a table turns RESERVED for a booked party from ${F.hold} minutes before its time.`]),
  bullet([B('Waitlist fairness: '), 'the earliest party in the queue that fits a free table gets it; a newcomer cannot take a table while an earlier waiting party fits it.']),
  bullet([B('Bookings come first: '), `a walk-in is not given a table that a reservation needs within the next ${F.dining} minutes.`]),
  bullet([B('Late guests: '), `a booked party ${F.late} minutes late triggers a warning so the host can call them or mark a no-show.`]),
  bullet([B('One booking per guest per slot: '), 'the same phone number cannot hold two overlapping bookings or queue twice.']),
];

// ------------------------------------------------------------------ section 4
const s4 = [
  H1('4. Methods & Algorithms Technology Applied in the Problem Statement / Case Study'),
  sub(4, 0),
  ...numbered([
    { text: [B('Best-fit table assignment')], sub: [
      'Consider every table that is big enough and free for the whole dining window, and pick the one with the fewest seats.',
      'Search the guest\'s preferred section first; if it is full, fall back to any section and tell the host.',
      'Ties go to the lowest table number, so the result is predictable.'] },
    { text: [B('Interval conflict detection')], sub: [
      `Every active party occupies the interval [start, start + ${F.dining} min) on its table.`,
      'Two parties conflict when their intervals overlap: newStart < busyEnd and newEnd > busyStart.',
      'A seated party keeps its table at least until "now", even if it stays longer than planned.'] },
    { text: [B('FIFO first-fit waitlist (LinkedList)')], sub: [
      'Walk-ins are appended to the end of the queue.',
      'When a table frees up, the queue is walked from the front and the first party that fits is chosen; parties that are too large or want another section are skipped, nobody who fits is.'] },
    { text: [B('Holding tables for arriving guests')], sub: [
      `A TreeMap range query (subMap) finds bookings starting within ${F.hold} minutes; their tables are switched to RESERVED.`,
      `Late bookings (${F.late}+ minutes) raise a single warning.`] },
    { text: [B('Background availability notification (threads)')], sub: [
      `Releasing a table starts a WaitlistNotifier thread, which sleeps ${F.bussingS} s (table being reset) and then offers the table.`,
      `A ReservationMonitor daemon thread sweeps every ${F.monitorS} s. All shared state is protected with synchronized methods.`] },
    { text: [B('Searching and sorting')], sub: [
      'HashMap lookup for IDs; linear, case-insensitive matching for names and phone fragments; filtering by table number.',
      'Sorting with Comparator chains (time, party size, customer, table, status), ascending or descending.'] },
    { text: [B('Validation')], sub: [
      'Regular expressions for names and phone numbers; range checks for party size and capacity.',
      'Strict date parsing that rejects impossible dates such as 30 February.'] },
    { text: [B('Persistence with atomic save')], sub: [
      `Java serialization of one snapshot object, written to a temporary file and moved over the real file; automatic save ${F.autosaveS} s after each change.`] },
  ]),
  sub(4, 1),
  P(`The brief lists fourteen Java concepts. Table ${L.nextTableNo()} shows where each one is used; all fourteen are implemented for the purpose the brief describes.`),
  tableCaption('Required Java concepts and where they are implemented'),
  table(['Java concept', 'Application (brief)', 'Implementation in this project'], [
    ['Classes & Objects', 'Table, Reservation, Customer, Waitlist', 'model package: Table, Reservation, Customer, Waitlist, WaitlistEntry'],
    ['Constructors', 'Initialise reservation/table objects', 'Table(number, capacity, section) starts AVAILABLE; Reservation(...) generates its ID and starts CONFIRMED'],
    ['Enum', 'TableStatus (AVAILABLE, RESERVED, OCCUPIED)', 'TableStatus, plus ReservationStatus, Section and NotificationType'],
    ['Runnable / Thread', 'Simulate waitlist notification', 'WaitlistNotifier and ReservationMonitor implement Runnable and run on their own threads'],
    ['ArrayList', 'Store tables and reservations', 'RestaurantManager.tables and .reservations'],
    ['LinkedList', 'Maintain waitlist queue', 'Waitlist.queue - FIFO queue with removal from the middle'],
    ['HashMap', 'Reservation ID -> details', 'RestaurantManager.reservationById'],
    ['TreeMap', 'Reservations sorted by time', 'RestaurantManager.reservationsByTime with subMap() / tailMap() range queries'],
    ['CRUD', 'Reservation management', 'createReservation, getReservation, updateReservation, cancelReservation / markNoShow, deleteReservation'],
    ['Searching', 'Search by customer/table', 'searchReservations(query, SearchField): name, phone, table or ID'],
    ['Sorting', 'Sort by time, party size', 'RestaurantManager.sort(list, SortField, ascending) - time, party size, customer, table, status'],
    ['Swing', 'Reservation management GUI', 'gui package: tabs, tables, forms, dialogs, menu, timers, colour-coded cells'],
    ['Exception Handling', 'Invalid reservation/table data', 'Checked RestaurantException hierarchy; try/catch around every GUI action; try-with-resources for files'],
    ['Validation', 'Party size, reservation time, table capacity', 'Validator: name, phone, party size, service hours, 15-minute slots, date range, capacity, strict dates'],
  ], [1900, 2500, 4626]),
  P([B('Additional concepts used: '), 'interfaces and the Observer pattern (RestaurantListener), inheritance (exceptions, Swing panels), encapsulation, lambdas and method references, the java.time API, serialization and file I/O, synchronized / volatile / AtomicInteger.'], { spacing: { before: 200, after: 200 } }),
  sub(4, 2),
  bullet(['Programming language: Java (Java 8 or newer).']),
  bullet(['Libraries and tools:']),
  bullet(['Java Collections Framework - ArrayList, LinkedList, HashMap, TreeMap.'], 1),
  bullet(['Java Swing - JFrame, JTabbedPane, JTable, dialogs, javax.swing.Timer.'], 1),
  bullet(['java.lang.Thread / Runnable - background notification and monitoring.'], 1),
  bullet(['java.time - LocalDateTime, Duration, DateTimeFormatter.'], 1),
  bullet(['java.io / java.nio.file - object serialization and atomic file moves.'], 1),
  bullet(['Environment:']),
  bullet(['JDK (javac and java), any IDE such as IntelliJ IDEA, Eclipse or VS Code; run scripts run.sh / run.bat.'], 1),
  bullet(['Data storage:']),
  bullet(['data/restaurant.dat - a serialized snapshot of tables, reservations and the waitlist. No external database or library is needed.'], 1),
];

// ------------------------------------------------------------------ section 5
const files = L.listSourceFiles();
const lineCount = files.reduce((n, f) => n + L.readSource(f.replace(/^com\/restaurant\//, '')).split('\n').length, 0);
const s5 = [
  H1('5. Problem Statement / Case Study Implementation Details and Snapshots'),
  P(`The implementation consists of ${files.length} Java source files (about ${Math.round(lineCount / 100) * 100} lines) in six packages, with no external libraries. The complete code is in Appendix A.`),
  sub(5, 0),
  ...numbered([
    { text: [B('model/'), ' - Table.java, Reservation.java, Customer.java, Waitlist.java, WaitlistEntry.java and the enums'], sub: ['Data for tables, bookings, guests and the walk-in queue (Modules 1-3).'] },
    { text: [B('service/RestaurantManager.java')], sub: ['All business logic: table setup, reservation CRUD, best-fit assignment, waitlist, check-in, release, holds, search and sort (Modules 1-6).'] },
    { text: [B('service/WaitlistNotifier.java, service/ReservationMonitor.java')], sub: ['The two Runnable classes that run on background threads (Module 5).'] },
    { text: [B('service/ReportGenerator.java')], sub: ['Builds the seating report: floor status, sections, today\'s parties, upcoming bookings, waitlist (Module 7).'] },
    { text: [B('persistence/DataStore.java, persistence/RestaurantSnapshot.java')], sub: ['Saving and loading with serialization.'] },
    { text: [B('util/Validator.java, util/TimeUtil.java, exception/*.java')], sub: ['Validation rules, date handling and the custom exceptions.'] },
    { text: [B('gui/*.java and Main.java')], sub: ['The Swing window, one tab per area, and the entry point that loads data and starts the monitor thread.'] },
  ]),
  sub(5, 1),
  P('Best-fit assignment - the smallest suitable table that is free for the whole dining window:'),
  ...code(L.extractBlock('service/RestaurantManager.java', /private Table bestFit\(/)),
  P('The waitlist is a LinkedList; this method walks it from the front to find the first party that fits a free table:'),
  ...code(L.extractBlock('model/Waitlist.java', /public WaitlistEntry firstFitFor/)),
  P('The Runnable that runs on its own thread when a table is released:'),
  ...code(L.extractBlock('service/WaitlistNotifier.java', /public void run\(\)/)),
  P('TreeMap range query used to find bookings that are due soon:'),
  ...code(L.extractBlock('service/RestaurantManager.java', /public synchronized List<Reservation> getReservationsBetween/)),
  P('Validation of the reservation time - each rule throws a checked exception with a message the host can act on:'),
  ...code(L.extractBlock('util/Validator.java', /public static void validateReservationTime/)),
  sub(5, 2),
  P(`All snapshots were captured from the running application with its sample data. Status cells are colour-coded: green = available, amber = reserved/held, red = occupied, blue = confirmed booking, grey = closed.`),
  ...figure(shot('01-floor-tables.png'), 600, 'Floor & Tables tab (Modules 1 and 4): every table with its status, who is seated or expected, and its next booking. Table 1 is already held for a booking due within 30 minutes'),
  ...figure(shot('02-reservations.png'), 600, 'Reservations tab (Modules 2 and 6): booking form, live search, sort order and view filter, and actions for the selected booking'),
  ...figure(shot('03-waitlist.png'), 600, 'Walk-ins & Waitlist tab (Module 3): the LinkedList queue in arrival order; W002 already has table 5 held'),
  ...figure(shot('05-table-released-notification.png'), 600, `Availability notification (Module 5): table 8 was released; ${F.bussingS} s later the notifier thread held it for Isha Verma, the first waiting party that wants the Patio, and alerted the host`),
  ...figure(shot('04-reports.png'), 600, 'Seating Reports tab (Module 7): floor status, seat utilisation, section breakdown, today\'s parties and waitlist statistics'),
  ...figure(shot('06-validation-party-size.png'), 600, 'Validation: a party of 21 typed into the booking form is rejected with a clear message'),
  ...figure(shot('07-validation-time-slot.png'), 600, `Validation: a booking at 19:07 is rejected because reservations are taken in ${F.slot}-minute slots`),
];

// ------------------------------------------------------------------ section 6
const TESTS = [
  ['TC01', 'Add a table whose number already exists', 'Error "Table 3 already exists."'],
  ['TC02', 'Reduce a table to fewer seats than a booked party', 'Error naming the reservation that needs the seats'],
  ['TC03', `Book a party of ${F.maxParty + 1}`, `Error "Party size cannot exceed ${F.maxParty}..."`],
  ['TC04', 'Book a time in the past, or 23:00', 'Error explaining the rule that was broken'],
  ['TC05', 'Book at 19:07', `Error: reservations are taken in ${F.slot}-minute slots`],
  ['TC06', 'Enter an impossible date (2026-02-30)', 'Error: not a valid date/time, with the expected format'],
  ['TC07', 'Party of 3 when 2-, 4- and 6-seat tables are free', 'The 4-seat table is assigned (best fit)'],
  ['TC08', 'Request a table already booked at an overlapping time', 'Error: table is already booked by another reservation'],
  ['TC09', 'Walk-in arrives when every suitable table is taken', 'Added to the waitlist with position and estimated wait'],
  ['TC10', 'Release a 2-seat table; queue holds a party of 4, then a party of 2', `About ${F.bussingS} s later the table is held for the party of 2; [READY] alert`],
  ['TC11', 'New walk-in while a free table is held for a waiting party', 'Newcomer is queued; the waiting party keeps the table'],
  ['TC12', `A reservation becomes due within ${F.hold} minutes`, 'Its table turns RESERVED and the host is alerted'],
  ['TC13', 'Search part of a name in capitals ("YA"), then sort by party size', 'Only matching rows, case-insensitive, in party-size order'],
  ['TC14', 'Cancel a reservation whose table is being held', 'Status Cancelled; the table is offered to the next party'],
  ['TC15', 'Close the application and open it again', 'All tables, reservations and the waitlist are restored'],
  ['TC16', 'Start the application with a damaged data file', 'Starts with sample data; the damaged file is kept'],
];
const s6 = [
  H1('6. Problem Statement / Case Study Results and Conclusion'),
  sub(6, 0),
  P('The finished application was tested against the following cases, covering every module and every validation rule. All 16 test cases passed.'),
  tableCaption('Test cases and results'),
  table(['ID', 'Test case', 'Expected result', 'Result'], TESTS.map((t) => [...t, [B('Pass')]]), [800, 3400, 3826, 1000]),
  sub(6, 1),
  bullet('Keeping one sorted index per question (HashMap by ID, TreeMap by time) made each operation simple and fast instead of scanning every reservation every time.'),
  bullet('A LinkedList is the right fit for the waitlist: parties join at the end, leave from anywhere, and are examined in arrival order.'),
  bullet(`Best-fit assignment with a ${F.dining}-minute window prevented every double booking in testing while keeping large tables free for large parties.`),
  bullet('Moving the waiting and checking onto background threads kept the GUI responsive; synchronized methods and invokeLater() kept the shared data consistent.'),
  bullet('Specific error messages ("Reservations are taken in 15-minute slots...") make validation useful to the host instead of merely blocking input.'),
  sub(6, 2),
  bullet('Data lives in one local file; a database (for example MySQL through JDBC) would let several front-desk computers share one reservation book.'),
  bullet(`The ${F.dining}-minute dining window is fixed; it could depend on party size or the time of day.`),
  bullet('The host pages waitlisted guests in person; SMS or WhatsApp messages could notify them automatically.'),
  bullet('Tables cannot be joined for very large parties, and the floor plan is a list rather than a visual map.'),
  sub(6, 3),
  P(['This case study delivers a complete ', B(S.title), ' that meets all six objectives, all seven expected modules and all fourteen required Java concepts of the brief. ArrayList, HashMap and TreeMap organise the reservation book, a LinkedList models the waitlist queue, Runnable threads deliver availability notifications, and a Swing GUI puts everything in front of the host. Beyond the brief, the system enforces realistic front-of-house rules - best-fit assignment, no double bookings, a fair waitlist and tables held for arriving guests - and saves its data automatically. Separating the business logic from the user interface kept the code easy to test and would make it straightforward to add a database or a web front end in future.']),
];

// ------------------------------------------------------------------ section 7
const s7 = [
  H1('7. References'),
  bullet('Oracle. Java Platform, Standard Edition 8 API Specification - java.util, java.time, java.io, javax.swing. docs.oracle.com/javase/8/docs/api'),
  bullet('Oracle. The Java Tutorials - Collections, Concurrency, Creating a GUI With Swing, Date-Time, Basic I/O. docs.oracle.com/javase/tutorial'),
  bullet('Bloch, J. Effective Java, 3rd edition. Addison-Wesley, 2018.'),
  bullet('Goetz, B. et al. Java Concurrency in Practice. Addison-Wesley, 2006.'),
  bullet('Gamma, E., Helm, R., Johnson, R. and Vlissides, J. Design Patterns - the Observer pattern. Addison-Wesley, 1994.'),
  bullet('ITM Skills University, School of Future Tech. Java Programming - Case Study 70 problem statement, B.Tech CSE 2025-29, Semester III.'),
];

// ------------------------------------------------------------------ appendix A: complete source code
const PKG_ORDER = ['Main.java', 'model/', 'exception/', 'util/', 'service/', 'persistence/', 'gui/'];
const ordered = files.slice().sort((a, b) => {
  const k = (f) => PKG_ORDER.findIndex((p) => f.replace('com/restaurant/', '').startsWith(p));
  return k(a) - k(b) || a.localeCompare(b);
});
const appendix = [
  H1('Appendix A - Complete Source Code', { pageBreakBefore: true }),
  P(`All ${files.length} source files, exactly as submitted, grouped by package. Package com.restaurant is abbreviated to the folder name.`),
];
ordered.forEach((f, i) => {
  const rel = f.replace('com/restaurant/', '');
  appendix.push(H2(`A.${i + 1}  ${rel}`, { pageBreakBefore: false }));
  appendix.push(...code(L.readSource(rel).replace(/\n+$/, '').split('\n'), { size: 14 }));
});

// ------------------------------------------------------------------ assemble
module.exports = async function build(outFile) {
  const doc = L.makeDocument({
    title: `${S.title} - Case Study Report`,
    footerText: S.title,
    sections: [
      { children: cover, noFooter: true },
      { children: [...indexPage, ...s1, ...s2, ...s3a] },
      { children: s3uml, landscape: true, margin: 1080 },
      { children: [...s3b, ...s4, ...s5, ...s6, ...s7, ...appendix] },
    ],
  });
  return L.save(doc, outFile);
};
