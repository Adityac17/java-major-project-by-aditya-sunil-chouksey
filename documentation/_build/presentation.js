// Presentation guide: format choice, slide-by-slide plan with speaker notes, condensed demo,
// delivery, rehearsal plan, day-of checklist, Q&A handling and a one-page cue card.
const path = require('path');
const L = require('./lib');
const { Paragraph, TextRun, AlignmentType } = L.docx;
const { P, H1, H2, H3, B, I, C, bullet, numbered, table, callout, gap, figure, FACTS: F, STUDENT: S } = L;

const diag = (f) => path.join(L.DOCS, 'uml', f);
const shot = (f) => path.join(L.DOCS, 'screenshots', f);

const title = [
  new Paragraph({ spacing: { before: 1200, after: 120 }, children: [new TextRun({ text: 'Presentation Guide', size: 48, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: S.title, size: 28 })] }),
  new Paragraph({ spacing: { after: 500 }, children: [new TextRun({ text: `${S.subject} - ${S.caseStudy}  |  ${S.name} (${S.roll})`, size: 22, color: L.GREY })] }),
  callout('What this guide gives you', [
    'How to structure a 10-minute presentation of this project, exactly what to put on each slide and what to say, how to fold the live demo in, and how to deliver it calmly.',
    ['It works together with two other documents: the ', B('Live Demo Script'), ' (every click of the demo) and ', B('Viva Questions & Answers'), ' (what you will be asked afterwards).'],
  ]),
];

// ------------------------------------------------------------------ 1. choose a format
const formats = [
  H1('1. Choose your format', { pageBreakBefore: true }),
  P('Ask your faculty which they expect. If they do not say, use Format B - it shows understanding (slides) and proof (demo).'),
  table(['', 'Format A - demo-led', 'Format B - slides + demo (recommended)'], [
    [[B('Shape')], 'One opening line, 10 minutes of live demo, one closing line', '4 min of slides, 4.5 min of live demo, 1.5 min of slides'],
    [[B('Best when')], 'The panel said "show us the working project"', 'The panel expects a presentation, or you are not sure'],
    [[B('You need')], 'The app only', 'The app + 9 slides (content in section 2)'],
    [[B('Script')], 'Live Demo Script, as written', 'This guide, sections 2-3'],
    [[B('Risk')], 'If the app fails, there is little to fall back on', 'If the app fails, the slides and screenshots carry you'],
  ], [1500, 3600, 3926], { size: 19 }),
  gap(),
  H2('Format B timeline'),
  table(['Time', 'Part', 'Content'], [
    ['0:00 - 4:00', 'Slides 1-6', 'Title, problem, objectives and modules, architecture, data structures, key algorithms'],
    ['4:00 - 8:30', 'Live demo', 'Booking + validation, walk-ins, table release -> notification, check-in, reports and restart'],
    ['8:30 - 10:00', 'Slides 7-9', 'Testing and results, conclusion and future scope, thank you / questions'],
  ], [1700, 1600, 5726], { size: 19 }),
];

// ------------------------------------------------------------------ 2. slides
function slide(n, name, time, onSlide, visual, say, extra = []) {
  return [
    H2(`Slide ${n} - ${name}`),
    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `⏱ ${time}`, size: 19, color: L.GREY, bold: true })] }),
    table(['On the slide', 'Visual'], [[
      onSlide.map((t) => new Paragraph({ spacing: { after: 60, line: 252 }, children: L.runs(t, { size: 19 }) })),
      visual,
    ]], [5426, 3600], { size: 19 }),
    ...extra,
    callout('Say', [say], 'EEF6EE'),
    gap(120),
  ];
}

const { SLIDES, onSlideLines } = require('./slides_data');
const FIG = { 4: ['uml/architecture.png', 'Visual for slide 4'], 6: ['uml/flowchart-waitlist-notification.png', 'Visual for slide 6'], 7: ['screenshots/06-validation-party-size.png', 'Visual for slide 7'] };

