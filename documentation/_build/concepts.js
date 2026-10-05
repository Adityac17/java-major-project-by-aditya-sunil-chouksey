// In-depth concepts & study guide: every concept used, explained from first principles with this project's code.
const L = require('./lib');
const { Paragraph, TextRun } = L.docx;
const { P, H1, H2, H3, B, I, C, bullet, numbered, table, callout, gap, code, FACTS: F, STUDENT: S } = L;
const X = (rel, re, o) => code(L.extractBlock(rel, re, o), { title: rel });
const R = (rel, a, b) => code(L.extractRange(rel, a, b), { title: rel });

const REQ = 'Required by the brief';
const ADD = 'Added by us - not in the brief';
const tag = (t) => new Paragraph({ spacing: { after: 160 }, children: [new TextRun({
  text: t === REQ ? '■ ' + REQ : t === ADD ? '□ ' + ADD : '◆ Design - how the brief\'s requirements are met',
  size: 18, bold: true, color: t === REQ ? '2E7D32' : t === ADD ? '8A6D00' : '37474F' })] });
const oneLine = (text) => callout('In one sentence', [text], 'F3F6F9');
const traps = (items) => callout('Viva traps - say this, not that', items, 'FFF8E1');
const qa = (pairs) => [
  H3('Likely questions'),
  table(['Question', 'Short answer'], pairs, [3600, 5426], { size: 18 }),
];
const topic = (n, title, kind) => [H1(`${n}. ${title}`, { pageBreakBefore: true }), tag(kind)];

// ------------------------------------------------------------------ front matter
const front = [
  new Paragraph({ spacing: { before: 1200, after: 120 }, children: [new TextRun({ text: 'Concepts & Study Guide', size: 48, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: S.title, size: 28 })] }),
  new Paragraph({ spacing: { after: 500 }, children: [new TextRun({ text: `${S.subject} - ${S.caseStudy}  |  ${S.name} (${S.roll})`, size: 22, color: L.GREY })] }),
  callout('How to use this guide', [
    'Every concept used in the project has its own chapter: what it is in plain words, exactly where and how this project uses it (the code shown is copied automatically from the real source files), a worked example you can trace on paper, the traps examiners like, and likely questions with short answers.',
    ['Chapters marked ', B('■ Required by the brief'), ' are the fourteen concepts the case study asks for. Chapters marked ', B('□ Added by us'), ' were introduced to make the system work well - be ready to explain why you added them.'],
    'Suggested order: read chapters 6 (Collections), 12 (Threads) and 16 (Algorithms) first - they carry the most marks and the most questions.',
  ]),
  H2('Concept map'),
  table(['#', 'Concept', 'Brief?', 'Where in the code'], [
    ['1', 'Classes & Objects', 'Required', 'model/*.java'],
    ['2', 'Constructors', 'Required', 'Table, Reservation, WaitlistEntry, RestaurantManager'],
    ['3', 'Encapsulation, static, final, access modifiers', 'Added', 'every class'],
    ['4', 'Enum', 'Required', 'TableStatus, ReservationStatus, Section, SortField'],
    ['5', 'Inheritance, interfaces, Observer pattern', 'Added', 'exceptions, panels, Runnable, RestaurantListener'],
    ['6', 'Collections: ArrayList, LinkedList, HashMap, TreeMap', 'Required', 'RestaurantManager, Waitlist'],
    ['7', 'CRUD', 'Required', 'RestaurantManager reservation methods'],
    ['8', 'Searching', 'Required', 'searchReservations, HashMap lookup'],
    ['9', 'Sorting, Comparator, lambdas', 'Required', 'SortField, RestaurantManager.sort'],
    ['10', 'Exception handling', 'Required', 'exception/*, every GUI action'],
    ['11', 'Validation, regular expressions', 'Required', 'Validator, TimeUtil'],
    ['12', 'Runnable/Thread (+ synchronized, volatile, EDT)', 'Required (+ added)', 'WaitlistNotifier, ReservationMonitor, MainFrame'],
    ['13', 'Swing GUI', 'Required', 'gui/*.java'],
    ['14', 'java.time and Clock', 'Added', 'Reservation, TimeUtil, RestaurantManager'],
    ['15', 'Serialization and file I/O', 'Added', 'persistence/*'],
    ['16', 'Algorithms: best fit, interval overlap, fair queue', 'Design', 'RestaurantManager, Waitlist'],
    ['17', 'Packages, compiling and running', 'Added', 'run.sh, javac/java'],
  ], [500, 3600, 1700, 3226], { size: 18 }),
];

