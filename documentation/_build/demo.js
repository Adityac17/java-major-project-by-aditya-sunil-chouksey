// Ten-minute live demo script, 60-second version, fallbacks and question tips.
const L = require('./lib');
const { Paragraph, TextRun } = L.docx;
const { P, H1, H2, H3, B, I, C, bullet, numbered, table, callout, gap, FACTS: F, STUDENT: S } = L;

const title = [
  new Paragraph({ spacing: { before: 1200, after: 120 }, children: [new TextRun({ text: 'Live Demo Script (10 minutes)', size: 48, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: S.title, size: 28 })] }),
  new Paragraph({ spacing: { after: 500 }, children: [new TextRun({ text: `${S.subject} - ${S.caseStudy}  |  ${S.name} (${S.roll})`, size: 22, color: L.GREY })] }),
];

const before = [
  H1('Before you start (5 minutes before)'),
  ...numbered([
    [B('Time of day: '), `run the demo between ${F.open} and ${F.last} (ideally 12:00-21:00). The sample data only adds today's bookings (Meera Joshi, Arjun Rao) inside service hours, and step 6 uses them.`],
    [B('Fresh data: '), 'start the app, then File > Load Sample Data > Yes. (Or close it and delete the data folder, then start again.)'],
    [B('Window: '), 'maximise the application window; set screen brightness and zoom so the back row can read it.'],
    [B('Sound on: '), 'the [READY] alert beeps.'],
    [B('Terminal ready: '), 'a terminal in the project folder with ', C('./run.sh'), ' typed (for the restart in step 7).'],
    [B('Code open: '), 'RestaurantManager.java (top of the class), Waitlist.java and WaitlistNotifier.java in your editor, for step 8.'],
    [B('Backup: '), 'Project_Report.docx open at section 5.3 (screenshots) in case anything fails.'],
  ]),
  gap(),
  callout('The story you are telling', [
    'A restaurant host has bookings, walk-ins and tables that keep changing. My system makes the seating decisions by the rules and tells the host who to seat next. Every step of the demo shows one module of the brief.',
  ], 'EEF6EE'),
];

const STEPS = [
  ['0:00 - 0:45', 'Floor & Tables tab', 'Nothing - just point at the screen.',
    'This is my Restaurant Table Reservation and Waitlist System, built in Java with Swing. The host sees the whole floor here: twelve tables in four sections, colour-coded - green available, amber held, red occupied. The header shows free tables, the waitlist and guests dining; the bottom box is the live notification log.'],
  ['0:45 - 2:00', 'Floor & Tables', 'Point at table 5 (Reserved for W002) and table 1 (Reserved for Meera Joshi). Click Add Table: number 13, 4 seats, Main Hall > OK. Select table 13 > Edit Table > Seats 25 > OK.',
    'Module 1, table setup. Table 5 is being held for a waiting party, table 1 for a booking due within 30 minutes. I can add a table - here is table 13 in the main hall. If I try to give it 25 seats, the validator refuses: tables have 1 to 20 seats. Every input in the system is validated like this.'],
  ['2:00 - 3:45', 'Reservations tab', 'Fill: Rahul Verma, 9811122233, party 21, tomorrow 19:00, Any section, Auto-assign > Book (refused). Change party to 4 and time to 19:07 > Book (refused). Change the date to 2026-02-30 19:00 > Book (refused). Set tomorrow 19:00 again > Book (confirmed - the form then clears). Finally type "YA" in Search and pick Sort by Party size.',
    'Module 2, booking. First, bad input: a party of 21 is refused; 19:07 - we take bookings in 15-minute slots; the 30th of February is not a real date. Now a valid booking - Module 4, table assignment: the system picked the smallest table that fits a party of four - best fit - so big tables stay free for big groups, and each party blocks its table for 90 minutes, so double bookings are impossible. Module 6: live search, case-insensitive, and sorting by any column.'],
  ['3:45 - 5:15', 'Walk-ins & Waitlist tab', 'Walk-in: Kiran Das, 9877700011, party 2, Any > Walk-in Arrived. Then: Zoya Mirza, 9877700022, party 2, Patio > Walk-in Arrived.',
    'Module 3, the waitlist. Kiran is seated straight away at a free two-seater. Zoya wants the patio, which is full, so she joins the end of the queue with her position and an estimated wait. The queue is a LinkedList: guests join at the end and are served first-come-first-served.'],
  ['5:15 - 6:45', 'Floor & Tables', 'Select table 8 (Diya Reddy, Patio) > Release Table (guests left). Wait about 2 seconds for the beep and yellow banner. Then select table 8 > Seat Held Party.',
    'Module 5, availability notification - the core of the brief. When guests leave, a separate thread waits two seconds while the table is reset - the screen stays usable - then offers the table. Bookings due soon come first; otherwise the first waiting party that fits. Isha Verma was first in line for the patio, so the table is held for her and I am told to page her. One click seats her.'],
  ['6:45 - 7:45', 'Reservations tab', 'Select Meera Joshi\'s booking (Confirmed, today) > Check In (seat party). Show table 1 turn red on the Floor tab.',
    'Bookings are protected too: Meera\'s booking starts within 30 minutes, so table 1 was held for her automatically - and a background monitor thread re-checks every 15 seconds. When she arrives I check her in. If she were 15 minutes late I would get a warning to call her or mark a no-show.'],
  ['7:45 - 8:45', 'Seating Reports, then the terminal', 'Click Refresh on Seating Reports and scroll briefly. Close the window. In the terminal press Enter on ./run.sh.',
    'Module 7, seating reports: floor status, seat utilisation, each section, today\'s parties, the peak hour and the waitlist. Everything is saved automatically - I close the app, start it again, and the log says the tables, reservations and waitlist were loaded exactly as I left them.'],
  ['8:45 - 10:00', 'Code editor', 'Show RestaurantManager fields; Waitlist.firstFitFor(); WaitlistNotifier.run(); the synchronized keyword on a manager method.',
    'Inside: an ArrayList of tables and reservations, a HashMap from reservation ID to reservation for instant lookup, a TreeMap keyed by time so I can ask "who is due in the next half hour", and the waitlist LinkedList. Here is the first-fit search over the queue, and here is the Runnable that sleeps and then offers the table. All manager methods are synchronized because the GUI and two threads share the data. That covers all six objectives and seven modules of the brief. Thank you - happy to take questions.'],
];

