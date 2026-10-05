@echo off
REM Compile and launch the GUI.
cd /d "%~dp0"
if exist out rmdir /s /q out
mkdir out
javac -encoding UTF-8 -d out -sourcepath src src\com\restaurant\Main.java || exit /b 1
java -cp out com.restaurant.Main
