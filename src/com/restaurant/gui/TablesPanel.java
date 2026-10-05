package com.restaurant.gui;

import com.restaurant.exception.RestaurantException;
import com.restaurant.model.Reservation;
import com.restaurant.model.Section;
import com.restaurant.model.Table;
import com.restaurant.model.TableStatus;
import com.restaurant.service.RestaurantManager;
import com.restaurant.util.TimeUtil;
import com.restaurant.util.Validator;

import javax.swing.BorderFactory;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.SpinnerNumberModel;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;

/** Module 1 (table setup) and module 4 (seating): the live floor plan. */
class TablesPanel extends JPanel {
    private final RestaurantManager manager;
    private final DefaultTableModel model =
            GuiUtil.readOnlyModel("Table", "Seats", "Section", "Status", "Held for / Seated", "Next booking");
    private final JTable table = GuiUtil.table(model);
    private final JLabel summary = new JLabel();

    TablesPanel(RestaurantManager manager) {
        super(new BorderLayout(8, 8));
        this.manager = manager;
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        table.getColumnModel().getColumn(3).setCellRenderer(new StatusCellRenderer());
        GuiUtil.setColumnWidths(table, 50, 50, 110, 100, 260, 220);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        buttons.add(GuiUtil.button("Add Table", e -> showTableDialog(null)));
        buttons.add(GuiUtil.button("Edit Table", e -> editSelected()));
        buttons.add(GuiUtil.button("Remove Table", e -> removeSelected()));
        buttons.add(new JLabel("   "));
        buttons.add(GuiUtil.button("Seat Held Party", e -> seatHeldParty()));
        buttons.add(GuiUtil.button("Release Table (guests left)", e -> releaseSelected()));

        add(summary, BorderLayout.NORTH);
        add(new JScrollPane(table), BorderLayout.CENTER);
        add(buttons, BorderLayout.SOUTH);
    }

    void refresh() {
        Object selected = GuiUtil.selectedValue(table, 0);
        model.setRowCount(0);
        int available = 0, reserved = 0, occupied = 0, seats = 0;
        for (Table t : manager.getTables()) {
            Reservation next = manager.nextReservationForTable(t.getNumber());
            String nextText = next == null ? "" : TimeUtil.formatDayTime(next.getDateTime()) + "  " + next.getId()
                    + " (" + next.getPartySize() + ")";
            model.addRow(new Object[]{t.getNumber(), t.getCapacity(), t.getSection(), t.getStatus(),
                    manager.describeTableAssignment(t), nextText});
            seats += t.getCapacity();
            if (t.getStatus() == TableStatus.AVAILABLE) available++;
            else if (t.getStatus() == TableStatus.RESERVED) reserved++;
            else occupied++;
        }
        summary.setText(String.format("<html><b>%d tables</b> &nbsp; Available: %d &nbsp; Reserved: %d &nbsp; "
                        + "Occupied: %d &nbsp; | &nbsp; %d of %d seats in use</html>",
                model.getRowCount(), available, reserved, occupied, manager.countSeatedGuests(), seats));
        GuiUtil.selectRowWhere(table, 0, selected);
    }

    private Integer selectedNumber() {
        Object v = GuiUtil.selectedValue(table, 0);
        if (v == null) {
            GuiUtil.error(this, "Select a table first.");
            return null;
        }
        return (Integer) v;
    }

    private void showTableDialog(Table existing) {
        int suggested = 1;
        for (Table t : manager.getTables()) suggested = Math.max(suggested, t.getNumber() + 1);
        JSpinner number = new JSpinner(new SpinnerNumberModel(
                existing != null ? existing.getNumber() : Math.min(suggested, Validator.MAX_TABLE_NUMBER),
                1, Validator.MAX_TABLE_NUMBER, 1));
        number.setEnabled(existing == null);
        JSpinner capacity = new JSpinner(new SpinnerNumberModel(existing != null ? existing.getCapacity() : 4,
                Validator.MIN_TABLE_CAPACITY, GuiUtil.SPINNER_MAX, 1));
        JComboBox<Section> section = new JComboBox<>(Section.values());
        if (existing != null) section.setSelectedItem(existing.getSection());

        JPanel form = new JPanel(new GridBagLayout());
        GuiUtil.addFormRow(form, 0, "Table number", number);
        GuiUtil.addFormRow(form, 1, "Seats", capacity);
        GuiUtil.addFormRow(form, 2, "Section", section);
        String title = existing == null ? "Add Table" : "Edit Table " + existing.getNumber();
        if (JOptionPane.showConfirmDialog(this, form, title, JOptionPane.OK_CANCEL_OPTION,
                JOptionPane.PLAIN_MESSAGE) != JOptionPane.OK_OPTION) {
            return;
        }
        try {
            if (existing == null) {
                manager.addTable((Integer) number.getValue(), (Integer) capacity.getValue(), (Section) section.getSelectedItem());
            } else {
                manager.updateTable(existing.getNumber(), (Integer) capacity.getValue(), (Section) section.getSelectedItem());
            }
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void editSelected() {
        Integer n = selectedNumber();
        if (n == null) return;
        try {
            showTableDialog(manager.getTable(n));
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void removeSelected() {
        Integer n = selectedNumber();
        if (n == null || !GuiUtil.confirm(this, "Remove table " + n + " from the floor plan?")) return;
        try {
            manager.removeTable(n);
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void seatHeldParty() {
        Integer n = selectedNumber();
        if (n == null) return;
        try {
            Table t = manager.getTable(n);
            if (t.getStatus() != TableStatus.RESERVED || t.getHeldFor() == null) {
                GuiUtil.error(this, "Table " + n + " is not being held for anyone.");
                return;
            }
            String id = t.getHeldFor();
            if (id.startsWith("R")) {
                manager.checkIn(id);           // held for a booked reservation
            } else {
                manager.seatFromWaitlist(id);  // held for a waitlisted walk-in
            }
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }

    private void releaseSelected() {
        Integer n = selectedNumber();
        if (n == null) return;
        try {
            manager.releaseTable(n);
        } catch (RestaurantException ex) {
            GuiUtil.error(this, ex.getMessage());
        }
    }
}