const slides = [
  H1('2. Slide-by-slide plan (Format B)', { pageBreakBefore: true }),
  callout('The ready-made deck', [
    ['These nine slides are already built: ', B('docs/Presentation_Slides.pptx'), '. The text below is exactly what is on each slide, and the "Say" boxes are also in the deck\'s speaker notes (View > Notes in PowerPoint).'],
  ], 'EEF6EE'),
  gap(),
  callout('Slide design rules (if you edit the deck)', [
    'At most 5 short lines per slide, at least 24 pt text, one idea per slide.',
    'Show diagrams and screenshots, not code. Never read the slide aloud - the slide is for the audience, the "Say" box is for you.',
    'Keep one theme throughout; the slide number is in the corner so examiners can refer to it ("on slide 5...").',
  ], 'F3F6F9'),
  gap(),
];
for (const sd of SLIDES) {
  const fig = FIG[sd.n] ? figure(path.join(L.DOCS, FIG[sd.n][0]), 380, FIG[sd.n][1]) : [];
  slides.push(...slide(sd.n, sd.name, sd.time, onSlideLines(sd), sd.visual, sd.say, fig));
  if (sd.n === 6) {
    slides.push(callout('Slides 7-9 come after the demo (section 3)', ['Switch to the application now. Say: "Let me show you the system running."'], 'FFF8E1'), gap());
  }
}

// ------------------------------------------------------------------ 3. condensed demo
const demo = [
  H1('3. The 4.5-minute live demo (Format B)', { pageBreakBefore: true }),
  P(['This is a shortened version of the ', B('Live Demo Script'), '. Do its "Before you start" checklist first (fresh sample data, run between ', `${F.open} and ${F.last}`, ').']),
  table(['Time', 'Do', 'Say (short)'], [
    ['4:00 - 4:30', 'Floor & Tables tab - point at the colours, table 5 (held for W002) and table 1 (held for Meera Joshi).', '"Here is the live floor: green free, amber held, red occupied."'],
    ['4:30 - 5:45', 'Reservations: Rahul Verma, 9811122233, party 21, tomorrow 19:00 > Book (refused). Party 4, time 19:07 > Book (refused). Time back to 19:00 > Book (confirmed).', '"Twenty-one guests: refused. 19:07: we book in 15-minute slots. A party of four at 19:00: best fit chose a four-seat table."'],
    ['5:45 - 6:30', 'Walk-ins & Waitlist: Kiran Das, 9877700011, party 2, Any > Walk-in Arrived. Then Zoya Mirza, 9877700022, party 2, Patio > Walk-in Arrived.', '"Kiran is seated at once. The patio is full, so Zoya joins the end of the LinkedList queue."'],
    ['6:30 - 7:30', 'Floor & Tables: table 8 (Diya Reddy) > Release Table. Wait for the beep and the yellow banner. Then Seat Held Party.', `"A thread waits ${F.bussingS} seconds while the table is reset - the screen stays usable - then holds it for Isha, first in line for the patio."`],
    ['7:30 - 8:00', 'Reservations: Meera Joshi > Check In.', '"Her table was held 30 minutes before her booking. She arrives - checked in."'],
    ['8:00 - 8:30', 'Seating Reports > Refresh. Close the window and run ./run.sh again.', '"The report summarises the evening. Everything is saved - I restart and it\'s all back."'],
  ], [1300, 4200, 3526], { size: 18 }),
  gap(),
  P([B('Back to slide 7. '), 'Say: "So that is the system working. Here is how I tested it."']),
];

// ------------------------------------------------------------------ 4. delivery
const delivery = [
  H1('4. Delivering it well', { pageBreakBefore: true }),
  H2('Voice and pace'),
  bullet('Aim for about 130 words a minute - slower than normal conversation. The "Say" boxes are deliberately shorter than ten minutes of speech, leaving room for clicks, pauses and the demo.'),
  bullet('Pause for a second after each key point ("...so two bookings can never overlap." pause). Pauses sound confident; "um" does not.'),
  bullet('Learn the first 30 seconds word for word. Once you have started well, the rest follows.'),
  H2('Body and screen'),
  bullet('Stand to the side of the screen and face the panel, not the slide. Glance at the laptop, talk to people.'),
  bullet('During the demo, say what you are doing before you click: "Now I release table 8..." Silence while clicking feels long.'),
  bullet('Use the mouse pointer to point; move it slowly and keep it still while you talk about something.'),
  bullet('If you make a typo, fix it calmly - it shows you know the system.'),
  H2('Words that work'),
  table(['Instead of...', 'Say...'], [
    ['"Basically it just stores the data"', '"Reservations are stored in an ArrayList and indexed by ID in a HashMap"'],
    ['"It sort of picks a table"', '"Best fit picks the smallest table that fits the party"'],
    ['"There is some thread thing"', `"A background thread waits ${F.bussingS} seconds, then offers the table"`],
    ['"I think it works"', '"All 16 test cases passed"'],
  ], [4200, 4826], { size: 19 }),
];