// ------------------------------------------------------------------ 1 classes & objects
const c1 = [
  ...topic(1, 'Classes & Objects', REQ),
  oneLine('A class is a blueprint that bundles data (fields) with the operations on that data (methods); an object is one concrete thing built from that blueprint, with its own copy of the fields.'),
  gap(),
  H2('What it is'),
  P(['Think of ', I('Table'), ' as the form a restaurant would print for every table: number, seats, section, status. The class is the blank form; each filled-in form - table 1, table 2, table 12 - is an object. Every object has its own field values but shares the same methods.']),
  H2('How this project uses it'),
  table(['Class', 'Represents', 'Key fields'], [
    ['Table', 'A physical table', 'number, capacity, section, status, heldFor, occupiedBy'],
    ['Reservation', 'A booking (or a seated walk-in)', 'id, customer, partySize, dateTime, tableNumber, status, walkIn'],
    ['Customer', 'A guest', 'name, phone'],
    ['WaitlistEntry', 'A walk-in party waiting', 'id, customer, partySize, preferredSection, joinedAt, heldTableNumber'],
    ['Waitlist', 'The queue of waiting parties', 'queue (LinkedList<WaitlistEntry>)'],
  ], [2000, 2800, 4226]),
  gap(),
  P('The methods that change a table\'s state live inside the Table class itself, so a table can never be "occupied but also held for someone":'),
  ...R('model/Table.java', /public void hold\(String id\)/, /^\s{4}}\s*$/),
  P([I('(hold, occupy and free each set status and the two id fields together.)')]),
  H2('Worked example'),
  ...numbered([
    [C('Table t = new Table(5, 6, Section.MAIN_HALL);'), ' creates one object: number 5, 6 seats, status AVAILABLE.'],
    [C('t.hold("W002");'), ' - Karan Malhotra\'s party is next: status becomes RESERVED, heldFor = "W002".'],
    [C('t.occupy("WI1013");'), ' - they sit down: status OCCUPIED, occupiedBy = "WI1013", heldFor cleared.'],
    [C('t.free();'), ' - they leave: back to AVAILABLE with both ids cleared.'],
  ]),
  traps([
    ['A class is ', B('not'), ' an object. "Table" is the class; "table 5" is an object (an instance).'],
    ['Two Customer objects with the same phone are ', I('equal'), ' (equals() compares phone) but are still two different objects in memory (== is false).'],
  ]),
  ...qa([
    ['Why is Reservation a class and not just a row of strings?', 'It groups related data with behaviour (getEndTime()) and type safety - partySize is an int, dateTime a LocalDateTime, status an enum.'],
    ['How many Table objects exist in the sample data?', 'Twelve - one per physical table.'],
    ['Why does Customer override equals() and hashCode()?', 'So two Customer objects with the same phone number count as the same guest - used for duplicate-booking checks.'],
  ]),
];

