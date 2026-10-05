// Line-by-line setup and run guide, with the end-to-end test checklist and troubleshooting.
const L = require('./lib');
const { Paragraph, TextRun, AlignmentType } = L.docx;
const { P, H1, H2, H3, B, I, C, bullet, numbered, table, commandTable, callout, gap, FACTS: F, STUDENT: S } = L;

const title = [
  new Paragraph({ spacing: { before: 1200, after: 120 }, children: [new TextRun({ text: 'Setup & Run Guide', size: 48, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: S.title, size: 28 })] }),
  new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: `${S.subject} - ${S.caseStudy}  |  ${S.name} (${S.roll})`, size: 22, color: L.GREY })] }),
  callout('How to use this guide', [
    'Work through the stages in order. Every command is in a two-column table: the left column is exactly what you type, the right column explains what it does.',
    'After each stage there is a Checkpoint telling you what you should see. If you do not see it, stop and look in the Troubleshooting table at the end before continuing.',
    ['Stage 6 is your ', B('end-to-end test checklist'), ' - tick each box as you go. It takes about 15 minutes and is a good rehearsal for the live demo.'],
  ]),
];

/** Each argument is one paragraph: a string, or an array of text runs. */
const checkpoint = (...paras) => callout('Checkpoint', paras, 'EEF6EE');

const stage0 = [
  H1('Stage 0 - What you need', { pageBreakBefore: true }),
  table(['Item', 'Details'], [
    ['Computer', 'Windows 10/11, macOS or Linux, with a screen (it is a desktop GUI).'],
    ['Java Development Kit (JDK)', 'Version 8 or newer. JDK 17 or 21 is recommended. You need the JDK (it contains javac, the compiler), not only the JRE.'],
    ['Project folder', '"Final Project" containing src/, docs/, run.sh, run.bat and README.md.'],
    ['Optional', 'An IDE such as IntelliJ IDEA Community, Eclipse or VS Code with the Java extension.'],
  ], [2600, 6426]),
  gap(),
  callout('Your Mac specifically', [
    ['The ', C('java'), ' command already on your Mac is an old Java 8 runtime without the compiler. Typing ', C('javac'), ' on its own fails with "Unable to locate a Java Runtime that supports javac". A full JDK 21 is installed through Homebrew at ', C('/opt/homebrew/opt/openjdk@21'), ' - Stage 1 shows how to point to it.'],
  ], 'FFF8E1'),
];

const stage1 = [
  H1('Stage 1 - Install or select the JDK'),
  H2('macOS'),
  commandTable([
    ['/opt/homebrew/opt/openjdk@21/bin/javac -version', 'Checks the Homebrew JDK 21 that is already installed on your Mac.'],
    ['brew install openjdk@21', 'Only if the line above says "No such file": installs JDK 21 with Homebrew.'],
    ['export JAVA_HOME=/opt/homebrew/opt/openjdk@21', 'Tells run.sh (and this terminal window) which JDK to use. Lasts until you close the terminal.'],
    ['echo \'export JAVA_HOME=/opt/homebrew/opt/openjdk@21\' >> ~/.zshrc', 'Optional: makes JAVA_HOME permanent for every new terminal.'],
    ['"$JAVA_HOME/bin/javac" -version', 'Confirms the compiler that will be used.'],
  ]),
  checkpoint(['You see a line such as ', C('javac 21.0.x'), '.']),
  H2('Windows'),
  ...numbered([
    'Download "Eclipse Temurin JDK 21 (LTS)" for Windows x64 (.msi) from adoptium.net.',
    'Run the installer. On the "Custom Setup" screen enable "Set JAVA_HOME variable" and "Add to PATH".',
    'Close and reopen Command Prompt so it picks up the new PATH.',
  ]),
  commandTable([
    ['javac -version', 'Checks that the compiler is on the PATH.'],
    ['java -version', 'Checks the runtime. Both should report the same major version (for example 21).'],
  ]),
  checkpoint(['Both commands print version 21 (or whichever JDK you installed). If you see "\'javac\' is not recognized", see Troubleshooting.']),
];

