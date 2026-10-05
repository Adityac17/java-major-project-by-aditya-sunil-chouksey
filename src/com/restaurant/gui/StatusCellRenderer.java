package com.restaurant.gui;

import com.restaurant.model.ReservationStatus;
import com.restaurant.model.TableStatus;

import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;
import java.awt.Color;
import java.awt.Component;

/** Colour-codes status cells so the host can read the floor at a glance. */
class StatusCellRenderer extends DefaultTableCellRenderer {
    @Override
    public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                   boolean hasFocus, int row, int column) {
        Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
        if (!isSelected) {
            c.setBackground(colorFor(value));
            c.setForeground(Color.BLACK);
        }
        return c;
    }

    private static Color colorFor(Object value) {
        if (value instanceof TableStatus) {
            switch ((TableStatus) value) {
                case AVAILABLE: return GuiUtil.AVAILABLE;
                case RESERVED: return GuiUtil.RESERVED;
                default: return GuiUtil.OCCUPIED;
            }
        }
        if (value instanceof ReservationStatus) {
            switch ((ReservationStatus) value) {
                case CONFIRMED: return GuiUtil.CONFIRMED;
                case SEATED: return GuiUtil.OCCUPIED;
                default: return GuiUtil.CLOSED;
            }
        }
        if (value instanceof String && ((String) value).startsWith("Table")) {
            return GuiUtil.AVAILABLE;   // waitlist "Table N ready"
        }
        return Color.WHITE;
    }
}
