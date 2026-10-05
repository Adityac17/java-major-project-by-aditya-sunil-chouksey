package com.restaurant.gui;

import com.restaurant.model.Table;
import com.restaurant.model.TableStatus;
import com.restaurant.persistence.DataStore;
import com.restaurant.service.NotificationType;
import com.restaurant.service.RestaurantListener;
import com.restaurant.service.RestaurantManager;
import com.restaurant.service.SampleData;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTabbedPane;
import javax.swing.JTextArea;
import javax.swing.KeyStroke;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Toolkit;
import java.awt.event.ActionListener;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/** Main window: tabs for each module, a live host-notification log, and automatic saving. */
public class MainFrame extends JFrame implements RestaurantListener {
    private static final DateTimeFormatter LOG_TIME = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final int AUTOSAVE_DELAY_MS = 1500;

    private final RestaurantManager manager;
    private final File dataFile;
    private final TablesPanel tablesPanel;
    private final ReservationsPanel reservationsPanel;
    private final WaitlistPanel waitlistPanel;
    private final ReportsPanel reportsPanel;
    private final JTextArea log = new JTextArea(7, 80);
    private final JLabel clock = new JLabel();
    private final JLabel saveStatus = new JLabel(" ");
    private final JLabel headline = new JLabel();
    private final JLabel alertBanner = new JLabel(" ");
    private final Timer autosaveTimer;
    private boolean refreshQueued;
    private boolean lastSaveFailed;