const stage2 = [
  H1('Stage 2 - Open the project folder'),
  commandTable([
    ['cd ~/Documents/Java/"Final Project"', 'macOS: moves the terminal into the project. The quotes are needed because the folder name has a space.'],
    ['cd "%USERPROFILE%\\Documents\\Java\\Final Project"', 'Windows Command Prompt equivalent (adjust if you copied the folder elsewhere).'],
    ['ls', 'macOS/Linux: lists the folder contents (on Windows use dir).'],
  ]),
  checkpoint(['You see ', C('README.md  docs  run.bat  run.sh  src'), ' (an ', C('out'), ' or ', C('data'), ' folder may also appear after the first run).']),
];

const stage3 = [
  H1('Stage 3 - Compile and run with the script'),
  commandTable([
    ['./run.sh', 'macOS/Linux: deletes old compiled classes, compiles everything from src/ into out/, and opens the application.'],
    ['chmod +x run.sh', 'Only if you get "permission denied": makes the script executable, then run ./run.sh again.'],
    ['run.bat', 'Windows: does the same as run.sh. (Written for Windows but not yet tried on a Windows PC - if it fails, use Stage 4.)'],
  ]),
  checkpoint(
    'A window titled "Restaurant Table Reservation & Waitlist System" opens with four tabs. The Host notifications box at the bottom says "First run: loaded sample data. Changes are saved automatically to ...restaurant.dat".',
    'Within a second a [READY] line appears, for example "Table 5 (6 seats, Main Hall) is free - page waitlisted party W002 - Karan Malhotra".',
  ),
];

const stage4 = [
  H1('Stage 4 - Compile and run by hand (what the script does)'),
  P('Useful if a script fails, and worth understanding for the viva.'),
  commandTable([
    ['mkdir out', 'Creates the output folder for compiled .class files (skip if it already exists).'],
    ['javac -encoding UTF-8 -d out -sourcepath src src/com/restaurant/Main.java',
      '-encoding UTF-8: read source as UTF-8.  -d out: put .class files in out/ (in package folders).  -sourcepath src: where to find the other source files; javac compiles every class that Main uses, directly or indirectly.'],
    ['java -cp out com.restaurant.Main', '-cp out: look for classes in out/.  com.restaurant.Main: the fully-qualified class whose main() method starts the program.'],
    ['java -cp out com.restaurant.Main backup.dat', 'Optional: use a different data file instead of data/restaurant.dat.'],
  ]),
  callout('Windows note', [['Use backslashes in the source path: ', C('javac -encoding UTF-8 -d out -sourcepath src src\\com\\restaurant\\Main.java')]]),
  gap(),
  checkpoint(['javac prints nothing (or only warnings) and the same window as Stage 3 opens.']),
];

const stage5 = [
  H1('Stage 5 - Run inside an IDE (optional)'),
  H2('IntelliJ IDEA'),
  ...numbered(['File > Open... and choose the "Final Project" folder.', 'Right-click src > Mark Directory as > Sources Root.',
    'File > Project Structure > Project: choose your JDK as the SDK.', 'Open src/com/restaurant/Main.java and click the green Run arrow next to main().']),
  H2('VS Code'),
  ...numbered(['Install the "Extension Pack for Java".', 'File > Open Folder... > "Final Project".', 'Open Main.java and click "Run" above the main() method.']),
  H2('Eclipse'),
  ...numbered(['File > New > Java Project, untick "Use default location", browse to "Final Project", Finish.', 'If src is not a source folder: right-click it > Build Path > Use as Source Folder.', 'Right-click Main.java > Run As > Java Application.']),
  checkpoint(['The same window opens. The data file is created in the IDE\'s working directory (normally the project folder).']),
];

