"""Generates the architecture and flowchart SVGs used in the report.

Run:  python3 diagrams.py <output-dir>      then render each SVG to PNG with render.sh
"""
import html
import math
import sys

FONT = "Inter, Helvetica, Arial, sans-serif"
INK = "#1f2933"
LINE = "#3e4c59"

COLORS = {
    "gui": ("#e8f0fe", "#4a6fa5"),
    "service": ("#e6f4ea", "#3d8b55"),
    "thread": ("#fff4d6", "#b7891c"),
    "model": ("#fdf0e6", "#c0703a"),
    "util": ("#f1f1f1", "#7b8794"),
    "persist": ("#f1eafb", "#7a55b5"),
    "user": ("#ffffff", "#3e4c59"),
    "process": ("#ffffff", "#3e4c59"),
    "decision": ("#fff8e1", "#b7891c"),
    "terminal": ("#e6f4ea", "#3d8b55"),
    "error": ("#fdecea", "#c0392b"),
    "alert": ("#fff1c2", "#b7891c"),
}


def esc(s):
    return html.escape(s, quote=False)


class Canvas:
    def __init__(self, w, h, title):
        self.w, self.h = w, h
        self.parts = []
        self.title = title

    def text(self, x, y, s, size=13, weight="normal", anchor="middle", color=INK, italic=False):
        style = ' font-style="italic"' if italic else ""
        self.parts.append('<text x="%.1f" y="%.1f" font-size="%d" font-weight="%s" text-anchor="%s" fill="%s"%s>%s</text>'
                          % (x, y, size, weight, anchor, color, style, esc(s)))

    def lines(self, cx, cy, text, size=13, weight="normal", color=INK, gap=None):
        rows = text.split("\n")
        gap = gap or size + 4
        top = cy - (len(rows) - 1) * gap / 2 + size * 0.35
        for i, r in enumerate(rows):
            w = "bold" if r.startswith("**") else weight
            self.text(cx, top + i * gap, r.strip("*"), size, w, color=color)

    def box(self, x, y, w, h, text, kind="process", size=13, radius=6, title=None, dashed=False, gap=None):
        fill, stroke = COLORS[kind]
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        if kind == "decision":
            cx, cy = x + w / 2, y + h / 2
            pts = "%.1f,%.1f %.1f,%.1f %.1f,%.1f %.1f,%.1f" % (cx, y, x + w, cy, cx, y + h, x, cy)
            self.parts.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' % (pts, fill, stroke))
        else:
            r = h / 2 if kind == "terminal" else radius
            self.parts.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="%s" stroke="%s" stroke-width="1.6"%s/>'
                              % (x, y, w, h, r, fill, stroke, dash))
        if title:
            self.text(x + 12, y + 20, title, 13, "bold", "start", stroke)
            self.lines(x + w / 2, y + h / 2 + 10, text, size, gap=gap)
        else:
            self.lines(x + w / 2, y + h / 2, text, size, gap=gap)
        return (x, y, w, h)

    def group(self, x, y, w, h, label, kind):
        fill, stroke = COLORS[kind]
        self.parts.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="10" fill="%s" fill-opacity="0.55" stroke="%s" stroke-width="1.4" stroke-dasharray="7 4"/>'
                          % (x, y, w, h, fill, stroke))
        self.text(x + 14, y + 22, label, 14, "bold", "start", stroke)

    def arrow(self, pts, label=None, dashed=False, label_pos=0.5, label_dx=0, label_dy=-6, color=LINE, both=False):
        dash = ' stroke-dasharray="7 5"' if dashed else ""
        self.parts.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="1.6"%s/>'
                          % (" ".join("%.1f,%.1f" % p for p in pts), color, dash))
        self._head(pts[-2], pts[-1], color)
        if both:
            self._head(pts[1], pts[0], color)
        if label:
            # put the label on the longest segment
            i = max(range(len(pts) - 1), key=lambda k: math.dist(pts[k], pts[k + 1]))
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            mx, my = x1 + (x2 - x1) * label_pos + label_dx, y1 + (y2 - y1) * label_pos + label_dy
            tw = len(label) * 6.6 + 10
            self.parts.append('<rect x="%.1f" y="%.1f" width="%.1f" height="17" rx="3" fill="#ffffff" opacity="0.92"/>' % (mx - tw / 2, my - 12.5, tw))
            self.text(mx, my, label, 12, "normal", "middle", "#3e4c59", italic=True)

    def _head(self, a, b, color):
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        L, W = 11, 5.5
        p1 = (b[0] - L * math.cos(ang) + W * math.sin(ang), b[1] - L * math.sin(ang) - W * math.cos(ang))
        p2 = (b[0] - L * math.cos(ang) - W * math.sin(ang), b[1] - L * math.sin(ang) + W * math.cos(ang))
        self.parts.append('<polygon points="%.1f,%.1f %.1f,%.1f %.1f,%.1f" fill="%s"/>' % (b[0], b[1], p1[0], p1[1], p2[0], p2[1], color))

    def save(self, path):
        head = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" font-family="%s">'
                % (self.w, self.h, self.w, self.h, FONT),
                '<rect width="100%" height="100%" fill="#ffffff"/>']
        self.text(30, 38, self.title, 20, "bold", "start")
        body = self.parts[-1:]  # title was appended last; draw it first
        svg = head + body + self.parts[:-1] + ["</svg>"]
        open(path, "w").write("\n".join(svg))