// ------------------------------------------------------------------ 5. rehearsal
const rehearsal = [
  H1('5. Rehearsal plan'),
  table(['When', 'Do this', 'Done'], [
    ['3 days before', 'Read Concepts & Study Guide chapters 6 (Collections), 12 (Threads) and 16 (Algorithms). Run the test checklist in the Setup Guide once.', '☐'],
    ['2 days before', 'Make the 9 slides (if Format B). Do two full timed run-throughs alone. Record one on your phone and watch it back.', '☐'],
    ['1 day before', 'One run-through in front of a friend who then asks 10 questions from the Viva Q&A. Fix anything you stumbled on.', '☐'],
    ['1 day before', 'Prepare backups: report PDF/Word and screenshots on the laptop and a USB stick.', '☐'],
    ['On the day', 'Work through the day-of checklist (section 6) 15 minutes before your slot.', '☐'],
  ], [1700, 6326, 1000], { size: 19 }),
  gap(),
  callout('Timing check', [
    'If a run-through takes more than 11 minutes, cut the code tour first, then the reports step - never cut the table-release notification, it is the heart of the brief.',
  ], 'FFF8E1'),
];

// ------------------------------------------------------------------ 6. day-of checklist
const dayOf = [
  H1('6. Day-of checklist'),
  table(['', 'Item'], [
    ['☐', 'Laptop charged, charger packed, HDMI / USB-C adapter packed.'],
    ['☐', 'Do Not Disturb on; close chat apps and browser tabs; hide desktop clutter.'],
    ['☐', 'Connect to the projector early; choose "mirror" display; check the app window fits (it needs at least 1100 x 700).'],
    ['☐', `Inside service hours (${F.open}-${F.last})? Today's sample bookings only appear then.`],
    ['☐', 'Start the app (JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./run.sh), then File > Load Sample Data > Yes.'],
    ['☐', 'Slides open on slide 1 (Format B); app open on the Floor & Tables tab behind it.'],
    ['☐', 'Terminal open in the project folder with ./run.sh ready for the restart step.'],
    ['☐', 'Code editor open on RestaurantManager.java, Waitlist.java and WaitlistNotifier.java (for questions).'],
    ['☐', 'Sound on - the [READY] alert beeps.'],
    ['☐', 'Backup ready: Project_Report.docx at section 5.3 (snapshots).'],
    ['☐', 'Water nearby. Breathe out slowly before you start.'],
  ], [700, 8326], { size: 19 }),
];

// ------------------------------------------------------------------ 7. questions
const questions = [
  H1('7. Handling questions', { pageBreakBefore: true }),
  numbered([
    [B('Listen to the whole question. '), 'Do not start answering halfway.'],
    [B('Repeat it briefly. '), '"So you are asking why a LinkedList and not an ArrayList?" - it buys thinking time and checks you understood.'],
    [B('Answer in two sentences. '), 'Then stop. If they want more, they will ask.'],
    [B('Show it. '), '"Let me show you" - switch to the app or the code. This is the most convincing answer there is.'],
    [B('If you do not know: '), 'say what you do know and how you would find out. Never guess or bluff.'],
  ]),
  H2('The ten most likely questions'),
  table(['Question', 'Your answer in one line'], [
    ['Why a LinkedList for the waitlist?', 'Guests join at the end and leave from the front or middle - O(1) with a LinkedList; an ArrayList would shift elements.'],
    ['Why a TreeMap?', 'It keeps bookings sorted by time, so subMap() gives "who is due in the next 30 minutes" directly.'],
    ['Why a HashMap?', 'Finding a reservation by ID is O(1) instead of scanning every booking.'],
    ['How do you prevent double booking?', `Each party blocks its table for ${F.dining} minutes; a new booking conflicts if the time intervals overlap.`],
    ['How does the notification work?', `Releasing a table starts a thread that sleeps ${F.bussingS} s, then holds the table for the next booking or the first waiting party that fits, and alerts the host.`],
    ['Why synchronized?', 'The GUI and two threads change the same data; synchronized lets only one in at a time, so there are no race conditions.'],
    ['How do threads update the GUI?', 'Through the RestaurantListener interface; MainFrame uses SwingUtilities.invokeLater so updates run on the Event Dispatch Thread.'],
    ['What happens with bad input?', 'Validator throws a checked InvalidReservationException; the GUI catches it and shows the message. Nothing is saved.'],
    ['How is data saved?', `Serialization to a temporary file, then an atomic move over data/restaurant.dat, ${F.autosaveS} s after each change.`],
    ['What would you improve?', 'A database for several front desks, SMS paging for waiting guests, joining tables for large groups.'],
  ], [3300, 5726], { size: 18 }),
  P([I('More questions with fuller answers: Viva Questions & Answers.')], { spacing: { before: 160 } }),
];