const timeline = [
  H1('The 10-minute demo'),
  P([I('Read the "Say" column in your own words - do not memorise it word for word. Times are cumulative.')]),
  table(['Time', 'Screen', 'Do', 'Say'], STEPS, [1150, 1450, 2800, 3626], { size: 17, cantSplit: true }),
  H2('Transitions'),
  table(['From -> to', 'Line'], [
    ['Floor -> Reservations', '"Now let me take a booking."'],
    ['Reservations -> Waitlist', '"Not everyone books - here is what happens when guests just walk in."'],
    ['Waitlist -> Floor (release)', '"Now the important part - what happens when a table becomes free."'],
    ['Release -> Check-in', '"The same system also protects booked guests."'],
    ['Check-in -> Reports', '"At the end of the evening the manager wants numbers."'],
    ['Reports -> Code', '"Let me show you how this works inside."'],
  ], [2800, 6226], { size: 18 }),
];

const short = [
  H1('60-second version'),
  callout(null, [
    '"This is my Restaurant Table Reservation and Waitlist System in Java Swing. [Floor tab] The host sees every table - available, held or occupied.',
    '[Reservations] I book a party of four; it gets the smallest table that fits, and each party blocks its table for 90 minutes, so no double bookings. Invalid input such as 21 guests is rejected.',
    '[Waitlist] A walk-in who wants the full patio joins a LinkedList queue.',
    '[Floor] When guests leave, a background thread waits two seconds, then holds the table for the first waiting party that fits and alerts me.',
    'Inside, reservations are in an ArrayList, a HashMap by ID and a TreeMap by time; the manager methods are synchronized because the GUI and threads share the data. Everything is saved automatically."',
  ], 'F3F6F9'),
];

const fallbacks = [
  H1('If something goes wrong'),
  table(['Problem during the demo', 'What to do'], [
    ['App does not start (javac / Java error)', 'Use JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./run.sh. If it still fails, switch to the report screenshots (section 5.3) and talk through them.'],
    ['Meera Joshi / Arjun Rao are missing', 'The app was started outside service hours. Skip step 6, or book a party for the slot 20-30 minutes ahead and show its table turn Reserved immediately.'],
    ['Booking refused unexpectedly', 'Read the message aloud - it states the rule ("outside service hours", "15-minute slots"). That is a feature: show it and pick a valid time.'],
    ['Table 8 is not occupied', 'Release any red Patio table (7 or 9) instead; Isha Verma is waiting for the patio.'],
    ['No [READY] alert after releasing', 'Wait the full 2 seconds; if a booking needs that table soon it is kept free on purpose ("bookings come first"). Explain the rule.'],
    ['Data looks messy from rehearsal', 'File > Load Sample Data > Yes resets everything in one step.'],
  ], [3300, 5726], { size: 18 }),
];

const tips = [
  H1('Handling questions'),
  bullet('Repeat the question in your own words before answering - it buys thinking time and avoids answering the wrong question.'),
  bullet('Answer in two sentences, then show it: switch to the app or the code. "Let me show you" is the strongest answer.'),
  bullet('Use the project\'s numbers: 90-minute dining window, 30-minute hold, 15 minutes late, 2-second reset, 15-second sweep.'),
  bullet('If you do not know: say what you do know and how you would find out. Do not guess.'),
  bullet('Keep the Viva Q&A document nearby while rehearsing; questions in sections C, F and J are the most likely.'),
];

module.exports = async function build(outFile) {
  const doc = L.makeDocument({
    title: 'Live Demo Script',
    footerText: 'Live Demo Script',
    sections: [{ children: [...title, ...before, ...timeline, ...short, ...fallbacks, ...tips] }],
  });
  return L.save(doc, outFile);
};
