# Terminal Music Player — Learning & Presentation Guide

> **Project Goal:** A lightweight, dependency-free Terminal Music Player built with Node.js standard modules (`readline`, `fs`, `path`, `child_process`).

---

## 1. Project Overview & Architecture

### System Architecture

```
User (Keyboard)
   │
   ▼
[index.js] ── (CLI / Readline & Command Parsing)
   │
   ├──────► [lib/playlist.js] (Directory Scanning & Track Metadata)
   │
   └──────► [lib/player.js]   (Child Process Spawning & OS Audio Signal Control)
               │
               ▼
        (Child Process: e.g. afplay / mpg123)
               │
               ▼
          Audio Output
```

### Module Responsibilities

| File | Purpose | Key Responsibilities |
| :--- | :--- | :--- |
| `index.js` | **CLI Controller** | Manages `readline` prompt loop, parses user input into `command` + `args`, dispatches actions to modules. |
| `lib/playlist.js` | **Playlist Manager** | Scans `songs/` folder, filters supported extensions (`.mp3`, `.wav`, `.aac`, `.flac`, `.m4a`), handles indexing and track resolution. |
| `lib/player.js` | **Audio Engine** | Detects OS audio utility, spawns child process (`child_process.spawn`), manages signals (`SIGSTOP`, `SIGCONT`, `SIGTERM`), handles `exit` events. |
| `songs/` | **Storage** | Contains raw audio assets scanned dynamically by `playlist.js`. |

---

## 2. Technical Concepts & Node.js Core Modules

### A. CLI & Readline (`readline`)
- **Concept:** `readline` creates an interface connected to readable `process.stdin` and writable `process.stdout` streams.
- **Key Methods:** `readline.createInterface()`, `rl.prompt()`, `rl.on('line', listener)`, `rl.on('close', listener)`.
- **Event-Driven Execution:** Instead of a blocking `while(true)` loop, Node.js waits asynchronously for stream event emissions when the user presses Enter.

### B. File System & Path Resolution (`fs` & `path`)
- **Concept:** Reading audio directory contents and normalizing cross-platform file paths.
- **Key Functions:** `fs.readdirSync()`, `fs.statSync()`, `path.join()`, `path.extname()`.
- **Filtering Logic:** Case-insensitive extension matching ensures unsupported files (e.g. `.DS_Store`, `.txt`) are excluded cleanly.

### C. Process Management & Signals (`child_process`)
- **Concept:** Offloading heavy audio decoding to native OS terminal audio tools (`afplay` on macOS, `mpg123`/`ffplay` on Linux/Windows).
- **Key API:** `child_process.spawn(command, args, options)` creates a non-blocking asynchronous child process.
- **Process Signals:**
  - `SIGSTOP` / `SIGTSTP`: Suspends process execution (Pause).
  - `SIGCONT`: Resumes process execution (Resume).
  - `SIGTERM` / `SIGKILL`: Terminates process (Stop).

---

## 3. Comparison of Architectural Approaches (Pros & Cons)

### Approach 1: Standard Node.js Native Modules (Chosen Approach)
* **Pros:** Zero npm dependencies, deep understanding of Node.js event loop, streams, and process lifecycle; highly lightweight.
* **Cons:** Requires OS-level audio CLI utility installed (`afplay` on macOS, `mpg123` on Linux).

### Approach 2: Monolithic Single-File Script (`index.js` holding all code)
* **Pros:** Quick to code initially.
* **Cons:** Hard to maintain, poor separation of concerns, untestable, cluttered code structure.

### Approach 3: Third-Party Frameworks (`commander`, `inquirer`, `play-sound` npm packages)
* **Pros:** Abstraction simplifies command parsing and cross-platform audio player wrapping.
* **Cons:** Hides core Node.js mechanics, adds heavy `node_modules` dependency bloat, less educational value for learning CLI/process fundamentals.

---

## 4. Progress Log & Step-by-Step Milestones

| Milestone | Status | Description |
| :--- | :--- | :--- |
| **Step 1: CLI Shell** | **Completed** | Built interactive `readline` prompt loop in `index.js`, command parser (`split`), support for `help` and `exit`. |
| **Step 2: Playlist Module** | **Completed** | Built `lib/playlist.js` to scan `songs/`, filter audio extensions (`.mp3`, `.wav`), resolve track numbers/names. |
| **Step 3: Audio Engine** | **Completed** | Built `lib/player.js` with `spawn()`, signal control (`SIGSTOP`/`SIGCONT`/`SIGTERM`), exit handlers for track transitions. |
| **Step 4: Integration** | **Completed** | Wired commands (`play`, `pause`, `resume`, `stop`, `next`, `prev`, `current`) in `index.js` and added graceful shutdown. |