# ---------------------------------------------------------------------------------------------- architecture
def architecture(out):
    c = Canvas(1240, 900, "System Architecture - layers, threads and data flow")
    # host
    c.box(520, 62, 200, 46, "**Host (front-desk staff)", "user")
    # GUI layer (MainFrame sits on the right, above the listener that feeds it)
    c.group(40, 130, 1160, 150, "Presentation layer - com.restaurant.gui (Swing, Event Dispatch Thread)", "gui")
    gx = [70, 290, 510, 730, 950]
    names = ["**ReportsPanel\nseating report", "**TablesPanel\nfloor plan,\ntable setup",
             "**ReservationsPanel\nbooking form,\nsearch & sort", "**WaitlistPanel\nwalk-ins,\nLinkedList queue",
             "**MainFrame\nmenu, header, alerts,\nnotification log, autosave"]
    for x, n in zip(gx, names):
        c.box(x, 172, 200, 90, n, "process", 12)
    # service layer
    c.group(40, 320, 1160, 300, "Service layer - com.restaurant.service", "service")
    c.box(330, 362, 580, 230,
          "**RestaurantManager  (all public methods synchronized)\n"
          "ArrayList<Table>    ArrayList<Reservation>\n"
          "HashMap<String, Reservation>  - lookup by ID\n"
          "TreeMap<LocalDateTime, List<Reservation>>  - time order\n"
          "Waitlist (LinkedList<WaitlistEntry>)  - FIFO queue\n"
          "CRUD - best-fit assignment - conflict check\n"
          "search & sort - holds - availability notification", "process", 13, gap=22)
    c.box(60, 362, 230, 105, "**ReservationMonitor\nRunnable - daemon thread\nevery 15 s calls\nrunHousekeeping()", "thread", 12)
    c.box(60, 482, 230, 110, "**WaitlistNotifier\nRunnable - new thread per\nreleased table, sleeps 2 s,\nthen calls\nprocessAvailability()", "thread", 12)
    c.box(950, 372, 180, 80, "**ReportGenerator\nseating report text", "process", 12)
    c.box(950, 482, 180, 110, "**RestaurantListener\n(interface, Observer)\nonNotification()\nonDataChanged()", "process", 12)
    # bottom layers
    c.group(40, 660, 560, 210, "Model layer - com.restaurant.model", "model")
    c.box(65, 702, 160, 70, "**Table\nnumber, seats,\nsection, status", "process", 12)
    c.box(240, 702, 165, 70, "**Reservation\nid, party, time,\ntable, status", "process", 12)
    c.box(420, 702, 160, 70, "**Customer\nname, phone", "process", 12)
    c.box(65, 786, 250, 66, "**Waitlist / WaitlistEntry\nLinkedList queue of walk-ins", "process", 12)
    c.box(330, 786, 250, 66, "**Enums\nTableStatus - ReservationStatus - Section", "process", 12)
    c.group(630, 660, 260, 210, "util + exception", "util")
    c.box(650, 700, 220, 66, "**Validator - TimeUtil\nall input rules, date parsing", "process", 12)
    c.box(650, 780, 220, 72, "**RestaurantException\n+ 4 checked subclasses", "process", 12)
    c.group(920, 660, 280, 210, "com.restaurant.persistence", "persist")
    c.box(940, 700, 230, 66, "**DataStore\nsave (atomic) / load / quarantine", "process", 12)
    c.box(940, 790, 230, 62, "**data/restaurant.dat\nserialized RestaurantSnapshot", "persist", 12, dashed=True)

    # arrows
    c.arrow([(620, 108), (620, 172)], "clicks, typing")
    c.arrow([(620, 262), (620, 362)], "method calls (book, seat, release ...)", label_pos=0.62, label_dy=4)
    c.arrow([(1130, 537), (1150, 537), (1150, 262)], "invokeLater() on the EDT", dashed=True, label_pos=0.86, label_dx=-80, label_dy=4)
    c.arrow([(910, 537), (950, 537)])
    c.arrow([(910, 412), (950, 412)])
    c.arrow([(290, 414), (330, 414)])
    c.arrow([(290, 537), (330, 537)])
    c.arrow([(500, 592), (500, 660)], "owns", label_dy=4)
    c.arrow([(760, 592), (760, 660)], "validates / throws", label_dy=4)
    c.arrow([(1150, 230), (1185, 230), (1185, 733), (1170, 733)], "autosave 1.5 s after a change; load on start",
            dashed=True, label_pos=0.86, label_dx=-140, label_dy=-14)
    c.arrow([(1055, 766), (1055, 790)])
    c.save(out)


