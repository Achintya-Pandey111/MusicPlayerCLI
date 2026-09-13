const readline = require('readline');
const playlist = require('./lib/playlist');
const player = require('./lib/player');

// Load songs on startup
playlist.loadSongs();

// Create interactive readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'music> '
});

console.log('--- Terminal Music Player ---');
console.log('Type "help" for a list of commands, or "exit" to quit.\n');

// Display prompt
rl.prompt();

/**
 * Helper to play a song object and attach auto-next callback
 */
function playTrack(songObj) {
  if (!songObj) return;

  console.log(`Playing [${songObj.index}]: ${songObj.filename}`);
  player.play(songObj, () => {
    // Callback executed when song naturally ends
    const nextSong = playlist.getNextSong();
    if (nextSong) {
      console.log(`\nAuto-playing next track [${nextSong.index}]: ${nextSong.filename}`);
      playTrack(nextSong);
      rl.prompt();
    }
  });
}

// Listen for user input line by line
rl.on('line', (line) => {
  const input = line.trim();

  // Command parser: split input by spaces
  const parts = input.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  const argString = args.join(' ');

  if (!command) {
    rl.prompt();
    return;
  }

  switch (command) {
    case 'list': {
      const songs = playlist.getSongs();
      if (songs.length === 0) {
        console.log('No songs found in songs/ directory.');
        console.log('Add some .mp3, .wav, or .m4a files to the songs/ folder and type "reload".');
      } else {
        const { track } = player.getStatus();
        console.log('\nPlaylist:');
        songs.forEach((song, idx) => {
          const isPlaying = track && track.filename === song;
          const marker = isPlaying ? ' -> ' : '    ';
          console.log(`${marker}${idx + 1}. ${song}`);
        });
        console.log('');
      }
      break;
    }

    case 'play': {
      if (!argString) {
        // If play is typed without args, play first song or current status
        const songs = playlist.getSongs();
        if (songs.length === 0) {
          console.log('Playlist is empty.');
        } else {
          const target = playlist.resolveSong(1);
          playTrack(target);
        }
        break;
      }

      const song = playlist.resolveSong(argString);
      if (!song) {
        console.log(`Song not found: "${argString}"`);
      } else {
        playTrack(song);
      }
      break;
    }

    case 'pause': {
      const success = player.pause();
      if (success) {
        console.log('Playback paused.');
      } else {
        console.log('No active song is playing.');
      }
      break;
    }

    case 'resume': {
      const success = player.resume();
      if (success) {
        console.log('Playback resumed.');
      } else {
        console.log('No paused song to resume.');
      }
      break;
    }

    case 'stop': {
      const success = player.stop();
      if (success) {
        console.log('Playback stopped.');
      } else {
        console.log('No song is currently playing.');
      }
      break;
    }

    case 'next': {
      const nextSong = playlist.getNextSong();
      if (!nextSong) {
        console.log('Playlist is empty.');
      } else {
        playTrack(nextSong);
      }
      break;
    }

    case 'prev': {
      const prevSong = playlist.getPrevSong();
      if (!prevSong) {
        console.log('Playlist is empty.');
      } else {
        playTrack(prevSong);
      }
      break;
    }

    case 'current': {
      const { status, track } = player.getStatus();
      if (status === player.STATUS.IDLE || !track) {
        console.log('No song is currently playing.');
      } else {
        console.log(`Status: ${status} | Currently playing [${track.index}]: ${track.filename}`);
      }
      break;
    }

    case 'reload': {
      player.stop();
      const songs = playlist.loadSongs();
      console.log(`Reloaded playlist. Found ${songs.length} song(s).`);
      break;
    }

    case 'help':
      console.log('\nAvailable commands:');
      console.log('  list       - List all available songs in songs/');
      console.log('  play <n>   - Play a song by number or name');
      console.log('  pause      - Pause playback');
      console.log('  resume     - Resume playback');
      console.log('  stop       - Stop playback');
      console.log('  next       - Play next song');
      console.log('  prev       - Play previous song');
      console.log('  current    - Show currently playing song info');
      console.log('  reload     - Rescan songs directory');
      console.log('  help       - Show this help message');
      console.log('  exit       - Exit application\n');
      break;

    case 'exit':
      player.stop(); // Clean up child process
      console.log('Goodbye!');
      process.exit(0);

    default:
      console.log(`Unknown command: "${command}". Type "help" for available commands.`);
      break;
  }

  rl.prompt();
});

// Handle graceful closing (CTRL+C)
rl.on('close', () => {
  player.stop(); // Clean up child process to avoid zombie audio process
  console.log('\nGoodbye!');
  process.exit(0);
});