---

## 5. Potential Interview / Presentation Questions & Answers

1. **Q: Why use `child_process.spawn()` instead of `child_process.exec()`?**
   - **A:** `spawn()` streams data and runs asynchronously with process events, suitable for long-running processes like audio playback. `exec()` buffers output into memory until completion, which is inefficient and limited by buffer sizes. Furthermore, `spawn()` passes arguments as an array directly to OS system calls (`execve`), making it immune to shell injection and natively handling spaces in filenames (e.g. `PARTY PEOPLE.mp3`) without manual string escaping.

2. **Q: How does the application distinguish natural song completion from manual `stop` or process errors?**
   - **A:** By combining three checks:
     1. `isManualStop` flag: Set to `true` prior to explicit `stop()` or `play()` calls.
     2. Process `exit` code: Checks that exit code was successful (`0` or `null`).
     3. Minimum Duration check (`durationMs > 1500`): Prevents rapid infinite loops if an audio file is dummy, invalid, or corrupted (which causes `afplay` to exit instantly in < 5ms). If playback duration is under 1.5 seconds, auto-next is skipped.

3. **Q: Why use `readline` instead of `process.stdin.on('data')`?**
   - **A:** `readline` abstracts line buffering, backspace key handling, command history, and prompt output automatically.

4. **Q: Why does pausing an external CLI audio player (`afplay`) via process signals cause a tiny audio jitter?**
   - **A:** `afplay` feeds audio frames into macOS CoreAudio hardware ring buffers. Sending `SIGSTOP`/`SIGTSTP` instantly freezes CPU execution of the `afplay` process in kernel space, but the sound hardware continues to drain the remaining 50–100ms of audio frames sitting in the hardware DMA buffer queue before going quiet. This illustrates the fundamental difference between **process-level signal control** (abrupt OS freeze) versus **application-level API audio control** (smooth software audio fade-out).

---

## 6. Real-World Debugging Sessions & Case Studies

### Case Study 1: The Rapid Auto-Next Loop Bug
* **Symptom:** Playing dummy placeholder text files (`sample1.mp3`, `sample2.wav`) caused the terminal CLI to rapidly print infinite `Auto-playing next track...` lines.
* **Root Cause:** Dummy text files were invalid audio formats. `afplay` exited in ~2ms. The process `exit` event listener misidentified instantaneous process failure as natural song completion, repeatedly triggering `autoNext()`.
* **Fix Implemented:** Introduced a **Triple Completion Guard** in `lib/player.js`:
  ```js
  const durationMs = Date.now() - startTime;
  const playedLongEnough = durationMs > 1500;
  const exitedSuccessfully = code === 0 || code === null;

  if (!wasManual && exitedSuccessfully && playedLongEnough) {
    onEndedCallback(); // Natural song end
  } else if (!wasManual && (!playedLongEnough || !exitedSuccessfully)) {
    console.log(`[Playback Notice] Track exited prematurely after ${durationMs}ms. Skipping auto-next.`);
  }
  ```

### Case Study 2: CoreAudio Pause Buffer Jitter
* **Symptom:** Executing the `pause` command resulted in a tiny audio repetition or buffer "jitter" sound.
* **Root Cause:** Process signals like `SIGSTOP` halt CPU instructions in kernel space, but CoreAudio hardware ring buffers (DMA) finish playing remaining unrendered audio frames (~50–100ms) stored in hardware memory.
* **Fix Implemented:** Updated `pause()` in `lib/player.js` to send `SIGTSTP` (Terminal Stop), giving terminal child processes cleaner suspension opportunities, with a `SIGSTOP` fallback.

### Case Study 3: Filenames Containing Spaces (`PARTY PEOPLE.mp3`)
* **Symptom:** Supporting real audio tracks downloaded with spaces in their filenames.
* **Root Cause:** String concatenation passed to `child_process.exec()` breaks on spaces without complex escaping.
* **Fix Implemented:** Used `child_process.spawn(command, [args])` which passes arguments directly as an array to `execve`, safely handling spaces natively without shell escaping vulnerabilities.