// ------------------------------------------------------------------ stage 6: the test checklist
const box = '☐';
const TESTS = [
  ['TC01', 'Floor & Tables > Add Table. Enter number 3, any seats, OK.', 'Error: "Table 3 already exists."'],
  ['TC02', 'Select table 3 > Edit Table > Seats 2 > OK.', 'Error: "Cannot reduce table 3 to 2 seats: R1001 has a party of 4." (R1001 is Aarav Sharma\'s booking for tomorrow)'],
  ['TC03', `Reservations: name "Rahul Verma", phone 9811122233, Party size ${F.maxParty + 1}, tomorrow 19:00 > Book.`, `Error: "Party size cannot exceed ${F.maxParty}. Larger groups need an event booking with the manager."`],
  ['TC04', 'Same form, party 4, Date & time = yesterday\'s date 19:00 > Book. Then try today 23:00.', '"...is in the past." then "Guests are seated between 11:00 and 22:30; 23:00 is outside service hours."'],
  ['TC05', 'Same form, Date & time tomorrow 19:07 > Book.', `"Reservations are taken in ${F.slot}-minute slots (e.g. 19:00, 19:15, 19:30)."`],
  ['TC06', 'Date & time 2026-02-30 19:00 > Book.', '"\\"2026-02-30 19:00\\" is not a valid date/time. Use yyyy-MM-dd HH:mm..."'],
  ['TC07', 'Clear the form. Name "Sara Ali", phone 9822233344, party 3, tomorrow 15:00, Section Any, Table Auto-assign > Book.', 'Confirmed at a 4-seat table (smallest that fits) - note its table number.'],
  ['TC08', 'Name "Dev Rao", phone 9833344455, party 2, tomorrow 15:30, Table = the table from TC07 > Book.', 'Error: "Table N is already booked by R.... around ... Choose another table or time."'],
  ['TC09', 'Walk-ins & Waitlist: name "Ali Khan", phone 9000011111, party 2, Section Patio > Walk-in Arrived.', 'Patio is full: added to the waitlist with position # and "about N min".'],
  ['TC10', 'Floor & Tables: select table 8 (Diya Reddy, Patio) > Release Table (guests left). Wait.', `"Table 8 released..." then about ${F.bussingS} s later a [READY] line: table 8 held for Isha Verma (W001), banner turns yellow.`],
  ['TC11', 'Immediately add another walk-in: party 2, Section Patio > Walk-in Arrived.', 'Queued behind the others - nobody takes table 8 from Isha.'],
  ['TC12', 'Name "Neel Shah", phone 9844455566, party 2, the 15-minute slot 20-30 min from now > Book.', 'At once its table turns Reserved and a [READY] "Table N is now held for R..." line appears.'],
  ['TC13', 'Reservations: type "YA" in Search (Customer name / phone), Sort by Party size.', 'Only names containing "ya" (Priya, Kavya, Ananya, Diya) - capitals ignored - smallest party first.'],
  ['TC14', 'Select Neel Shah\'s booking from TC12 > Cancel Reservation > Yes.', 'Status Cancelled; its table is freed and offered to the next suitable party or shown Available.'],
  ['TC15', 'Close the window (the app saves). Run ./run.sh again.', 'Log says "Loaded 12 tables, N reservations and M waiting parties (saved ...)"; everything is as you left it.'],
  ['TC16', 'Close the app. In the terminal type: echo broken > data/restaurant.dat  - then run the app again.', '"Could not read saved data (...). The unreadable file was kept as restaurant.dat.corrupt-... Started with sample data instead."'],
];
const stage6 = [
  H1('Stage 6 - End-to-end test checklist'),
  P('Start from fresh sample data: File > Load Sample Data (or delete the data folder) before TC01. Work top to bottom - some cases build on the previous one. Tick the box when the expected result appears.'),
  callout('Time of day matters', [`Bookings and walk-ins are only accepted between ${F.open} and ${F.last}, and the sample data adds today\'s bookings only when it is inside those hours. Run the checklist during that window; tables 1 and 3 may then show today\'s bookings (Meera Joshi, Arjun Rao).`], 'FFF8E1'),
  gap(),
  table(['Done', 'ID', 'Do this', 'You should see'], TESTS.map(([id, doIt, see]) => [
    [{ text: box, size: 28 }], [B(id)], doIt, see,
  ]), [700, 800, 3900, 3626], { size: 18 }),
  gap(),
  P([B('When everything is ticked: '), 'File > Load Sample Data to reset before your demo.']),
];

