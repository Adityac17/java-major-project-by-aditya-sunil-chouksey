# Setup & Execution Guide

**Project:** Restaurant Table Reservation & Waitlist System  
**Case Study:** 70 (B.Tech CSE 2025-29, Semester III)  
**Author:** Aditya Sunil Chouksey (Roll: `150096725070`)  

---

## 1. System Requirements

- **Operating System:** macOS (Apple Silicon or Intel), Windows 10/11, or Linux (Ubuntu, Debian, Fedora, Arch, etc.)
- **Java Development Kit (JDK):** Version 8 or newer (JDK 11, 17, 21 LTS fully supported)
- **External Dependencies:** **None** (Zero third-party JARs; built entirely on standard `java.*` and `javax.swing.*` libraries)
- **Display:** Graphical desktop environment supporting X11, Wayland, macOS Quartz, or Windows Desktop (headless servers not supported for GUI)

### Check Your Java Version
Open your terminal or command prompt and run:
```bash
javac -version
java -version
```
Ensure both commands return version `1.8.0` or higher.

---

## 2. Quick Start via Command Line

The repository includes pre-configured automation scripts for both Unix-like systems and Windows.

### macOS & Linux
1. Open Terminal and navigate to the project directory:
   ```bash
   cd "/path/to/java-major-project-by-aditya-sunil-chouksey"
   ```
2. Make `run.sh` executable (if needed):
   ```bash
   chmod +x run.sh
   ```
3. Execute the script:
   ```bash
   ./run.sh
   ```

*Tip for custom JDK installations:* If `javac` is not on your system `PATH`, specify `JAVA_HOME`:
```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home ./run.sh
```

### Windows
1. Open Command Prompt (`cmd.exe`) or PowerShell.
2. Navigate to the project folder:
   ```cmd
   cd "C:\path\to\java-major-project-by-aditya-sunil-chouksey"
   ```
3. Execute the batch script:
   ```cmd
   run.bat
   ```

---

## 3. IDE Setup Instructions

### IntelliJ IDEA
1. Launch IntelliJ IDEA and select **Open**.
2. Select the repository root folder (`java-major-project-by-aditya-sunil-chouksey`).
3. Right-click the `src` folder in the Project Explorer -> **Mark Directory as** -> **Sources Root**.
4. Navigate to `src/com/restaurant/Main.java`.
5. Click the green **Run** arrow next to `public static void main(String[] args)` or press `Shift + F10`.

### Visual Studio Code
1. Install the official **Extension Pack for Java** by Microsoft.
2. Open the project root folder in VS Code (`File` -> `Open Folder...`).
3. Open `src/com/restaurant/Main.java`.
4. Click **Run Java** or press `F5` to start debugging.

### Eclipse IDE
1. Open Eclipse and choose **File** -> **New** -> **Java Project**.
2. Uncheck "Use default location" and browse to the repository folder, or import via **File** -> **Import** -> **General** -> **Existing Projects into Workspace**.
3. In **Project Properties** -> **Java Build Path**, verify that `src` is marked as the Source folder.
4. Right-click `com.restaurant.Main` -> **Run As** -> **Java Application**.

---

## 4. End-to-End Verification Checklist

Once the application window titled **"Restaurant Table Reservation & Waitlist System"** launches:

- [ ] **First Launch Verification:** The system automatically seeds sample data (12 tables, confirmed reservations, seated walk-ins, and 2 waitlisted parties).
- [ ] **Floor & Tables Tab:** View the grid of tables with color-coded statuses (Green = Available, Yellow = Reserved, Red = Occupied). Table 5 is marked Reserved for waitlist guest W002.
- [ ] **Reservations Tab:** Check that confirmed reservations are listed. Try the Search bar by typing "Sharma" or table number "4".
- [ ] **Walk-ins & Waitlist Tab:** Verify that two parties appear in the waitlist queue with positions #1 and #2.
- [ ] **Seating Reports Tab:** Click **Refresh** to view computed metrics: Total Capacity, Current Seated Covers, Seat Utilization %, and Peak Hours. Click **Save to File** to verify report output.
- [ ] **Persistence Verification:** Make an edit or seat a table, close the window, and restart. Verify that the changes persist automatically in `data/restaurant.dat`.

---

## 5. Troubleshooting Common Issues

| Issue | Cause | Solution |
|---|---|---|
| `javac: command not found` | JDK is not installed or `PATH` environment variable is not configured | Install JDK 17+ (e.g. via Homebrew on Mac: `brew install openjdk`, or from Adoptium). Export `JAVA_HOME` pointing to your JDK home. |
| `HeadlessException` | Running in a headless environment without GUI support (e.g., remote SSH without X11 forwarding) | Run the app on a machine with an active graphical desktop display. |
| `Permission denied: ./run.sh` | Missing execute permissions on the script | Run `chmod +x run.sh` in Terminal. |
| `Corrupted data file error` | Application was terminated during unsafe external file editing | The system automatically renames corrupted files to `restaurant.dat.corrupt-<timestamp>` and restores fresh sample data. You can safely delete the corrupt file in `data/`. |
