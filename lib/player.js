const { spawn, execSync } = require('child_process');
const path = require('path');

// Audio player status constants
const STATUS = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED'
};

let currentStatus = STATUS.IDLE;
let activeChildProcess = null;
let currentTrack = null;

/**
 * Detects an available CLI audio player based on the operating system.
 * @returns {string} Player command name (e.g., 'afplay')
 */
function getAudioPlayerCommand() {
  const platform = process.platform;

  if (platform === 'darwin') {
    return 'afplay'; // Built-in audio player on macOS
  } else if (platform === 'linux') {
    const candidates = ['mpg123', 'ffplay', 'mplayer', 'cvlc', 'aplay'];
    for (const cmd of candidates) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        return cmd;
      } catch (err) {
        // Continue checking
      }
    }
  }

  return 'afplay';
}

/**
 * Plays an audio file at fullPath using child_process.spawn.
 * @param {Object} songObj - { filename, fullPath }
 * @param {Function} onEndedCallback - Called when song finishes naturally
 * @returns {boolean} Success status
 */
function play(songObj, onEndedCallback) {
  if (activeChildProcess) {
    stop();
  }

  const playerCmd = getAudioPlayerCommand();
  currentTrack = songObj;

  try {
    // Spawn the external audio player process asynchronously
    activeChildProcess = spawn(playerCmd, [songObj.fullPath], {
      stdio: 'ignore'
    });

    currentStatus = STATUS.PLAYING;

    // Listen for child process exit
    activeChildProcess.on('exit', (code, signal) => {
      activeChildProcess = null;
      currentStatus = STATUS.IDLE;

      if (code === 0 || code === null) {
        if (typeof onEndedCallback === 'function') {
          onEndedCallback();
        }
      }
    });

    // Handle spawn error (e.g. command not found)
    activeChildProcess.on('error', (err) => {
      console.error(`\nFailed to start audio player (${playerCmd}):`, err.message);
      activeChildProcess = null;
      currentStatus = STATUS.IDLE;
      currentTrack = null;
    });

    return true;
  } catch (err) {
    console.error('\nError launching player:', err.message);
    currentStatus = STATUS.IDLE;
    currentTrack = null;
    return false;
  }
}

/**
 * Pauses current playback by sending SIGTSTP / SIGSTOP signal.
 * @returns {boolean}
 */
function pause() {
  if (currentStatus !== STATUS.PLAYING || !activeChildProcess) {
    return false;
  }

  try {
    // Send SIGTSTP (Terminal Stop) or SIGSTOP (Process Stop)
    // SIGTSTP allows user-space terminal applications a cleaner suspension opportunity
    activeChildProcess.kill('SIGTSTP');
    currentStatus = STATUS.PAUSED;
    return true;
  } catch (err) {
    // Fallback to SIGSTOP if SIGTSTP fails
    try {
      activeChildProcess.kill('SIGSTOP');
      currentStatus = STATUS.PAUSED;
      return true;
    } catch (fallbackErr) {
      console.error('Failed to pause player:', fallbackErr.message);
      return false;
    }
  }
}

/**
 * Resumes current playback by sending SIGCONT process signal.
 * @returns {boolean}
 */
function resume() {
  if (currentStatus !== STATUS.PAUSED || !activeChildProcess) {
    return false;
  }

  try {
    // Send SIGCONT signal to continue execution of suspended process
    activeChildProcess.kill('SIGCONT');
    currentStatus = STATUS.PLAYING;
    return true;
  } catch (err) {
    console.error('Failed to resume player:', err.message);
    return false;
  }
}

/**
 * Stops playback and kills the child process cleanly.
 * @returns {boolean}
 */
function stop() {
  if (!activeChildProcess) {
    currentStatus = STATUS.IDLE;
    currentTrack = null;
    return false;
  }

  try {
    activeChildProcess.kill('SIGTERM');
  } catch (err) {
    // Ignore if already dead
  }

  activeChildProcess = null;
  currentStatus = STATUS.IDLE;
  currentTrack = null;
  return true;
}

/**
 * Returns current player state and song info.
 */
function getStatus() {
  return {
    status: currentStatus,
    track: currentTrack
  };
}

module.exports = {
  play,
  pause,
  resume,
  stop,
  getStatus,
  STATUS
};