const stage7 = [
  H1('Stage 7 - Data file and resetting'),
  table(['Want to...', 'Do this'], [
    ['Start again with sample data', 'File > Load Sample Data (asks for confirmation), or close the app and delete the data folder.'],
    ['Start with an empty restaurant', 'File > Clear All Data.'],
    ['Save immediately', `File > Save Now (Cmd+S / Ctrl+S). Normally the app saves ${F.autosaveS} s after every change and again on exit.`],
    ['Undo changes since the last save', 'File > Reload Saved Data.'],
    ['Find the data file', 'data/restaurant.dat inside the folder you ran the app from.'],
  ], [3000, 6026]),
];

const trouble = [
  H1('Troubleshooting'),
  table(['Problem / message', 'Likely cause', 'Fix'], [
    ['"Unable to locate a Java Runtime that supports javac" (macOS)', 'Only the old Java 8 runtime is on the PATH; no compiler.', 'export JAVA_HOME=/opt/homebrew/opt/openjdk@21 and run ./run.sh again (Stage 1).'],
    ['"javac: command not found" / "\'javac\' is not recognized"', 'JDK not installed, or not on PATH.', 'Install a JDK (Stage 1); on Windows reopen Command Prompt after installing.'],
    ['UnsupportedClassVersionError', 'Compiled with a newer JDK but run with an older java (e.g. javac 21 + java 8).', 'Use java from the same JDK: "$JAVA_HOME/bin/java" -cp out com.restaurant.Main, or just use run.sh with JAVA_HOME set.'],
    ['"permission denied: ./run.sh"', 'Script is not executable.', 'chmod +x run.sh'],
    ['"This application needs a graphical display"', 'Running without a screen (SSH, server, headless container).', 'Run it on a normal desktop session.'],
    ['Error: Could not find or load main class com.restaurant.Main', 'Wrong folder, or out/ not compiled.', 'cd into the project folder and compile first (Stage 4).'],
    ['[WARN] Could not save data / "NOT SAVED" in the header', 'Folder is read-only (e.g. inside a zip or a protected directory).', 'Extract/copy the project to Documents and run from there.'],
    ['"Could not read saved data..." on start', 'data/restaurant.dat is damaged or from an incompatible version.', 'Nothing to do: the app kept the old file as restaurant.dat.corrupt-... and started with sample data.'],
    ['Booking refused although tables look free', 'Outside service hours, not a 15-minute slot, or the table is needed by another booking within 90 min.', 'Read the error text - it states the rule. Pick another time or table.'],
    ['Walk-in not seated although a table is green', `A reservation needs that table within ${F.dining} min, or an earlier waiting party fits it.`, 'Expected behaviour (bookings come first, waitlist is fair).'],
    ['run.bat fails on Windows', 'Not yet tried on a Windows PC.', 'Use the commands in Stage 4 with backslashes, and send me the exact error text.'],
  ], [2900, 2900, 3226], { size: 18 }),
];

module.exports = async function build(outFile) {
  const doc = L.makeDocument({
    title: 'Setup & Run Guide',
    footerText: 'Setup & Run Guide',
    sections: [{ children: [...title, ...stage0, ...stage1, ...stage2, ...stage3, ...stage4, ...stage5, ...stage6, ...stage7, ...trouble] }],
  });
  return L.save(doc, outFile);
};
