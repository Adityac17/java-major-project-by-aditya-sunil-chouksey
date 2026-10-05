package com.restaurant.gui;

import com.restaurant.service.ReportGenerator;
import com.restaurant.service.RestaurantManager;

import javax.swing.BorderFactory;
import javax.swing.JFileChooser;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.Font;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

/** Module 7 - seating reports. */
class ReportsPanel extends JPanel {
    private final RestaurantManager manager;
    private final JTextArea area = new JTextArea();

    ReportsPanel(RestaurantManager manager) {
        super(new BorderLayout(6, 6));
        this.manager = manager;
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        area.setEditable(false);
        area.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13));

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        buttons.add(GuiUtil.button("Refresh", e -> refresh()));
        buttons.add(GuiUtil.button("Save as Text File...", e -> save()));
        add(buttons, BorderLayout.NORTH);
        add(new JScrollPane(area), BorderLayout.CENTER);
    }

    void refresh() {
        int caret = area.getCaretPosition();
        area.setText(ReportGenerator.generate(manager));
        area.setCaretPosition(Math.min(caret, area.getDocument().getLength()));
    }

    private void save() {
        JFileChooser chooser = new JFileChooser();
        chooser.setSelectedFile(new File("seating-report.txt"));
        if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
        try (PrintWriter out = new PrintWriter(chooser.getSelectedFile(), "UTF-8")) {
            out.print(area.getText());
            GuiUtil.info(this, "Report saved to " + chooser.getSelectedFile().getAbsolutePath());
        } catch (IOException ex) {
            GuiUtil.error(this, "Could not save the report: " + ex.getMessage());
        }
    }
}
