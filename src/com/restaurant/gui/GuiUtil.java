package com.restaurant.gui;

import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.table.DefaultTableModel;
import java.awt.Color;
import java.awt.Component;
import java.awt.GridBagConstraints;
import java.awt.Insets;
import java.awt.event.ActionListener;

/** Small helpers shared by the Swing panels. */
final class GuiUtil {
    static final Color AVAILABLE = new Color(0xD4F2DB);
    static final Color RESERVED = new Color(0xFFE8AD);
    static final Color OCCUPIED = new Color(0xF6C6C6);
    static final Color CONFIRMED = new Color(0xD6E6FA);
    static final Color CLOSED = new Color(0xE4E4E4);
    static final Color ALERT_BANNER = new Color(0xFFF1C2);

    /**
     * Upper bound for party-size and seat spinners. Deliberately wider than the business limits so that
     * Validator - not the spinner silently snapping back - rejects bad input with a clear message.
     */
    static final int SPINNER_MAX = 99;

    private GuiUtil() {
    }

    static DefaultTableModel readOnlyModel(String... columns) {
        return new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
    }

    static JTable table(DefaultTableModel model) {
        JTable table = new JTable(model);
        table.setRowHeight(24);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setFillsViewportHeight(true);
        table.getTableHeader().setReorderingAllowed(false);
        return table;
    }

    /** Preferred column widths; spare space is still shared out when the window grows. */
    static void setColumnWidths(JTable table, int... widths) {
        for (int i = 0; i < widths.length && i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setPreferredWidth(widths[i]);
        }
    }

    static JButton button(String text, ActionListener action) {
        JButton b = new JButton(text);
        b.addActionListener(action);
        return b;
    }

    static void addFormRow(JPanel form, int row, String label, JComponent field) {
        GridBagConstraints gc = new GridBagConstraints();
        gc.gridx = 0;
        gc.gridy = row;
        gc.anchor = GridBagConstraints.WEST;
        gc.insets = new Insets(4, 4, 4, 8);
        form.add(new JLabel(label), gc);
        gc.gridx = 1;
        gc.fill = GridBagConstraints.HORIZONTAL;
        gc.weightx = 1;
        form.add(field, gc);
    }

    /** Value of the given column in the selected row, or null when nothing is selected. */
    static Object selectedValue(JTable table, int column) {
        int row = table.getSelectedRow();
        return row < 0 ? null : table.getModel().getValueAt(table.convertRowIndexToModel(row), column);
    }

    static void selectRowWhere(JTable table, int column, Object value) {
        if (value == null) return;
        for (int i = 0; i < table.getRowCount(); i++) {
            if (value.equals(table.getModel().getValueAt(table.convertRowIndexToModel(i), column))) {
                table.setRowSelectionInterval(i, i);
                table.scrollRectToVisible(table.getCellRect(i, 0, true));
                return;
            }
        }
    }

    static void error(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, message, "Cannot complete action", JOptionPane.ERROR_MESSAGE);
    }

    static void info(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, message, "Done", JOptionPane.INFORMATION_MESSAGE);
    }

    static boolean confirm(Component parent, String message) {
        return JOptionPane.showConfirmDialog(parent, message, "Please confirm",
                JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE) == JOptionPane.YES_OPTION;
    }
}
