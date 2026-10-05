package com.restaurant.gui;

import com.restaurant.exception.RestaurantException;
import com.restaurant.model.Reservation;
import com.restaurant.model.ReservationStatus;
import com.restaurant.model.Section;
import com.restaurant.model.Table;
import com.restaurant.service.RestaurantManager;
import com.restaurant.service.RestaurantManager.SearchField;
import com.restaurant.service.RestaurantManager.SortField;
import com.restaurant.util.TimeUtil;
import com.restaurant.util.Validator;

import javax.swing.BorderFactory;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Insets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Module 2 (booking CRUD) and module 6 (search & sort). */
class ReservationsPanel extends JPanel {
    private static final String ANY_SECTION = "Any section";
    private static final String AUTO_TABLE = "Auto-assign (best fit)";
    private static final String VIEW_ALL = "All";
    private static final String VIEW_TODAY = "Today";
    private static final String VIEW_ACTIVE = "Active (confirmed / seated)";

    private final RestaurantManager manager;

    private final JTextField nameField = new JTextField(16);
    private final JTextField phoneField = new JTextField(16);
    private final JSpinner partySpinner = new JSpinner(
            new SpinnerNumberModel(2, Validator.MIN_PARTY_SIZE, GuiUtil.SPINNER_MAX, 1));
    private final JTextField dateTimeField = new JTextField(16);
    private final JComboBox<Object> sectionCombo = new JComboBox<>();
    private final JComboBox<Object> tableCombo = new JComboBox<>();
    private final JTextField notesField = new JTextField(16);
    private final JLabel formTitle = new JLabel();

    private final JTextField searchField = new JTextField(14);
    private final JComboBox<SearchField> searchCombo = new JComboBox<>(SearchField.values());
    private final JComboBox<SortField> sortCombo = new JComboBox<>(SortField.values());
    private final JCheckBox descending = new JCheckBox("Descending");
    private final JComboBox<String> viewCombo = new JComboBox<>(new String[]{VIEW_ALL, VIEW_TODAY, VIEW_ACTIVE});
    private final JLabel countLabel = new JLabel();

    private final DefaultTableModel model = GuiUtil.readOnlyModel(
            "ID", "Customer", "Phone", "Party", "Date & time", "Table", "Section", "Status", "Type", "Notes");
    private final JTable table = GuiUtil.table(model);

    private String editingId;          // reservation loaded into the form, null for a new booking
    private boolean refreshing;        // suppresses selection events caused by refresh()

    ReservationsPanel(RestaurantManager manager) {
        super(new BorderLayout(10, 10));
        this.manager = manager;
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        sectionCombo.addItem(ANY_SECTION);
        for (Section s : Section.values()) sectionCombo.addItem(s);

        add(buildForm(), BorderLayout.WEST);
        add(buildListArea(), BorderLayout.CENTER);
        clearForm();
    }

