const path = require('node:path');
const { spawn } = require('node:child_process');

const electronBinary = require('electron');
const appRoot = path.resolve(__dirname, '..', '..');
const entryFile = path.join(appRoot, 'electron', 'main.js');

const child = spawn(electronBinary, [entryFile], {
  cwd: appRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