    public MainFrame(RestaurantManager manager, File dataFile, String startupMessage) {
        super("Restaurant Table Reservation & Waitlist System");
        this.manager = manager;
        this.dataFile = dataFile;
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        setMinimumSize(new Dimension(1100, 700));

        tablesPanel = new TablesPanel(manager);
        reservationsPanel = new ReservationsPanel(manager);
        waitlistPanel = new WaitlistPanel(manager);
        reportsPanel = new ReportsPanel(manager);

        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Floor & Tables", tablesPanel);
        tabs.addTab("Reservations", reservationsPanel);
        tabs.addTab("Walk-ins & Waitlist", waitlistPanel);
        tabs.addTab("Seating Reports", reportsPanel);

        log.setEditable(false);
        log.setLineWrap(true);
        log.setWrapStyleWord(true);
        log.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JScrollPane logScroll = new JScrollPane(log);
        logScroll.setBorder(BorderFactory.createTitledBorder("Host notifications"));

        JSplitPane split = new JSplitPane(JSplitPane.VERTICAL_SPLIT, tabs, logScroll);
        split.setResizeWeight(0.78);

        setJMenuBar(buildMenu());
        add(buildHeader(), BorderLayout.NORTH);
        add(split, BorderLayout.CENTER);

        // Every change schedules a save; a burst of changes produces a single write.
        autosaveTimer = new Timer(AUTOSAVE_DELAY_MS, e -> save(false));
        autosaveTimer.setRepeats(false);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                exit();
            }
        });

        manager.addListener(this);
        refreshAll();
        new Timer(1000, e -> clock.setText(LocalTime.now().format(LOG_TIME))).start();
        // keep "minutes waiting" and "next booking" columns current even when nothing else changes
        new Timer(30_000, e -> refreshAll()).start();

        pack();
        setSize(1250, 800);
        setLocationRelativeTo(null);
        appendLog(NotificationType.INFO, "System ready. Notifications about free tables will appear here.");
        if (startupMessage != null) appendLog(NotificationType.INFO, startupMessage);
    }

    private JMenuBar buildMenu() {
        int shortcut = System.getProperty("os.name", "").toLowerCase().contains("mac")
                ? InputEvent.META_DOWN_MASK : InputEvent.CTRL_DOWN_MASK;
        JMenu file = new JMenu("File");
        file.add(menuItem("Save Now", KeyStroke.getKeyStroke(KeyEvent.VK_S, shortcut), e -> save(true)));
        file.add(menuItem("Reload Saved Data", null, e -> reload()));
        file.addSeparator();
        file.add(menuItem("Load Sample Data", null, e -> loadSampleData()));
        file.add(menuItem("Clear All Data", null, e -> clearAll()));
        file.addSeparator();
        file.add(menuItem("Exit", KeyStroke.getKeyStroke(KeyEvent.VK_Q, shortcut), e -> exit()));
        JMenuBar bar = new JMenuBar();
        bar.add(file);
        return bar;
    }

    private static JMenuItem menuItem(String text, KeyStroke key, ActionListener action) {
        JMenuItem item = new JMenuItem(text);
        if (key != null) item.setAccelerator(key);
        item.addActionListener(action);
        return item;
    }

    private JPanel buildHeader() {
        JLabel title = new JLabel("Front of House");
        title.setFont(title.getFont().deriveFont(Font.BOLD, 20f));
        clock.setFont(clock.getFont().deriveFont(Font.BOLD, 16f));
        clock.setHorizontalAlignment(JLabel.RIGHT);
        saveStatus.setHorizontalAlignment(JLabel.RIGHT);
        alertBanner.setOpaque(true);
        alertBanner.setBorder(BorderFactory.createEmptyBorder(4, 8, 4, 8));

        JPanel left = new JPanel(new BorderLayout());
        left.add(title, BorderLayout.NORTH);
        left.add(headline, BorderLayout.SOUTH);

        JPanel right = new JPanel(new BorderLayout());
        right.add(clock, BorderLayout.NORTH);
        right.add(saveStatus, BorderLayout.SOUTH);

        JPanel header = new JPanel(new BorderLayout(10, 6));
        header.setBorder(BorderFactory.createEmptyBorder(10, 12, 4, 12));
        header.add(left, BorderLayout.WEST);
        header.add(right, BorderLayout.EAST);
        header.add(alertBanner, BorderLayout.SOUTH);
        return header;
    }

    // ------------------------------------------------------------------ saving & loading

    private boolean save(boolean userRequested) {
        autosaveTimer.stop();
        try {
            DataStore.save(manager, dataFile);
            saveStatus.setText("Saved " + LocalTime.now().format(LOG_TIME));
            if (userRequested || lastSaveFailed) {
                appendLog(NotificationType.INFO, "Data saved to " + dataFile.getAbsolutePath());
            }
            lastSaveFailed = false;
            return true;
        } catch (IOException ex) {
            saveStatus.setText("NOT SAVED");
            if (!lastSaveFailed || userRequested) {
                appendLog(NotificationType.WARNING, "Could not save data: " + ex.getMessage());
            }
            if (userRequested) GuiUtil.error(this, "Could not save data to " + dataFile + ":\n" + ex.getMessage());
            lastSaveFailed = true;
            return false;
        }
    }

    private void reload() {
        if (!dataFile.exists()) {
            GuiUtil.error(this, "There is no saved data file yet (" + dataFile.getAbsolutePath() + ").");
            return;
        }
        if (!GuiUtil.confirm(this, "Replace what is on screen with the last saved data?")) return;
        autosaveTimer.stop();
        try {
            DataStore.load(manager, dataFile);
        } catch (IOException ex) {
            GuiUtil.error(this, "Could not load " + dataFile + ":\n" + ex.getMessage());
        }
    }

    private void loadSampleData() {
        if (!GuiUtil.confirm(this, "Replace ALL current tables, reservations and the waitlist with sample data?")) return;
        manager.reset();
        SampleData.load(manager);
    }

    private void clearAll() {
        if (!GuiUtil.confirm(this, "Delete ALL tables, reservations and waitlist entries?\n"
                + "The empty state will be saved automatically.")) return;
        manager.reset();
    }

    private void exit() {
        if (!save(false) && !GuiUtil.confirm(this, "Your latest changes could not be saved.\nExit anyway?")) {
            return;
        }
        dispose();
        System.exit(0);
    }

    // ------------------------------------------------------------------ listener callbacks
    // They can arrive on background threads, so always hop onto the Swing event thread.

    @Override
    public void onNotification(NotificationType type, String message) {
        SwingUtilities.invokeLater(() -> appendLog(type, message));
    }

    @Override
    public void onDataChanged() {
        SwingUtilities.invokeLater(() -> {
            autosaveTimer.restart();
            // Coalesce bursts of change events into one refresh.
            if (refreshQueued) return;
            refreshQueued = true;
            SwingUtilities.invokeLater(() -> {
                refreshQueued = false;
                refreshAll();
            });
        });
    }

    private void appendLog(NotificationType type, String message) {
        String prefix = type == NotificationType.ALERT ? "[READY] " : type == NotificationType.WARNING ? "[WARN]  " : "        ";
        log.append(LocalTime.now().format(LOG_TIME) + "  " + prefix + message + "\n");
        log.setCaretPosition(log.getDocument().getLength());
        if (type != NotificationType.INFO) {
            alertBanner.setBackground(GuiUtil.ALERT_BANNER);
            alertBanner.setText((type == NotificationType.ALERT ? "Table ready:  " : "Attention:  ") + message);
            Toolkit.getDefaultToolkit().beep();
        }
    }

    private void refreshAll() {
        tablesPanel.refresh();
        reservationsPanel.refresh();
        waitlistPanel.refresh();
        reportsPanel.refresh();
        int free = 0, total = 0;
        for (Table t : manager.getTables()) {
            total++;
            if (t.getStatus() == TableStatus.AVAILABLE) free++;
        }
        headline.setText(free + " of " + total + " tables free   |   " + manager.getWaitlist().size()
                + " parties on the waitlist   |   " + manager.countSeatedGuests() + " guests dining");
    }
}
