# Terminal Music Player (Node.js)

A lightweight, dependency-free command-line music player built with Node.js standard modules (`readline`, `fs`, `path`, `child_process`).

This project was built as an in-class learning application demonstrating CLI design, file system handling, and OS process management in Node.js.

---

## 🎵 Features

- **Interactive CLI Shell:** Custom `music> ` prompt loop built with Node.js `readline`.
- **Directory Scanning:** Automatically reads the `songs/` folder and filters supported audio extensions (`.mp3`, `.wav`, `.aac`, `.flac`, `.m4a`, `.ogg`).
- **Flexible Playback Control:** Support for `play`, `pause`, `resume`, `stop`, `next`, `prev`, and `current`.
- **Track Resolution:** Play songs by **1-based index** (`play 1`) or **partial song name** (`play party`).
- **OS Process Management:** Delegates audio rendering to native CLI audio utilities (`afplay` on macOS, `mpg123`/`ffplay` on Linux).
- **Signal-Based Control:** Uses Unix signals (`SIGTSTP`, `SIGCONT`, `SIGTERM`) for pause, resume, and stop operations.
- **Defensive Error Guards:** Distinguishes natural song completion from process crashes or invalid audio files to prevent infinite auto-next recursion loops.
- **Clean Shutdown:** Cleans up background child processes when exiting to prevent zombie audio processes.

---

## 📁 Project Structure

```
music-player/
├── index.js              # CLI interface, readline prompt loop & command parser
├── lib/
│   ├── playlist.js       # Directory scanner, format filter & track index resolver
│   └── player.js         # Child process manager & OS audio signal controller
├── songs/                # Directory containing audio files (.mp3, .wav, etc.)
├── learning_notes.md     # Markdown presentation reference guide
├── learning_notes.html   # Styled HTML presentation reference guide
├── package.json
└── README.md
```

---

## 💻 Installation & Usage

### 1. Requirements
- Node.js (v14+ recommended)
- macOS (uses built-in `afplay`) or Linux with an audio player (`mpg123`, `ffplay`, `mplayer`, `cvlc`, or `aplay`).

### 2. Setup
Clone or navigate to the project directory and ensure your audio files are placed inside the `songs/` folder:

```bash
# Navigate to project
cd music-player

# Add audio files to songs/ directory
cp ~/Downloads/your-song.mp3 songs/

# Start the terminal music player
node index.js
```

---

## 🎮 Command Reference

| Command | Usage | Description |
| :--- | :--- | :--- |
| `list` | `list` | Displays all valid audio tracks in `songs/` with an active track marker. |
| `play` | `play <number\|name>` | Plays a song by index (`play 1`) or partial filename (`play party`). |
| `pause` | `pause` | Suspends active audio playback via `SIGTSTP`. |
| `resume` | `resume` | Resumes paused audio playback via `SIGCONT`. |
| `stop` | `stop` | Stops audio playback and kills the child process cleanly (`SIGTERM`). |
| `next` | `next` | Plays the next track in the playlist (wraps around). |
| `prev` | `prev` | Plays the previous track in the playlist (wraps around). |
| `current`| `current` | Shows active status (`PLAYING` / `PAUSED` / `IDLE`) and track details. |
| `reload` | `reload` | Rescans `songs/` directory for newly added or deleted files. |
| `help` | `help` | Displays command usage and help menu. |
| `exit` | `exit` | Stops playback, kills active child processes, and exits CLI shell. |

---

## 🧠 Core Node.js Concepts Demonstrated

1. **CLI Development (`readline`)**: Stream-based input/output handling (`process.stdin`/`process.stdout`), non-blocking prompt loops, and command string parsing.
2. **File System (`fs` & `path`)**: Synchronous directory reading (`fs.readdirSync`), extension matching (`path.extname`), and cross-platform path resolution (`path.join`).
3. **Process Management (`child_process.spawn`)**: Spawning non-blocking child processes, stream redirection (`stdio: 'ignore'`), process signal control (`SIGTSTP`, `SIGCONT`, `SIGTERM`), exit event listeners, and zombie process prevention.

---

## 📚 Presentation & Learning Documentation

For in-class presentation preparation, comprehensive notes detailing architectural decisions, pros & cons, code explanations, and debugging case studies are available in:

- 📄 **[learning_notes.md](learning_notes.md)**
- 🌐 **[learning_notes.html](learning_notes.html)**