// ------------------------------------------------------------------ 8. mistakes + cue card
const mistakes = [
  H1('8. Common mistakes to avoid'),
  bullet('Reading the slides aloud, or showing slides full of code.'),
  bullet('Starting the demo without resetting the data - leftover rehearsal bookings make the steps behave differently.'),
  bullet('Clicking in silence. Narrate every action.'),
  bullet('Running over time. Practise with a timer; know what to cut (section 5).'),
  bullet('Saying "it just works" - always name the structure or the rule: HashMap, best fit, synchronized.'),
  bullet('Panicking if something fails. Say "let me show you the screenshot instead" and carry on.'),
];

const cue = [
  H1('9. One-page cue card (print this)', { pageBreakBefore: true }),
  table(['Time', 'Part', 'Key words'], [
    ['0:00', 'S1 Title', 'name - Restaurant Reservation & Waitlist - Java Swing'],
    ['0:20', 'S2 Problem', 'bookings + walk-ins + changing tables - double booking - fairness'],
    ['1:00', 'S3 Objectives', '6 objectives - 7 modules - all implemented'],
    ['1:40', 'S4 Architecture', 'GUI -> Service -> Model - RestaurantManager - 2 threads - autosave'],
    ['2:30', 'S5 Data structures', 'ArrayList all - HashMap by ID - TreeMap by time - LinkedList queue'],
    ['3:20', 'S6 Algorithms', `best fit - ${F.dining}-min window - fair queue - thread ${F.bussingS} s`],
    ['4:00', 'DEMO floor', 'colours - table 5 W002 - table 1 Meera'],
    ['4:30', 'DEMO booking', 'Rahul 21 refused - 19:07 refused - 4 at 19:00 -> 4-seater'],
    ['5:45', 'DEMO walk-ins', 'Kiran seated - Zoya patio -> queue'],
    ['6:30', 'DEMO release', 'table 8 -> 2 s -> Isha -> Seat Held Party'],
    ['7:30', 'DEMO check-in', 'Meera -> Check In'],
    ['8:00', 'DEMO reports', 'Refresh - close - ./run.sh - restored'],
    ['8:30', 'S7 Testing', '16 cases - all passed - clear errors'],
    ['9:00', 'S8 Conclusion', '6 / 7 / 14 - future: database, SMS, join tables'],
    ['9:40', 'S9 Questions', 'thank you - app open behind'],
  ], [1100, 2200, 5726], { size: 19 }),
  gap(),
  callout('Numbers to remember', [`${F.dining}-minute dining window  |  ${F.hold}-minute hold  |  ${F.late} minutes late = warning  |  ${F.bussingS}-second reset  |  ${F.monitorS}-second sweep  |  party ${F.minParty}-${F.maxParty}  |  ${F.open}-${F.last}, ${F.slot}-minute slots  |  16 tests passed`], 'F3F6F9'),
];

module.exports = async function build(outFile) {
  const doc = L.makeDocument({
    title: 'Presentation Guide',
    footerText: 'Presentation Guide',
    sections: [{ children: [...title, ...formats, ...slides, ...demo, ...delivery, ...rehearsal, ...dayOf, ...questions, ...mistakes, ...cue] }],
  });
  return L.save(doc, outFile);
};