// ------------------------------------------------------------------ 2 constructors
const c2 = [
  ...topic(2, 'Constructors', REQ),
  oneLine('A constructor is the special method that runs once when an object is created with new, and puts the object into a valid starting state.'),
  gap(),
  H2('How this project uses it'),
  P('A new table always starts AVAILABLE - the constructor guarantees it, so no caller can forget:'),
  ...X('model/Table.java', /public Table\(int number, int capacity, Section section\)/, { includeDoc: false }),
  P('A reservation generates its own unique ID from a shared counter and always starts CONFIRMED:'),
  ...X('model/Reservation.java', /public Reservation\(Customer customer, int partySize, LocalDateTime dateTime,/, { includeDoc: false }),
  P(['The ', C('SEQUENCE'), ' counter is ', C('static'), ' (one per class, shared by all objects) and an ', C('AtomicInteger'), ' so two threads creating bookings at once can never get the same number. Walk-ins get the prefix "WI", bookings "R".']),
  P('RestaurantManager shows constructor chaining - the no-argument constructor calls the other one with this(...):'),
  ...R('service/RestaurantManager.java', /public RestaurantManager\(\) \{/, /^\s{4}}\s*$/),
  ...X('service/RestaurantManager.java', /public RestaurantManager\(Clock clock\)/),
  H2('Worked example'),
  P(['The first booking made in a run gets ', C('SEQUENCE.incrementAndGet()'), ' = 1001, so its id is "R1001"; the next walk-in gets 1002 -> "WI1002". After loading saved data, ', C('ensureSequenceAtLeast()'), ' moves the counter past the highest saved id so new ids never clash with old ones.']),
  traps([
    'A constructor has no return type - not even void. If you write "public void Table(...)" it becomes an ordinary method and the default constructor is used instead.',
    'If a class defines any constructor, Java no longer provides the free no-argument one.',
  ]),
  ...qa([
    ['What does this(clock) do?', 'Calls another constructor of the same class; it must be the first statement. It avoids duplicating initialisation code.'],
    ['Why is the ID generated in the constructor and not passed in?', 'So every reservation gets a unique id automatically; callers cannot forget or duplicate one.'],
    ['Why AtomicInteger instead of a static int?', 'id++ on an int is three steps (read, add, write); two threads could read the same value. incrementAndGet() is one atomic step.'],
  ]),
];

// ------------------------------------------------------------------ 3 encapsulation
const c3 = [
  ...topic(3, 'Encapsulation, static, final and access modifiers', ADD),
  oneLine('Encapsulation means hiding an object\'s fields behind methods, so the object controls how its own data changes.'),
  gap(),
  H2('How this project uses it'),
  bullet(['All fields are ', C('private'), '. Other classes read them through getters and change them only through meaningful methods (hold(), occupy(), setStatus()).']),
  bullet(['RestaurantManager never hands out its real lists: ', C('getTables()'), ' returns ', C('new ArrayList<>(tables)'), ' - a copy - so the GUI cannot add or remove tables behind the manager\'s back.']),
  bullet([C('final'), ' fields (', C('private final int number'), ' in Table) can be set once in the constructor and never changed - a table\'s number is its identity.']),
  bullet([C('static final'), ' constants such as ', C('Reservation.DINING_MINUTES'), ' and ', C('Validator.MAX_PARTY_SIZE'), ' keep business rules in one place.']),
  bullet(['GUI panel classes have ', I('package-private'), ' access (no modifier): only MainFrame in the same package needs them.']),
  table(['Modifier', 'Visible from'], [
    ['private', 'Only the same class'],
    ['(none) package-private', 'Classes in the same package'],
    ['protected', 'Same package + subclasses'],
    ['public', 'Everywhere'],
  ], [3000, 6026]),
  gap(),
  ...qa([
    ['Why return a copy of the list instead of the list itself?', 'If the GUI changed the real list (say, removed a table) the HashMap/TreeMap and holds would no longer match - returning a copy protects the manager\'s invariants.'],
    ['What is the difference between static and final?', 'static = belongs to the class, one copy shared by all objects. final = cannot be reassigned after it is set. static final together = a constant.'],
  ]),
];

// ------------------------------------------------------------------ 4 enums
const c4 = [
  ...topic(4, 'Enum', REQ),
  oneLine('An enum is a type with a fixed, named set of values - the compiler rejects anything else.'),
  gap(),
  H2('How this project uses it'),
  P('The brief asks for exactly this enum. Each constant also carries a readable label for the GUI:'),
  ...X('model/TableStatus.java', /public enum TableStatus/),
  P('Enums can have methods. ReservationStatus knows which statuses still block a table:'),
  ...X('model/ReservationStatus.java', /public boolean isActive\(\)/),
  P(['The most advanced use is ', C('SortField'), ' in RestaurantManager: each constant stores its own ', C('Comparator'), ', so "sort by party size" is just ', C('SortField.PARTY_SIZE.comparator()'), ' - no if/else chain (see chapter 9).']),
  table(['Enum', 'Values'], [
    ['TableStatus', 'AVAILABLE, RESERVED, OCCUPIED'],
    ['ReservationStatus', 'CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW'],
    ['Section', 'MAIN_HALL, PATIO, BAR, PRIVATE_ROOM'],
    ['NotificationType', 'INFO, WARNING, ALERT'],
    ['SortField / SearchField', 'TIME, PARTY_SIZE, CUSTOMER, TABLE, STATUS / CUSTOMER, TABLE, ID'],
  ], [2600, 6426]),
  gap(),
  H2('Worked example - why not use Strings?'),
  P(['With a String, ', C('table.status = "Ocupied"'), ' (typo) compiles and silently breaks every check. With the enum, ', C('TableStatus.OCUPIED'), ' does not compile. Enums can also be used in switch statements - StatusCellRenderer switches on TableStatus to choose the cell colour - and as keys of an EnumMap (ReportGenerator counts tables per status with one).']),
  traps(['Compare enums with == (it is safe and null-safe on the left), e.g. t.getStatus() == TableStatus.AVAILABLE. equals() also works but is not needed.']),
  ...qa([
    ['Can an enum have a constructor?', 'Yes - always private (implicitly). TableStatus(String label) stores the label for each constant.'],
    ['Where are the three table statuses changed?', 'Only in Table.hold(), occupy() and free(), called by RestaurantManager.'],
    ['Why is RESERVED used for both bookings and waitlist?', 'In both cases the table is being kept for a specific party; heldFor says which one (an R... id or a W... id).'],
  ]),
];

// ------------------------------------------------------------------ 5 inheritance & interfaces
const c5 = [
  ...topic(5, 'Inheritance, interfaces and the Observer pattern', ADD),
  oneLine('Inheritance lets a class reuse and extend another class (extends); an interface is a contract of methods that unrelated classes can promise to provide (implements).'),
  gap(),
  H2('Inheritance in this project'),
  bullet(['Exceptions: ', C('RestaurantException extends Exception'), ', and four specific exceptions extend RestaurantException (chapter 10).']),
  bullet(['GUI: ', C('MainFrame extends JFrame'), '; the four panels extend ', C('JPanel'), '; ', C('StatusCellRenderer extends DefaultTableCellRenderer'), ' and overrides one method to colour status cells.']),
  H2('Interfaces in this project'),
  bullet([C('Runnable'), ' (from Java) - WaitlistNotifier and ReservationMonitor implement run() so a Thread can execute them (chapter 12).']),
  bullet([C('RestaurantListener'), ' (ours) - the Observer pattern:']),
  ...X('service/RestaurantListener.java', /public interface RestaurantListener/),
  H2('The Observer pattern'),
  P('RestaurantManager (the "subject") keeps a list of listeners and calls them when something happens. MainFrame (the "observer") implements RestaurantListener and refreshes the screen. The manager never imports any Swing class, so the same manager works with the GUI, with background threads and in testing.'),
  ...X('gui/MainFrame.java', /public void onDataChanged\(\)/),
  traps(['extends = "is a" (MainFrame is a JFrame). implements = "can do" (WaitlistNotifier can run). Java allows one superclass but many interfaces.']),
  ...qa([
    ['Why an interface for notifications instead of calling MainFrame directly?', 'Loose coupling: the service layer does not depend on the GUI. Any number of listeners can subscribe, and the GUI can be replaced without touching business logic.'],
    ['What is method overriding? Give an example.', 'A subclass replaces an inherited method with its own version, e.g. StatusCellRenderer.getTableCellRendererComponent() adds colours, and toString() is overridden in Table, Customer, Reservation and WaitlistEntry.'],
  ]),
];

// ------------------------------------------------------------------ 6 collections
const c6 = [
  ...topic(6, 'Collections: ArrayList, LinkedList, HashMap, TreeMap', REQ),
  oneLine('The Java Collections Framework provides ready-made data structures; choosing the right one for each job is what makes the program simple and fast.'),
  gap(),
  H2('The four collections and why each was chosen'),
  ...R('service/RestaurantManager.java', /private final List<Table> tables/, /private final Waitlist waitlist/),
  table(['Operation', 'ArrayList', 'LinkedList', 'HashMap', 'TreeMap'], [
    ['Add', 'O(1) at end', 'O(1) at either end', 'O(1)', 'O(log n)'],
    ['Find by key / index', 'O(1) by index, O(n) by value', 'O(n)', 'O(1) by key', 'O(log n) by key'],
    ['Remove', 'O(n)', 'O(1) with iterator', 'O(1)', 'O(log n)'],
    ['Keeps order?', 'Insertion order', 'Insertion order', 'No order', 'Sorted by key'],
    ['Used here for', 'tables, reservations', 'waitlist queue', 'reservation by ID', 'reservations by time'],
  ], [1900, 1800, 1800, 1650, 1876], { size: 18 }),
  H2('6.1 ArrayList'),
  P('A resizable array. Good for "keep everything and loop over it". Tables are kept sorted by number with Collections.sort, so the best-fit loop sees them in a predictable order.'),
  H2('6.2 LinkedList - the waitlist'),
  P('A chain of nodes, each pointing to the next and previous. Adding at the end and removing a node you are already at are O(1) - exactly what a queue of waiting guests needs. It also implements the Deque interface (addLast, peekFirst, pollFirst).'),
  ...X('model/Waitlist.java', /public void enqueue\(WaitlistEntry entry\)/, { includeDoc: false }),
  ...X('model/Waitlist.java', /public boolean remove\(String id\)/, { includeDoc: false }),
  P(['Removal uses an ', C('Iterator'), ' - calling list.remove() inside a for-each loop would throw ConcurrentModificationException.']),
  H3('Worked example - who gets table 8?'),
  table(['Queue position', 'Party', 'Size', 'Wants', 'Fits table 8 (4 seats, Patio)?'], [
    ['1', 'W001 Isha Verma', '2', 'Patio', 'Yes -> table held for W001, stop'],
    ['2', 'W002 Karan Malhotra', '5', 'Any', '(not checked)'],
  ], [1600, 2600, 900, 1300, 2626], { size: 18 }),
  P('If instead table 2 (2 seats, Main Hall) frees: W001 wants the Patio -> skip; W002 has 5 people -> too big, skip; nobody fits, so the table simply becomes available.'),
  H2('6.3 HashMap - reservation by ID'),
  P(['A hash table: the key\'s hashCode() picks a bucket, so get("R1003") goes straight to the right entry - O(1) on average - instead of looping over every reservation. Used for check-in, edit, cancel, delete and search by ID.']),
  ...X('service/RestaurantManager.java', /private void index\(Reservation r\)/),
  H2('6.4 TreeMap - reservations in time order'),
  P(['A red-black tree that keeps its keys sorted. The key is the start time; the value is a ', C('List'), ' because two bookings can start at the same minute. Its range views answer time questions directly:']),
  ...X('service/RestaurantManager.java', /public synchronized List<Reservation> getReservationsBetween/),
  H3('Worked example'),
  ...numbered([
    'Bookings are added at 19:30, 13:00, 20:00 and 19:30 again (two parties).',
    'The TreeMap keys are kept as 13:00 -> 19:30 -> 20:00 (sorted), and 19:30 maps to a list of two reservations.',
    'At 19:05 the monitor asks subMap(18:35, 19:35): the answer is just the two 19:30 bookings - their tables get held.',
    'tailMap(now - 30 min) walks forward in time to find each table\'s next booking for the "Next booking" column.',
  ]),
  traps([
    'HashMap does not keep any order - never rely on its iteration order. That is why a separate TreeMap is used for time order.',
    'LinkedList get(i) is O(n) - it is used as a queue (ends + iterator), never by index.',
    'The three indexes must stay consistent: every add/remove/time-change updates the ArrayList, HashMap and TreeMap together (index(), unindexTime()).',
  ]),
  ...qa([
    ['Why three structures for reservations instead of one?', 'Each answers a different question quickly: the ArrayList keeps everything, the HashMap finds by ID in O(1), the TreeMap gives time order and ranges.'],
    ['Why is the TreeMap value a List?', 'Two reservations can start at exactly the same time; a map key can only appear once.'],
    ['Why not an ArrayList for the waitlist?', 'Removing from the front or middle of an ArrayList shifts every element (O(n)); a LinkedList unlinks one node.'],
    ['What happens to the HashMap when a reservation is deleted?', 'reservationById.remove(id) is called together with the list removal and unindexTime(), so no structure keeps a stale entry.'],
  ]),
];

// ------------------------------------------------------------------ 7 CRUD
const c7 = [
  ...topic(7, 'CRUD - reservation management', REQ),
  oneLine('CRUD is the four basic operations on stored records: Create, Read, Update, Delete.'),
  gap(),
  table(['Operation', 'Method in RestaurantManager', 'GUI button'], [
    ['Create', 'createReservation(name, phone, party, dateTime, section, table, notes)', 'Book'],
    ['Read', 'getReservation(id), getReservations(), searchReservations(...)', 'list, search box'],
    ['Update', 'updateReservation(id, ...), plus status changes checkIn, cancelReservation, markNoShow', 'Save Changes, Check In, Cancel, Mark No-show'],
    ['Delete', 'deleteReservation(id)', 'Delete Record'],
  ], [1500, 4900, 2626], { size: 18 }),
  gap(),
  H2('Create, step by step'),
  ...X('service/RestaurantManager.java', /public synchronized Reservation createReservation\(/, { includeDoc: false }),
  ...numbered([
    'Validate the input (throws InvalidReservationException on bad data).',
    'Refuse a second overlapping booking for the same phone number.',
    'Choose a table (the requested one if valid, otherwise best fit - chapter 16).',
    'Create the object and index it in the ArrayList, HashMap and TreeMap.',
    'Notify listeners, and hold the table immediately if the booking starts within 30 minutes.',
  ]),
  H2('Cancel versus Delete'),
  P('Cancel keeps the record (status CANCELLED) so it still appears in reports; Delete removes it from all three structures. A seated party cannot be deleted - the table must be released first - so the floor plan can never point at a reservation that no longer exists.'),
  ...qa([
    ['What happens if you edit a booking to a time when its table is taken?', 'updateReservation keeps the current table if it is still free; otherwise it runs the same table choice as a new booking, and throws TableNotAvailableException if nothing fits.'],
    ['Why does updateReservation re-index the TreeMap?', 'The key is the start time; if the time changes the entry must move to the new key, otherwise time queries would miss it.'],
  ]),
];

// ------------------------------------------------------------------ 8 searching
const c8 = [
  ...topic(8, 'Searching', REQ),
  oneLine('Searching means finding the records that match a condition - here by customer, by table or by reservation ID.'),
  gap(),
  ...X('service/RestaurantManager.java', /public synchronized List<Reservation> searchReservations\(/, { includeDoc: false }),
  table(['Search by', 'Technique', 'Cost'], [
    ['Reservation ID', 'HashMap lookup (key normalised to upper case)', 'O(1)'],
    ['Table number', 'Parse the number, then linear scan', 'O(n)'],
    ['Customer', 'Linear scan; case-insensitive contains() on the name, digits-only contains() on the phone', 'O(n)'],
  ], [2000, 5226, 1800], { size: 18 }),
  gap(),
  H2('Worked example'),
  P('Typing "YA" in the search box: the query is lower-cased to "ya"; Priya Nair, Kavya Iyer, Ananya Gupta and Diya Reddy contain "ya" and are returned; the GUI then sorts them. Typing "9876" matches every phone that contains those digits. A table search for "abc" returns nothing instead of crashing, because the NumberFormatException is caught.'),
  ...qa([
    ['Is this linear or binary search? Why?', 'Linear (plus a HashMap lookup for IDs). The list is small and "contains" matching cannot use binary search, which needs exact keys in sorted order.'],
    ['How is the search case-insensitive?', 'Both the query and the name are converted with toLowerCase() before contains().'],
  ]),
];

// ------------------------------------------------------------------ 9 sorting
const c9 = [
  ...topic(9, 'Sorting, Comparator and lambdas', REQ),
  oneLine('Sorting orders a list using a Comparator - an object that says which of two items comes first.'),
  gap(),
  ...X('service/RestaurantManager.java', /public enum SortField/, { includeDoc: false }),
  ...X('service/RestaurantManager.java', /public static List<Reservation> sort\(/, { includeDoc: false }),
  H2('Reading the comparator code'),
  bullet([C('Reservation::getDateTime'), ' is a ', I('method reference'), ' - shorthand for the lambda ', C('r -> r.getDateTime()'), '.']),
  bullet([C('Comparator.comparing(key)'), ' builds a comparator that compares that key.']),
  bullet([C('.thenComparing(...)'), ' breaks ties - two parties of 4 are then ordered by time.']),
  bullet([C('comparator.reversed()'), ' gives descending order without writing a second comparator.']),
  bullet([C('Collections.sort'), ' uses TimSort: O(n log n) and ', I('stable'), ' (equal items keep their order).']),
  H2('Worked example'),
  table(['Before', 'Sorted by PARTY_SIZE ascending'], [
    ['Kavya (3, 20:00), Priya (2, 19:00), Diya (4, walk-in), Ananya (2, 21:00)', 'Priya (2, 19:00), Ananya (2, 21:00), Kavya (3), Diya (4) - the two parties of 2 are ordered by time (thenComparing)'],
  ], [4500, 4526], { size: 18 }),
  gap(),
  ...qa([
    ['Comparable vs Comparator?', 'Comparable is the one "natural" order inside the class (compareTo). Comparator is an external order; we need five different orders, so Comparators.'],
    ['Why copy the list before sorting?', 'sort() works on its own copy so the caller\'s list (and the manager\'s master list) is never reordered.'],
    ['What does the TreeMap have to do with sorting?', 'It keeps reservations permanently sorted by time, so "all in time order" needs no sort at all.'],
  ]),
];

// ------------------------------------------------------------------ 10 exceptions
const c10 = [
  ...topic(10, 'Exception handling', REQ),
  oneLine('An exception is an object thrown when something goes wrong; it travels up the call stack until a catch block handles it.'),
  gap(),
  H2('The hierarchy in this project'),
  table(['Class', 'Extends', 'Thrown when'], [
    ['RestaurantException', 'Exception (checked)', 'Base type for every business-rule failure'],
    ['InvalidReservationException', 'RestaurantException', 'Bad name/phone/party size/time, illegal status change'],
    ['InvalidTableException', 'RestaurantException', 'Bad table data or unsafe table change'],
    ['TableNotAvailableException', 'RestaurantException', 'No suitable table free'],
    ['NotFoundException', 'RestaurantException', 'Unknown reservation id, waitlist id or table'],
  ], [3000, 2400, 3626], { size: 18 }),
  gap(),
  ...X('exception/RestaurantException.java', /public class RestaurantException/),
  H2('How an error travels'),
  ...numbered([
    'The host types party size 21 and clicks Book.',
    'ReservationsPanel.book() calls manager.createReservation(...).',
    'createReservation calls Validator.validatePartySize(21), which throws InvalidReservationException("Party size cannot exceed 20...").',
    'The exception passes up through createReservation (declared "throws RestaurantException").',
    'book() catches it and shows the message in an error dialog. Nothing is saved.',
  ]),
  ...R('gui/ReservationsPanel.java', /private void book\(\)/, /^\s{4}}\s*$/),
  H2('Other exception techniques used'),
  bullet(['try-with-resources in DataStore closes the file stream automatically even if writing fails.']),
  bullet(['Catching specific types: TimeUtil catches DateTimeParseException and rethrows a friendly InvalidReservationException.']),
  bullet(['Translating library exceptions: DataStore turns ClassNotFoundException / InvalidClassException into IOException with a clear message.']),
  bullet(['Defensive catch in the monitor thread: a RuntimeException in one sweep is logged instead of killing the thread.']),
  traps([
    'Checked exceptions (extends Exception) must be caught or declared - the compiler forces it. Unchecked (extends RuntimeException) do not. We chose checked so no GUI action can forget to handle a rule violation.',
    'Do not say "the program crashes on bad input" - it never does; every action catches RestaurantException.',
  ]),
  ...qa([
    ['Why one base class RestaurantException?', 'The GUI can catch all business errors with one catch block, while code that cares can still catch a specific subtype.'],
    ['What is the difference between throw and throws?', 'throw actually raises an exception object; throws in a method signature declares which checked exceptions it may raise.'],
    ['What does finally do? Is it used?', 'It runs whether or not an exception occurred. ReservationsPanel.refresh() uses try/finally to always reset its "refreshing" flag.'],
  ]),
];

// ------------------------------------------------------------------ 11 validation
const c11 = [
  ...topic(11, 'Validation and regular expressions', REQ),
  oneLine('Validation checks input against the business rules before anything is changed, and explains exactly what is wrong.'),
  gap(),
  table(['Rule', 'Value', 'Message'], [
    ['Name', '2-50 letters, spaces, . \' -', '"Customer name must be 2-50 characters..."'],
    ['Phone', '10-13 digits, optional +', '"Phone number must contain 10-13 digits..."'],
    ['Party size', `${F.minParty}-${F.maxParty}`, `"Party size cannot exceed ${F.maxParty}..."`],
    ['Time', `not in the past, ${F.open}-${F.last}, ${F.slot}-minute slots, <= ${F.maxDays} days ahead`, '"...is in the past", "...outside service hours", "...15-minute slots"'],
    ['Table capacity', `1-${F.maxCapacity} seats; party must fit`, '"A party of 6 does not fit table 3 (4 seats)."'],
    ['Date text', 'yyyy-MM-dd HH:mm, real calendar date', '"\\"2026-02-30 19:00\\" is not a valid date/time..."'],
  ], [1700, 3300, 4026], { size: 18 }),
  gap(),
  ...R('util/Validator.java', /private static final Pattern NAME/, /private static final Pattern PHONE/),
  H2('Reading the regular expressions'),
  table(['Part', 'Meaning'], [
    [[C('^ ... $')], 'The whole string must match (start to end).'],
    [[C('[A-Za-z]')], 'First character is a letter.'],
    [[C("[A-Za-z .'-]{1,49}")], 'Then 1 to 49 more letters, spaces, dots, apostrophes or hyphens - so "Asha O\'Neil-Rao" is valid, "R2D2" is not.'],
    [[C('\\+?')], 'An optional plus sign.'],
    [[C('\\d{10,13}')], '10 to 13 digits. Spaces, dashes and brackets are stripped first by normalizePhone().'],
  ], [3000, 6026], { size: 18 }),
  gap(),
  P(['Strict date parsing: the formatter uses ', C('uuuu'), ' and ', C('ResolverStyle.STRICT'), ', so 2026-02-30 is rejected instead of being quietly changed to 28 February.']),
  ...X('util/TimeUtil.java', /public static LocalDateTime parse\(String text\)/, { includeDoc: false }),
  H2('Why the spinners allow up to 99'),
  P([`The party-size and seat spinners in the GUI go up to ${F.spinnerMax}, wider than the business limit of ${F.maxParty}. If the spinner itself stopped at ${F.maxParty}, typing 21 would silently snap back and the host would never learn why. Letting Validator reject it produces a clear message instead - and the rule stays in one place.`]),
  ...qa([
    ['Where are the rules defined?', `Only in Validator (constants like MAX_PARTY_SIZE = ${F.maxParty}); the GUI, the manager and the sample data all call the same methods.`],
    ['Why validate in the service layer and not only in the GUI?', 'So the rules hold no matter who calls the manager - GUI, sample data or a future web interface.'],
  ]),
];

// ------------------------------------------------------------------ 12 threads
const c12 = [
  ...topic(12, 'Threads: Runnable, Thread, synchronized and the Swing EDT', REQ),
  oneLine('A thread is an independent path of execution; using more than one lets the program wait or work in the background while the GUI stays responsive.'),
  gap(),
  P([B('Required: '), 'Runnable / Thread to simulate waitlist notification. ', B('Added: '), 'a second monitor thread, synchronized methods, volatile, AtomicInteger and the Event Dispatch Thread rules that make threads safe with Swing.']),
  H2('12.1 Runnable and Thread'),
  P(['A ', C('Runnable'), ' is a task (it has one method, run()). A ', C('Thread'), ' is a worker that executes a task. When guests leave, the manager creates a new Thread for a WaitlistNotifier task:']),
  ...X('service/RestaurantManager.java', /private void scheduleAvailabilityCheck\(/, { includeDoc: false }),
  ...X('service/WaitlistNotifier.java', /public void run\(\)/),
  P([B('start() vs run(): '), 'start() creates a new thread which then calls run(). Calling run() directly would execute it on the current thread and freeze the GUI for 2 seconds.']),
  H2('12.2 The monitor thread'),
  ...X('service/ReservationMonitor.java', /public void run\(\)/),
  bullet(['It is a ', I('daemon'), ' thread (setDaemon(true) in Main), so it does not keep the JVM alive after the window closes.']),
  bullet([C('volatile boolean running'), ' - writes by one thread are immediately visible to the others, so stop() works reliably.']),
  bullet(['InterruptedException is handled by restoring the interrupt flag and exiting cleanly.']),
  H2('12.3 Timeline of one notification'),
  table(['Time', 'Thread', 'What happens'], [
    ['0 ms', 'Swing EDT', 'Host clicks Release Table -> releaseTable(8) marks the visit COMPLETED, table AVAILABLE, and starts the notifier thread. The click returns at once.'],
    ['0-2000 ms', 'notifier', `Thread.sleep(${F.bussingMs}) - the table is being reset. The GUI stays usable.`],
    ['2000 ms', 'notifier', 'processAvailability(8) (synchronized): first party in the LinkedList that fits -> table.hold("W001").'],
    ['2000 ms', 'notifier', 'Manager calls listener.onNotification(ALERT, ...) and onDataChanged().'],
    ['~2001 ms', 'Swing EDT', 'MainFrame\'s invokeLater() runnables run: [READY] line appended, banner turns yellow, tables repaint.'],
  ], [1300, 1500, 6226], { size: 18 }),
  H2('12.4 Why synchronized?'),
  P(['Three threads use the same data: the GUI, the monitor and notifier threads. Without protection, the monitor could hold table 4 for a booking at the exact moment the GUI seats a walk-in there - a ', I('race condition'), ' leaving the table both RESERVED and OCCUPIED. Every public RestaurantManager method is ', C('synchronized'), ': only one thread at a time can be inside any of them, so each operation sees and leaves the data consistent.']),
  H2('12.5 Swing\'s single-thread rule'),
  P(['Swing components may only be touched from the Event Dispatch Thread (EDT). Background threads therefore never update the screen directly - MainFrame wraps every callback in ', C('SwingUtilities.invokeLater(...)'), ', which queues the work on the EDT. Because the manager only queues work (it never waits for the GUI), the lock can never deadlock with the EDT.']),
  traps([
    'Thread.sleep() does not release a lock - that is why the notifier sleeps before calling the synchronized processAvailability(), never inside it.',
    'synchronized methods lock the object (this). DataStore.save() uses synchronized (manager) { ... } to take the same lock while writing the file.',
  ]),
  ...qa([
    ['Why a new thread for every released table instead of one shared thread?', 'Each release needs its own 2-second wait; separate short-lived threads keep them independent. A thread pool (ExecutorService) would be the next step at larger scale.'],
    ['What is a daemon thread?', 'A background thread that does not stop the JVM from exiting when all normal threads have finished.'],
    ['What would happen without invokeLater?', 'Swing could be updated from two threads at once, giving random painting glitches or exceptions; it is not thread-safe.'],
    ['What is a race condition?', 'A bug where the result depends on the timing of two threads; prevented here with synchronized.'],
  ]),
];

// ------------------------------------------------------------------ 13 swing
const c13 = [
  ...topic(13, 'Swing GUI', REQ),
  oneLine('Swing is Java\'s built-in desktop GUI toolkit: windows, panels, tables, buttons and dialogs that react to events.'),
  gap(),
  table(['Component / class', 'Used for'], [
    ['JFrame (MainFrame)', 'The main window, menu bar, header, alert banner and notification log'],
    ['JTabbedPane', 'The four tabs: Floor & Tables, Reservations, Walk-ins & Waitlist, Seating Reports'],
    ['JTable + DefaultTableModel', 'The grids of tables, reservations and waiting parties (model holds rows; view displays them)'],
    ['DefaultTableCellRenderer', 'StatusCellRenderer colours the status column'],
    ['JTextField, JSpinner, JComboBox, JCheckBox', 'Form inputs'],
    ['JOptionPane', 'Error, information and confirmation dialogs; the Add/Edit table dialog'],
    ['BorderLayout, FlowLayout, GridBagLayout, GridLayout', 'Arranging components'],
    ['javax.swing.Timer', 'Clock every 1 s, refresh every 30 s, autosave 1.5 s after a change'],
    ['ActionListener, DocumentListener, ListSelectionListener, WindowAdapter', 'Reacting to clicks, typing in the search box, row selection, closing the window'],
  ], [3800, 5226], { size: 18 }),
  gap(),
  H2('Model-view separation in JTable'),
  P('The JTable only draws; the DefaultTableModel holds the data. refresh() clears the model and refills it from the manager; the JTable repaints itself. Cells are made read-only by overriding isCellEditable:'),
  ...X('gui/GuiUtil.java', /static DefaultTableModel readOnlyModel\(/, { includeDoc: false }),
  H2('Custom cell colours'),
  ...X('gui/StatusCellRenderer.java', /public Component getTableCellRendererComponent\(/, { includeDoc: false }),
  H2('Events'),
  P('Every button is wired with a lambda, e.g. GuiUtil.button("Book", e -> book()). The lambda is an ActionListener: Swing calls it on the EDT when the button is clicked.'),
  ...qa([
    ['Why is javax.swing.Timer used and not java.util.Timer?', 'javax.swing.Timer fires on the EDT, so its code may update components directly.'],
    ['What is the EDT?', 'The Event Dispatch Thread - the single thread that processes all Swing events and painting.'],
    ['How does the GUI learn about changes made by background threads?', 'Through RestaurantListener (Observer); MainFrame queues a refresh with invokeLater.'],
  ]),
];

// ------------------------------------------------------------------ 14 java.time
const c14 = [
  ...topic(14, 'java.time and the Clock', ADD),
  oneLine('The java.time API (Java 8) represents dates and times as immutable, easy-to-compare objects.'),
  gap(),
  bullet([C('LocalDateTime'), ' - a date and time without a zone, e.g. 2026-10-04T19:30. Used for every booking.']),
  bullet([C('Duration.between(a, b).toMinutes()'), ' - minutes between two times (waiting time, lateness).']),
  bullet([C('plusMinutes(90)'), ', ', C('isBefore'), ', ', C('isAfter'), ' - the dining-window and hold-window arithmetic.']),
  bullet([C('DateTimeFormatter'), ' - parses "yyyy-MM-dd HH:mm" strictly and formats "Sun 04 Oct, 19:30".']),
  bullet([C('Clock'), ' - RestaurantManager reads "now" from a Clock passed to its constructor. Normally it is the system clock; for testing a fixed clock makes time-based rules (holds, lateness) repeatable.']),
  ...qa([
    ['Why LocalDateTime and not java.util.Date?', 'It is immutable (thread-safe), has clear methods for adding minutes and comparing, and does not mix in time zones the restaurant does not need.'],
    ['Why inject a Clock?', 'So the logic does not call LocalDateTime.now() directly; a test can control time and check, for example, that a table is held exactly 30 minutes early.'],
  ]),
];

// ------------------------------------------------------------------ 15 serialization
const c15 = [
  ...topic(15, 'Serialization and file I/O', ADD),
  oneLine('Serialization turns an object graph into bytes that can be written to a file and turned back into equal objects later.'),
  gap(),
  bullet(['Model classes implement ', C('Serializable'), ' and declare ', C('serialVersionUID = 1L'), ' so the saved format stays compatible.']),
  bullet(['Everything is saved as one ', C('RestaurantSnapshot'), ' (tables, reservations, waitlist, save time). The HashMap and TreeMap are not saved - they are rebuilt from the list on load, so they can never disagree with it.']),
  ...X('persistence/DataStore.java', /public static void save\(RestaurantManager manager, File file\)/, { includeDoc: false }),
  H2('Why write to a temporary file first?'),
  P('If the computer crashes halfway through writing, the temporary file is damaged but the real data file is untouched. Files.move(... ATOMIC_MOVE) then replaces the old file in one step - you always have either the old data or the new data, never half of each.'),
  H2('Loading and recovery'),
  bullet('On start, Main loads data/restaurant.dat if it exists, otherwise loads sample data.'),
  bullet('A damaged file is renamed restaurant.dat.corrupt-<time> and the app starts with sample data instead of crashing.'),
  bullet('Visits left open from an earlier day are closed, past bookings that never arrived become no-shows, and yesterday\'s waitlist is cleared.'),
  ...qa([
    ['What is serialVersionUID for?', 'A version number for the class\'s saved form; if it differs between saving and loading, Java refuses to load (InvalidClassException) rather than mis-reading data.'],
    ['What does transient mean? Did you use it?', 'A transient field is skipped when serializing. Not needed here - the listeners and indexes live in RestaurantManager, which is not serialized.'],
    ['When is data saved?', `${F.autosaveS} s after any change (a Swing Timer coalesces bursts), on File > Save Now, and when the window closes.`],
  ]),
];

// ------------------------------------------------------------------ 16 algorithms
const c16 = [
  ...topic(16, 'Algorithms used in this project', 'Design'),
  H2('16.1 Best-fit table assignment'),
  ...X('service/RestaurantManager.java', /private Table bestFit\(/, { includeDoc: false }),
  H3('Worked example'),
  table(['Table', 'Seats', 'Fits a party of 3?', 'Free 20:00-21:30?', 'Candidate'], [
    ['1', '2', 'No', '-', 'skip'],
    ['3', '4', 'Yes', 'No (booked 19:30)', 'skip'],
    ['4', '4', 'Yes', 'Yes', 'best so far (4 seats)'],
    ['5', '6', 'Yes', 'Yes', '6 > 4, keep table 4'],
  ], [1200, 1200, 2200, 2400, 2026], { size: 18 }),
  P('Result: table 4. Large tables stay free for large parties. If no table is found in the preferred section, the search is repeated in all sections.'),
  H2('16.2 Interval overlap (no double booking)'),
  ...X('service/RestaurantManager.java', /private Reservation findConflict\(/, { includeDoc: false }),
  table(['Existing booking', 'New booking', 'start < busyTo?', 'end > busyFrom?', 'Conflict?'], [
    ['19:00-20:30', '20:00-21:30', '20:00 < 20:30 yes', '21:30 > 19:00 yes', 'Yes'],
    ['19:00-20:30', '20:30-22:00', '20:30 < 20:30 no', '-', 'No (back-to-back is fine)'],
    ['19:00-20:30', '17:30-19:00', '17:30 < 20:30 yes', '19:00 > 19:00 no', 'No'],
  ], [1900, 1900, 1900, 1800, 1526], { size: 18 }),
  H2('16.3 Offering a free table (priority order)'),
  ...X('service/RestaurantManager.java', /private boolean offerTable\(Table table\)/, { includeDoc: false }),
  ...numbered([
    `A booking for this table due within ${F.hold} minutes gets it first.`,
    `If a booking needs the table within ${F.dining} minutes, it stays free (a walk-in would not finish in time).`,
    'Otherwise the first party in the LinkedList that fits gets it, and the host is told to page them.',
  ]),
  ...qa([
    ['Is best fit optimal?', 'It is a greedy rule that works well in practice and is easy to explain. A perfect assignment for a whole evening is a much harder optimisation problem (bin packing) and not needed for live front-desk decisions.'],
    ['What is the time complexity of finding a table?', 'O(T x R): for each of T tables it checks R reservations for conflicts. With tens of tables and reservations that is instant.'],
  ]),
];

// ------------------------------------------------------------------ 17 compiling
const c17 = [
  ...topic(17, 'Packages, compiling and running', ADD),
  bullet(['Every class is in a package such as ', C('com.restaurant.model'), '; the folder structure src/com/restaurant/model/ matches it.']),
  bullet([C('javac -d out -sourcepath src src/com/restaurant/Main.java'), ' compiles Main and everything it uses into out/.']),
  bullet([C('java -cp out com.restaurant.Main'), ' starts the JVM with out/ on the classpath and runs main().']),
  bullet(['No external libraries - only the JDK - so there is no build tool (Maven/Gradle) to set up.']),
  ...X('Main.java', /public static void main\(String\[\] args\)/, { includeDoc: false }),
  ...qa([
    ['What is the classpath?', 'The list of folders/JARs where the JVM looks for .class files.'],
    ['What does main() do here?', 'Checks there is a display, loads saved or sample data, opens MainFrame on the EDT and starts the monitor thread.'],
    ['What is the difference between the JDK and the JRE?', 'The JRE runs Java programs; the JDK adds the compiler (javac) and tools needed to build them.'],
  ]),
];

module.exports = async function build(outFile) {
  const doc = L.makeDocument({
    title: 'Concepts & Study Guide',
    footerText: 'Concepts & Study Guide',
    sections: [{ children: [...front, ...c1, ...c2, ...c3, ...c4, ...c5, ...c6, ...c7, ...c8, ...c9, ...c10, ...c11, ...c12, ...c13, ...c14, ...c15, ...c16, ...c17] }],
  });
  return L.save(doc, outFile);
};
