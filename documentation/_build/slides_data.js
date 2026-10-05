// Single source for the 9-slide presentation: used by deck.js (the .pptx) and presentation.js (the guide).
const L = require('./lib');
const F = L.FACTS;
const S = L.STUDENT;

const SLIDES = [
  {
    n: 1, name: 'Title', time: '0:00 - 0:20',
    title: S.title,
    lines: [`${S.caseStudy}  ·  ${S.subject}`, `${S.name}  |  ${S.roll}`, S.programme],
    visual: 'ITM Skills University logo and the three table-status markers',
    say: `"Good morning. I'm ${S.name}. My case study is a Restaurant Table Reservation and Waitlist System, built in Java with a Swing interface."`,
  },
  {
    n: 2, name: 'The problem', time: '0:20 - 1:00',
    title: 'The problem',
    cards: [
      ['Double bookings', 'Two parties promised the same table'],
      ['Wasted big tables', 'A couple seated at a six-seater'],
      ['Walk-ins skipped', 'Guests forgotten or seated out of turn'],
    ],
    goal: 'Seat by the rules - and tell the host who is next',
    visual: 'Three problem cards with icons, and the goal in a maroon panel',
    say: '"A restaurant host juggles three things: guests who booked, guests who just walk in, and tables that are free, held or occupied. Done on paper, tables get double-booked, a couple ends up at a six-seat table, and walk-ins get skipped. My system applies the seating rules automatically and tells the host exactly who should get a table the moment it frees up."',
  },
  {
    n: 3, name: 'Objectives and modules', time: '1:00 - 1:40',
    title: 'Objectives and modules',
    stats: [['6', 'objectives'], ['7', 'modules'], ['14', 'Java concepts']],
    modules: ['Table Setup', 'Reservation Booking', 'Waitlist Management', 'Table Assignment', 'Availability Notification', 'Reservation Search', 'Seating Reports'],
    visual: 'Three big numbers, and the seven modules as numbered tiles',
    say: '"The brief gave six objectives, seven modules and fourteen Java concepts. Every one is implemented - each module is a tab or a service in the application, and I will show most of them live in a minute."',
  },
  {
    n: 4, name: 'Architecture', time: '1:40 - 2:30',
    title: 'Architecture',
    points: [
      ['GUI → Service → Model', 'The Swing screens only collect input and show results'],
      ['One decision-maker', 'RestaurantManager holds every rule'],
      ['Two background threads', `Notifier (waits ${F.bussingS} s) and monitor (every ${F.monitorS} s)`],
      ['Saved automatically', 'data/restaurant.dat, restored on restart'],
    ],
    image: 'uml/architecture.png',
    visual: 'docs/uml/architecture.png with four key points beside it',
    say: '"The code is in layers. The Swing GUI only collects input and shows results; every rule lives in one service class, RestaurantManager. Two background threads - a notifier and a monitor - call the same manager, and data is saved automatically to a file. Because the rules are separate from the screen, they are easy to test."',
  },
  {
    n: 5, name: 'Data structures', time: '2:30 - 3:20',
    title: 'Data structures',
    cards: [
      ['ArrayList', 'All tables and reservations', 'keeps everything'],
      ['HashMap', 'Reservation ID → reservation', 'O(1) lookup'],
      ['TreeMap', 'Bookings sorted by start time', '"who is due in 30 min?"'],
      ['LinkedList', 'The walk-in waitlist', 'first come, first served'],
    ],
    enumLine: ['AVAILABLE', 'RESERVED', 'OCCUPIED'],
    visual: 'Four cards (structure, what it holds, why) and the TableStatus enum as coloured chips',
    say: '"I chose each collection for one question. The ArrayList keeps everything. The HashMap finds a booking by its ID instantly. The TreeMap keeps bookings sorted by time, so I can ask who is due in the next half hour. And the waitlist is a LinkedList, because guests join at the end and are served first-come-first-served - exactly what the brief suggests. Table status is an enum: available, reserved, occupied."',
  },
  {
    n: 6, name: 'Key algorithms', time: '3:20 - 4:00',
    title: 'Key algorithms',
    steps: [
      ['Best fit', 'Smallest table that fits the party'],
      ['No double booking', `Each party blocks its table for ${F.dining} min`],
      ['Fair queue', 'First waiting party that fits gets the table'],
      ['Notification', `Release → thread waits ${F.bussingS} s → hold → alert`],
    ],
    image: 'uml/flowchart-waitlist-notification.png',
    visual: 'Four numbered steps, and the "Guests leave" half of Flowchart 2',
    say: `"Three rules drive the system. Best fit gives a party the smallest table that fits. Every party blocks its table for ${F.dining} minutes, so two bookings can never overlap. And when guests leave, a background thread waits ${F.bussingS} seconds while the table is reset, then gives it to the booking due next or to the first waiting party that fits - and alerts the host. Let me show you." (Switch to the application for the live demo.)`,
  },
  {
    n: 7, name: 'Testing and results', time: '8:30 - 9:00',
    title: 'Testing and results',
    stat: ['16 / 16', 'test cases passed'],
    points: [
      'Every module and every validation rule',
      'Errors explain the fix: "15-minute slots", "cannot exceed 20"',
      `Background notification verified at about ${F.bussingS} s`,
      'All data restored after a restart',
    ],
    image: 'screenshots/06-validation-party-size.png',
    visual: 'Big "16 / 16" number, four checks, and the real party-size error screenshot',
    say: '"I tested the finished system against sixteen cases covering every module and every validation rule - including the background notification and restoring data after a restart. All sixteen passed. Bad input never crashes the program; it gets a message that explains the rule."',
  },
  {
    n: 8, name: 'Conclusion and future scope', time: '9:00 - 9:40',
    title: 'Conclusion and future scope',
    done: [['6', 'objectives met'], ['7', 'modules built'], ['14', 'Java concepts used']],
    extra: 'Plus realistic rules: best fit, a fair queue, held tables and autosave',
    next: [['Database', 'Several front desks share one reservation book'], ['SMS paging', 'Waiting guests are notified automatically'], ['Join tables', 'Seat very large groups together']],
    visual: 'Three result tiles and three next steps with icons',
    say: '"To conclude: the system meets all six objectives, all seven modules and all fourteen Java concepts in the brief. With more time I would move the data to a database so several front desks can share it, page waiting guests by SMS, and allow tables to be joined for large groups."',
  },
  {
    n: 9, name: 'Thank you - questions', time: '9:40 - 10:00',
    title: 'Thank you',
    lines: ['Questions?', `${S.name}  |  ${S.roll}`],
    visual: 'Closing slide; keep the app open behind it so you can switch to it for answers',
    say: '"Thank you. I\'m happy to take questions - and I can show anything in the application or the code."',
  },
];

/** Plain-text lines of what appears on each slide (used by the guide's "On the slide" column). */
function onSlideLines(s) {
  switch (s.n) {
    case 1: return [s.title, ...s.lines];
    case 2: return [...s.cards.map(([h, d]) => `${h} - ${d}`), `Goal: ${s.goal}`];
    case 3: return [s.stats.map(([n, w]) => `${n} ${w}`).join('  ·  '), ...s.modules.map((m, i) => `${i + 1}. ${m}`)];
    case 4: return s.points.map(([h, d]) => `${h} - ${d}`);
    case 5: return [...s.cards.map(([h, d, w]) => `${h} - ${d} (${w})`), `TableStatus: ${s.enumLine.join(' · ')}`];
    case 6: return s.steps.map(([h, d], i) => `${i + 1}. ${h} - ${d}`);
    case 7: return [`${s.stat[0]} ${s.stat[1]}`, ...s.points];
    case 8: return [...s.done.map(([n, w]) => `${n} ${w}`), s.extra, ...s.next.map(([h, d]) => `Next: ${h} - ${d}`)];
    case 9: return [s.title, ...s.lines];
    default: return [];
  }
}

module.exports = { SLIDES, onSlideLines };
