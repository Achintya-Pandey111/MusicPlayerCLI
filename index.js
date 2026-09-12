const readline = require('readline');

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

// Listen for user input line by line
rl.on('line', (line) => {
  const input = line.trim();

  // Command parser: split input by spaces
  const parts = input.split(/\s+/);
  const command = parts[0].toLowerCase();

  if (!command) {
    rl.prompt();
    return;
  }

  switch (command) {
    case 'help':
      console.log('\nAvailable commands:');
      console.log('  help       - Show this help message');
      console.log('  exit       - Exit application\n');
      break;

    case 'exit':
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
  console.log('\nGoodbye!');
  process.exit(0);
});