# ---------------------------------------------------------------------------------------------- flowchart helpers
def chain(c, x, top, w, h, gap, items):
    """Draws a vertical chain; returns list of (x,y,w,h) per node."""
    boxes = []
    y = top
    for text, kind, hh in items:
        hh = hh or h
        boxes.append(c.box(x, y, w, hh, text, kind, 13))
        y += hh + gap
    for a, b in zip(boxes, boxes[1:]):
        c.arrow([(a[0] + a[2] / 2, a[1] + a[3]), (b[0] + b[2] / 2, b[1])])
    return boxes


def booking_flow(out):
    c = Canvas(1100, 1080, "Flowchart 1 - Booking a reservation (Module 2 + Module 4)")
    X, W = 300, 300
    n = {}
    n["start"] = c.box(X + 40, 70, W - 80, 46, "Host fills the form and clicks Book", "terminal", 13)
    n["v"] = c.box(X, 150, W, 110, "Valid name, phone,\nparty size 1-20, time in\nservice hours on a 15-min slot?", "decision", 12)
    n["dup"] = c.box(X, 300, W, 100, "Guest already booked\nwithin 90 min?", "decision", 12)
    n["req"] = c.box(X, 440, W, 100, "Host picked a\nspecific table?", "decision", 12)
    n["best"] = c.box(X, 580, W, 84, "Best fit: smallest table that fits,\npreferred section first, free for\nthe whole 90-min window", "process", 12)
    n["found"] = c.box(X, 700, W, 100, "Table found?", "decision", 13)
    n["idx"] = c.box(X, 840, W, 76, "Save: ArrayList + HashMap (by ID)\n+ TreeMap (by time)", "process", 12)
    n["due"] = c.box(X, 950, W, 84, "Starts within 30 min? -> hold table\n(RESERVED) and alert host", "process", 12)
    # error / side boxes
    e1 = c.box(700, 175, 330, 60, "Show validation error\n(InvalidReservationException)", "error", 12)
    e2 = c.box(700, 320, 330, 60, "Show 'already has reservation...'", "error", 12)
    s1 = c.box(700, 452, 330, 76, "Table fits the party and has no\noverlapping booking? else show\nTableNotAvailableException", "process", 12)
    e3 = c.box(700, 720, 330, 60, "Show 'no table free around ...'\n(TableNotAvailableException)", "error", 12)
    cx = X + W / 2
    c.arrow([(cx, 116), (cx, 150)])
    c.arrow([(X + W, 205), (700, 205)], "no")
    c.arrow([(cx, 260), (cx, 300)], "yes", label_dx=18, label_dy=6)
    c.arrow([(X + W, 350), (700, 350)], "yes")
    c.arrow([(cx, 400), (cx, 440)], "no", label_dx=16, label_dy=6)
    c.arrow([(X + W, 490), (700, 490)], "yes")
    c.arrow([(cx, 540), (cx, 580)], "no", label_dx=16, label_dy=6)
    c.arrow([(cx, 664), (cx, 700)])
    c.arrow([(X + W, 750), (700, 750)], "no")
    c.arrow([(cx, 800), (cx, 840)], "yes", label_dx=18, label_dy=6)
    c.arrow([(cx, 916), (cx, 950)])
    c.arrow([(1030, 490), (1065, 490), (1065, 878), (X + W, 878)], "valid table", label_pos=0.5)
    # left note
    c.box(30, 560, 230, 150, "**Why best fit?\nGiving a party of 2 the\nsmallest suitable table keeps\nlarge tables free for large\nparties.", "util", 12)
    c.save(out)


