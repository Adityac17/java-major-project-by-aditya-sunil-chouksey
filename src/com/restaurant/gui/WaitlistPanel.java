package com.restaurant.gui;

import com.restaurant.exception.RestaurantException;
import com.restaurant.model.Reservation;
import com.restaurant.model.Section;
import com.restaurant.model.WaitlistEntry;
import com.restaurant.service.RestaurantManager;
import com.restaurant.service.WalkInResult;
import com.restaurant.util.TimeUtil;
import com.restaurant.util.Validator;

import javax.swing.BorderFactory;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.time.LocalDateTime;
import java.util.List;

/** Module 3 (waitlist) - walk-ins arrive here and are seated in LinkedList order. */
class WaitlistPanel extends JPanel {
    private static final String ANY_SECTION = "Any (first free table)";

    private final RestaurantManager manager;
    private final JTextField nameField = new JTextField(16);
    private final JTextField phoneField = new JTextField(16);
    private final JSpinner partySpinner = new JSpinner(
            new SpinnerNumberModel(2, Validator.MIN_PARTY_SIZE, GuiUtil.SPINNER_MAX, 1));
    private final JComboBox<Object> sectionCombo = new JComboBox<>();
    private final JLabel summary = new JLabel();

    private final DefaultTableModel model = GuiUtil.readOnlyModel(
            "#", "ID", "Customer", "Phone", "Party", "Wants", "Joined", "Waiting", "Status");
    private final JTable table = GuiUtil.table(model);

    WaitlistPanel(RestaurantManager manager) {
        super(new BorderLayout(10, 10));
        this.manager = manager;
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        sectionCombo.addItem(ANY_SECTION);
        for (Section s : Section.values()) sectionCombo.addItem(s);

        JPanel form = new JPanel(new GridBagLayout());
        form.setBorder(BorderFactory.createTitledBorder("Walk-in party"));
        GuiUtil.addFormRow(form, 0, "Customer name", nameField);
        GuiUtil.addFormRow(form, 1, "Phone", phoneField);
        GuiUtil.addFormRow(form, 2, "Party size", partySpinner);
        GuiUtil.addFormRow(form, 3, "Section", sectionCombo);
        JPanel formButtons = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 0));
        formButtons.add(GuiUtil.button("Walk-in Arrived", e -> walkInArrived()));
        formButtons.add(GuiUtil.button("Add to Waitlist Only", e -> addToWaitlist()));
        GridBagConstraints gc = new GridBagConstraints();
        gc.gridy = 4;
        gc.gridwidth = 2;
        gc.anchor = GridBagConstraints.WEST;
        gc.insets = new Insets(10, 0, 0, 0);
        form.add(formButtons, gc);
        JLabel help = new JLabel("<html><small>\"Walk-in Arrived\" seats the party at once if a<br>"
                + "suitable table is free, otherwise queues them.</small></html>");
        gc.gridy = 5;
        form.add(help, gc);
        GridBagConstraints filler = new GridBagConstraints();
        filler.gridy = 6;
        filler.weighty = 1;
        form.add(new JLabel(), filler);

        table.getColumnModel().getColumn(8).setCellRenderer(new StatusCellRenderer());
        GuiUtil.setColumnWidths(table, 30, 50, 120, 100, 45, 80, 55, 65, 190);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        actions.add(GuiUtil.button("Seat Selected Party", e -> seatSelected()));
        actions.add(GuiUtil.button("Remove (party left)", e -> removeSelected()));
        actions.add(GuiUtil.button("Check for Free Tables", e -> manager.runHousekeeping()));

        JPanel list = new JPanel(new BorderLayout(6, 6));
        list.add(summary, BorderLayout.NORTH);
        list.add(new JScrollPane(table), BorderLayout.CENTER);
        list.add(actions, BorderLayout.SOUTH);

        add(form, BorderLayout.WEST);
        add(list, BorderLayout.CENTER);
    }

    void refresh() {
        Object selected = GuiUtil.selectedValue(table, 1);
        LocalDateTime now = manager.now();
        List<WaitlistEntry> entries = manager.getWaitlist();
        model.setRowCount(0);
        int pos = 1;
        long longest = 0;
        for (WaitlistEntry e : entries) {
            long waited = e.minutesWaiting(now);
            longest = Math.max(longest, waited);
            String status = e.getHeldTableNumber() != null
                    ? "Table " + e.getHeldTableNumber() + " ready - page guest" : "Waiting";
            model.addRow(new Object[]{pos++, e.getId(), e.getCustomer().getName(), e.getCustomer().getPhone(),
                    e.getPartySize(), e.getPreferredSection() == null ? "Any" : e.getPreferredSection(),
                    TimeUtil.formatTime(e.getJoinedAt()), waited + " min", status});
        }
        summary.setText(entries.isEmpty() ? "Nobody is waiting."
                : "<html><b>" + entries.size() + " parties waiting</b> &nbsp; longest wait " + longest + " min</html>");
        GuiUtil.selectRowWhere(table, 1, selected);
    }

    private Section chosenSection() {
        Object o = sectionCombo.getSelectedItem();
        return o instanceof Section ? (Section) o : null;
    }

    private void walkInArrived() {
        try {
            WalkInResult result = manager.arriveWalkIn(nameField.getText(), phoneField.getText(),
                    (Integer) partySpinner.getValue(), chosenSection());
            if (result.isSeated()) {
                Reservation r = result.getReservation();
                GuiUtil.info(this, "Table free - seat " + r.getCustomer().getName() + " at "
                        + result.getTable() + ".\nRecorded as " + r.getId() + ".");
            } else {
                WaitlistEntry e = result.getWaitlistEntry();
                GuiUtil.info(this, "No suitable table is free right now.\n" + e.getCustomer().getName()
                        + " added to the waitlist as " + e.getId() + " - position #" + result.getPosition()
                        + ", estimated wait about " + result.getEstimatedWaitMinutes() + " min.");
            }
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void addToWaitlist() {
        try {
            WaitlistEntry e = manager.addToWaitlist(nameField.getText(), phoneField.getText(),
                    (Integer) partySpinner.getValue(), chosenSection());
            GuiUtil.info(this, e.getCustomer().getName() + " added to the waitlist as " + e.getId()
                    + " (#" + manager.getWaitlistPosition(e.getId()) + ").");
            clearForm();
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void clearForm() {
        nameField.setText("");
        phoneField.setText("");
        partySpinner.setValue(2);
        sectionCombo.setSelectedIndex(0);
    }

    private String selectedId() {
        Object id = GuiUtil.selectedValue(table, 1);
        if (id == null) GuiUtil.error(this, "Select a party on the waitlist first.");
        return (String) id;
    }

    private void seatSelected() {
        String id = selectedId();
        if (id == null) return;
        try {
            Reservation r = manager.seatFromWaitlist(id);
            GuiUtil.info(this, "Seat " + r.getCustomer().getName() + " at table " + r.getTableNumber() + ".");
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void removeSelected() {
        String id = selectedId();
        if (id == null || !GuiUtil.confirm(this, "Remove " + id + " from the waitlist?")) return;
        try {
            manager.removeFromWaitlist(id);
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }
}