    private JPanel buildForm() {
        JPanel form = new JPanel(new GridBagLayout());
        form.setBorder(BorderFactory.createTitledBorder("Reservation details"));
        int row = 0;
        GridBagConstraints title = new GridBagConstraints();
        title.gridx = 0;
        title.gridy = row++;
        title.gridwidth = 2;
        title.anchor = GridBagConstraints.WEST;
        title.insets = new Insets(4, 4, 8, 4);
        form.add(formTitle, title);

        GuiUtil.addFormRow(form, row++, "Customer name", nameField);
        GuiUtil.addFormRow(form, row++, "Phone", phoneField);
        GuiUtil.addFormRow(form, row++, "Party size", partySpinner);
        GuiUtil.addFormRow(form, row++, "Date & time", dateTimeField);
        JLabel hint = new JLabel("<html><small>" + TimeUtil.INPUT_PATTERN + ", " + Validator.OPENING_TIME + "-"
                + Validator.LAST_SEATING + ", 15-min slots</small></html>");
        GuiUtil.addFormRow(form, row++, "", hint);
        GuiUtil.addFormRow(form, row++, "Section", sectionCombo);
        GuiUtil.addFormRow(form, row++, "Table", tableCombo);
        GuiUtil.addFormRow(form, row++, "Notes", notesField);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 0));
        buttons.add(GuiUtil.button("Book", e -> book()));
        buttons.add(GuiUtil.button("Save Changes", e -> saveChanges()));
        buttons.add(GuiUtil.button("Clear", e -> clearForm()));
        GridBagConstraints gc = new GridBagConstraints();
        gc.gridx = 0;
        gc.gridy = row++;
        gc.gridwidth = 2;
        gc.anchor = GridBagConstraints.WEST;
        gc.insets = new Insets(10, 0, 0, 0);
        form.add(buttons, gc);

        // push everything to the top
        GridBagConstraints filler = new GridBagConstraints();
        filler.gridy = row;
        filler.weighty = 1;
        form.add(new JLabel(), filler);
        return form;
    }

    private JPanel buildListArea() {
        JPanel searchRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        searchRow.add(new JLabel("Search"));
        searchRow.add(searchField);
        searchRow.add(new JLabel("in"));
        searchRow.add(searchCombo);
        JPanel sortRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        sortRow.add(new JLabel("Sort by"));
        sortRow.add(sortCombo);
        sortRow.add(descending);
        sortRow.add(new JLabel("   Show"));
        sortRow.add(viewCombo);
        sortRow.add(new JLabel("   "));
        sortRow.add(countLabel);
        JPanel toolbar = new JPanel(new GridLayout(2, 1, 0, 4));
        toolbar.add(searchRow);
        toolbar.add(sortRow);

        searchField.getDocument().addDocumentListener(new DocumentListener() {
            public void insertUpdate(DocumentEvent e) { refresh(); }
            public void removeUpdate(DocumentEvent e) { refresh(); }
            public void changedUpdate(DocumentEvent e) { refresh(); }
        });
        searchCombo.addActionListener(e -> refresh());
        sortCombo.addActionListener(e -> refresh());
        descending.addActionListener(e -> refresh());
        viewCombo.addActionListener(e -> refresh());

        table.getColumnModel().getColumn(7).setCellRenderer(new StatusCellRenderer());
        GuiUtil.setColumnWidths(table, 60, 115, 95, 42, 175, 42, 90, 80, 60, 130);
        table.getSelectionModel().addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting() && !refreshing) loadSelectedIntoForm();
        });

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        actions.add(GuiUtil.button("Check In (seat party)", e -> checkIn()));
        actions.add(GuiUtil.button("Cancel Reservation", e -> cancel()));
        actions.add(GuiUtil.button("Mark No-show", e -> noShow()));
        actions.add(GuiUtil.button("Delete Record", e -> delete()));

        JPanel area = new JPanel(new BorderLayout(6, 6));
        area.add(toolbar, BorderLayout.NORTH);
        area.add(new JScrollPane(table), BorderLayout.CENTER);
        area.add(actions, BorderLayout.SOUTH);
        return area;
    }

    // ------------------------------------------------------------------ refresh

    void refresh() {
        refreshing = true;
        try {
            Object selected = GuiUtil.selectedValue(table, 0);
            Map<Integer, Table> tablesByNumber = new HashMap<>();
            for (Table t : manager.getTables()) tablesByNumber.put(t.getNumber(), t);

            List<Reservation> rows = manager.searchReservations(searchField.getText(),
                    (SearchField) searchCombo.getSelectedItem());
            rows = applyView(rows);
            rows = RestaurantManager.sort(rows, (SortField) sortCombo.getSelectedItem(), !descending.isSelected());

            model.setRowCount(0);
            for (Reservation r : rows) {
                Table t = r.getTableNumber() == null ? null : tablesByNumber.get(r.getTableNumber());
                model.addRow(new Object[]{r.getId(), r.getCustomer().getName(), r.getCustomer().getPhone(),
                        r.getPartySize(), TimeUtil.formatDayTime(r.getDateTime()), r.getTableNumber(),
                        t == null ? "" : t.getSection(), r.getStatus(), r.isWalkIn() ? "Walk-in" : "Booking",
                        r.getNotes()});
            }
            countLabel.setText("Showing " + rows.size() + " of " + manager.getReservations().size() + " records");
            refreshTableChoices(tablesByNumber.values());
            GuiUtil.selectRowWhere(table, 0, selected);
        } finally {
            refreshing = false;
        }
    }

    private List<Reservation> applyView(List<Reservation> rows) {
        String view = (String) viewCombo.getSelectedItem();
        if (VIEW_ALL.equals(view)) return rows;
        LocalDate today = manager.now().toLocalDate();
        List<Reservation> out = new ArrayList<>();
        for (Reservation r : rows) {
            if (VIEW_TODAY.equals(view) && r.getDateTime().toLocalDate().equals(today)) out.add(r);
            if (VIEW_ACTIVE.equals(view) && r.getStatus().isActive()) out.add(r);
        }
        return out;
    }

    private void refreshTableChoices(Iterable<Table> tables) {
        Object current = tableCombo.getSelectedItem();
        Integer currentNumber = current instanceof Table ? ((Table) current).getNumber() : null;
        tableCombo.removeAllItems();
        tableCombo.addItem(AUTO_TABLE);
        List<Table> sorted = new ArrayList<>();
        for (Table t : tables) sorted.add(t);
        sorted.sort((a, b) -> Integer.compare(a.getNumber(), b.getNumber()));
        for (Table t : sorted) {
            tableCombo.addItem(t);
            if (currentNumber != null && t.getNumber() == currentNumber) tableCombo.setSelectedItem(t);
        }
    }

    // ------------------------------------------------------------------ form

    private void clearForm() {
        editingId = null;
        formTitle.setText("<html><b>New reservation</b></html>");
        nameField.setText("");
        phoneField.setText("");
        partySpinner.setValue(2);
        dateTimeField.setText(TimeUtil.format(suggestedTime()));
        sectionCombo.setSelectedItem(ANY_SECTION);
        if (tableCombo.getItemCount() > 0) tableCombo.setSelectedIndex(0);
        notesField.setText("");
        refreshing = true;
        table.clearSelection();
        refreshing = false;
    }

    /** Next bookable slot about an hour from now, or dinner tomorrow if the kitchen is closing. */
    private LocalDateTime suggestedTime() {
        LocalDateTime t = TimeUtil.roundUpToSlot(manager.now().plusHours(1));
        LocalTime time = t.toLocalTime();
        if (time.isBefore(Validator.OPENING_TIME)) return t.toLocalDate().atTime(12, 0);
        if (time.isAfter(Validator.LAST_SEATING) || !t.toLocalDate().equals(manager.now().toLocalDate())) {
            return manager.now().toLocalDate().plusDays(1).atTime(19, 0);
        }
        return t;
    }

    private void loadSelectedIntoForm() {
        Object id = GuiUtil.selectedValue(table, 0);
        if (id == null) return;
        try {
            Reservation r = manager.getReservation((String) id);
            editingId = r.getId();
            formTitle.setText("<html><b>Editing " + r.getId() + "</b> (" + r.getStatus() + ")</html>");
            nameField.setText(r.getCustomer().getName());
            phoneField.setText(r.getCustomer().getPhone());
            partySpinner.setValue(r.getPartySize());
            dateTimeField.setText(TimeUtil.format(r.getDateTime()));
            sectionCombo.setSelectedItem(r.getPreferredSection() == null ? ANY_SECTION : r.getPreferredSection());
            tableCombo.setSelectedIndex(0);
            for (int i = 1; i < tableCombo.getItemCount(); i++) {
                Table t = (Table) tableCombo.getItemAt(i);
                if (r.getTableNumber() != null && t.getNumber() == r.getTableNumber()) tableCombo.setSelectedIndex(i);
            }
            notesField.setText(r.getNotes());
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private Section chosenSection() {
        Object o = sectionCombo.getSelectedItem();
        return o instanceof Section ? (Section) o : null;
    }

    private Integer chosenTable() {
        Object o = tableCombo.getSelectedItem();
        return o instanceof Table ? ((Table) o).getNumber() : null;
    }

    private void book() {
        try {
            LocalDateTime when = TimeUtil.parse(dateTimeField.getText());
            Reservation r = manager.createReservation(nameField.getText(), phoneField.getText(),
                    (Integer) partySpinner.getValue(), when, chosenSection(), chosenTable(), notesField.getText());
            GuiUtil.info(this, "Reservation " + r.getId() + " confirmed for " + r.getCustomer().getName() + "\n"
                    + TimeUtil.formatDayTime(r.getDateTime()) + ", party of " + r.getPartySize()
                    + ", table " + r.getTableNumber() + ".");
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void saveChanges() {
        if (editingId == null) {
            GuiUtil.error(this, "Select a reservation in the list to edit it, or use Book for a new one.");
            return;
        }
        try {
            LocalDateTime when = TimeUtil.parse(dateTimeField.getText());
            Reservation r = manager.updateReservation(editingId, nameField.getText(), phoneField.getText(),
                    (Integer) partySpinner.getValue(), when, chosenSection(), chosenTable(), notesField.getText());
            GuiUtil.info(this, "Reservation " + r.getId() + " updated: " + TimeUtil.formatDayTime(r.getDateTime())
                    + ", party of " + r.getPartySize() + ", table " + r.getTableNumber() + ".");
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    // ------------------------------------------------------------------ row actions

    private String selectedId() {
        Object id = GuiUtil.selectedValue(table, 0);
        if (id == null) GuiUtil.error(this, "Select a reservation in the list first.");
        return (String) id;
    }

    private void checkIn() {
        String id = selectedId();
        if (id == null) return;
        try {
            Reservation r = manager.checkIn(id);
            GuiUtil.info(this, r.getCustomer().getName() + " seated at table " + r.getTableNumber() + ".");
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void cancel() {
        String id = selectedId();
        if (id == null || !GuiUtil.confirm(this, "Cancel reservation " + id + "?")) return;
        try {
            manager.cancelReservation(id);
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void noShow() {
        String id = selectedId();
        if (id == null || !GuiUtil.confirm(this, "Mark " + id + " as a no-show and free its table?")) return;
        try {
            manager.markNoShow(id);
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void delete() {
        String id = selectedId();
        if (id == null) return;
        try {
            Reservation r = manager.getReservation(id);
            String warning = r.getStatus() == ReservationStatus.CONFIRMED
                    ? "\nThis is an upcoming booking - consider Cancel instead so it stays in the reports." : "";
            if (!GuiUtil.confirm(this, "Permanently delete " + id + "?" + warning)) return;
            manager.deleteReservation(id);
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }
}