def waitlist_flow(out):
    c = Canvas(1240, 1060, "Flowchart 2 - Walk-in arrival and table-release notification (Modules 3, 4, 5)")
    # left column: walk-in arrives
    c.text(250, 82, "A. Walk-in arrives (GUI thread)", 15, "bold")
    LX, LW = 100, 300
    lcx = LX + LW / 2
    c.box(LX + 30, 100, LW - 60, 46, "Walk-in Arrived clicked", "terminal")
    c.box(LX, 176, LW, 96, "Name, phone and\nparty size valid?", "decision", 12)
    c.box(LX, 300, LW, 70, "Offer any free table to parties\nalready waiting first (fairness)", "process", 12)
    c.box(LX, 400, LW, 116, "Suitable table free now and\nnot needed by a booking in\nthe next 90 min?", "decision", 12)
    c.box(LX, 556, LW, 60, "Seat party: table OCCUPIED", "terminal")
    c.box(LX, 650, LW, 76, "Add to the END of the LinkedList\nshow position #n and ~15 min\nper party ahead", "process", 12)
    c.arrow([(lcx, 146), (lcx, 176)])
    c.arrow([(lcx, 272), (lcx, 300)], "yes", label_dx=18, label_dy=4)
    c.arrow([(lcx, 370), (lcx, 400)])
    c.arrow([(lcx, 516), (lcx, 556)], "yes", label_dx=18, label_dy=6)
    c.arrow([(LX, 458), (60, 458), (60, 688), (LX, 688)], "no", label_dx=-14, label_dy=0)
    c.box(LX + 40, 760, LW - 80, 50, "error dialog", "error", 12)
    c.arrow([(LX + LW, 224), (430, 224), (430, 785), (LX + LW - 40, 785)], "no", label_pos=0.08, label_dx=0)

    # right column: table released
    c.text(870, 82, "B. Guests leave - table released", 15, "bold")
    RX, RW = 720, 320
    rcx = RX + RW / 2
    c.box(RX + 20, 100, RW - 40, 46, "Release Table clicked", "terminal")
    c.box(RX, 176, RW, 60, "Visit COMPLETED, table AVAILABLE", "process", 12)
    c.box(RX, 266, RW, 70, "Start WaitlistNotifier thread\n(new Thread(runnable).start())", "thread", 12)
    c.box(RX, 366, RW, 54, "Thread.sleep(2000) - table reset", "thread", 12)
    c.box(RX, 450, RW, 100, "Booking for this table\ndue within 30 min?", "decision", 12)
    c.box(RX, 590, RW, 100, "Booking needs the table\nin the next 90 min?", "decision", 12)
    c.box(RX, 730, RW, 100, "First party in the LinkedList\nthat fits this table?", "decision", 12)
    c.box(RX + 20, 870, RW - 40, 50, "INFO: table ready and available", "process", 12)
    c.box(1080, 470, 140, 60, "Hold for booking\n[READY] alert", "alert", 12)
    c.box(1080, 610, 140, 60, "Keep it free for\nthe booking", "process", 12)
    c.box(1080, 750, 140, 60, "Hold for party\n[READY] page guest", "alert", 12)
    c.arrow([(rcx, 146), (rcx, 176)])
    c.arrow([(rcx, 236), (rcx, 266)])
    c.arrow([(rcx, 336), (rcx, 366)])
    c.arrow([(rcx, 420), (rcx, 450)], "processAvailability()", label_dx=74, label_dy=10)
    c.arrow([(RX + RW, 500), (1080, 500)], "yes")
    c.arrow([(rcx, 550), (rcx, 590)], "no", label_dx=16, label_dy=6)
    c.arrow([(RX + RW, 640), (1080, 640)], "yes")
    c.arrow([(rcx, 690), (rcx, 730)], "no", label_dx=16, label_dy=6)
    c.arrow([(RX + RW, 780), (1080, 780)], "yes")
    c.arrow([(rcx, 830), (rcx, 870)], "no", label_dx=16, label_dy=6)
    # note
    c.box(500, 880, 180, 130, "**Also every 15 s\nReservationMonitor\nholds due tables,\nflags late parties,\nserves the waitlist", "thread", 12)
    c.box(40, 880, 420, 130, "**Fairness rule\nThe queue is walked from the front.\nA party too big for the table (or wanting\nanother section) is skipped, but nobody\nwho fits is ever skipped.", "util", 12)
    c.save(out)


if __name__ == "__main__":
    out = sys.argv[1]
    architecture(out + "/architecture.svg")
    booking_flow(out + "/flowchart-booking.svg")
    waitlist_flow(out + "/flowchart-waitlist-notification.svg")
    print("ok")
