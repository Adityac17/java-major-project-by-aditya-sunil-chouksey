#!/usr/bin/env bash
# Compile and launch the GUI.
# Uses $JAVA_HOME/bin if JAVA_HOME is set, otherwise javac/java from PATH or Homebrew openjdk.
set -e
cd "$(dirname "$0")"

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    BIN="$JAVA_HOME/bin/"
elif command -v javac >/dev/null 2>&1 && javac -version >/dev/null 2>&1; then
    BIN=""
elif [ -x "/opt/homebrew/opt/openjdk@21/bin/javac" ]; then
    BIN="/opt/homebrew/opt/openjdk@21/bin/"
elif [ -x "/opt/homebrew/opt/openjdk/bin/javac" ]; then
    BIN="/opt/homebrew/opt/openjdk/bin/"
else
    BIN=""
fi

rm -rf out && mkdir -p out
# -sourcepath lets javac pull in every class reachable from Main
"${BIN}javac" -encoding UTF-8 -d out -sourcepath src src/com/restaurant/Main.java
"${BIN}java" -cp out com.restaurant.Main
