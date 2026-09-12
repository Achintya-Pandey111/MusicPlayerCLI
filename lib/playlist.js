const fs = require('fs');
const path = require('path');

// Supported audio file extensions
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg'];

// Path to the songs directory
const SONGS_DIR = path.join(__dirname, '..', 'songs');

// In-memory list of scanned song files
let songsList = [];
let currentIndex = -1; // 0-based index of currently selected track

/**
 * Scans the songs/ directory synchronously and loads valid audio files.
 * @returns {Array<string>} List of song filenames
 */
function loadSongs() {
  if (!fs.existsSync(SONGS_DIR)) {
    try {
      fs.mkdirSync(SONGS_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creating songs directory:', err.message);
      return [];
    }
  }

  try {
    const files = fs.readdirSync(SONGS_DIR);

    // Filter only supported audio extensions (case-insensitive)
    songsList = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    // Reset index if out of bounds
    if (currentIndex >= songsList.length) {
      currentIndex = -1;
    }

    return songsList;
  } catch (err) {
    console.error('Error reading songs directory:', err.message);
    return [];
  }
}

/**
 * Gets the current playlist.
 * @returns {Array<string>} List of loaded song filenames
 */
function getSongs() {
  return songsList;
}

/**
 * Resolves a song by its 1-based index OR filename query.
 * @param {string|number} identifier - Song number (1-based) or partial song name
 * @returns {Object|null} { index, filename, fullPath } or null if not found
 */
function resolveSong(identifier) {
  if (!identifier) return null;

  const idStr = String(identifier).trim();

  // Try parsing as a 1-based numeric index first
  const num = parseInt(idStr, 10);
  if (!isNaN(num)) {
    const arrayIndex = num - 1;
    if (arrayIndex >= 0 && arrayIndex < songsList.length) {
      currentIndex = arrayIndex;
      const filename = songsList[arrayIndex];
      return {
        index: num,
        filename: filename,
        fullPath: path.join(SONGS_DIR, filename)
      };
    }
    return null;
  }

  // Fallback: Match by filename substring (case-insensitive)
  const lowerQuery = idStr.toLowerCase();
  const foundIndex = songsList.findIndex((file) =>
    file.toLowerCase().includes(lowerQuery)
  );

  if (foundIndex !== -1) {
    currentIndex = foundIndex;
    const filename = songsList[foundIndex];
    return {
      index: foundIndex + 1,
      filename: filename,
      fullPath: path.join(SONGS_DIR, filename)
    };
  }

  return null;
}

/**
 * Gets the next song in the playlist (wraps around).
 * @returns {Object|null}
 */
function getNextSong() {
  if (songsList.length === 0) return null;
  currentIndex = (currentIndex + 1) % songsList.length;
  const filename = songsList[currentIndex];
  return {
    index: currentIndex + 1,
    filename: filename,
    fullPath: path.join(SONGS_DIR, filename)
  };
}

/**
 * Gets the previous song in the playlist (wraps around).
 * @returns {Object|null}
 */
function getPrevSong() {
  if (songsList.length === 0) return null;
  currentIndex = (currentIndex - 1 + songsList.length) % songsList.length;
  const filename = songsList[currentIndex];
  return {
    index: currentIndex + 1,
    filename: filename,
    fullPath: path.join(SONGS_DIR, filename)
  };
}

/**
 * Returns current song index (0-based)
 */
function getCurrentIndex() {
  return currentIndex;
}

module.exports = {
  loadSongs,
  getSongs,
  resolveSong,
  getNextSong,
  getPrevSong,
  getCurrentIndex,
  SONGS_DIR
};
