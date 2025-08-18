const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Determine the virtual environment activation script based on OS
const isWindows = os.platform() === 'win32';
const venvPath = path.join(__dirname, 'venv');
const pythonPath = isWindows 
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

// Run uvicorn with the virtual environment Python
const uvicorn = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--reload'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

uvicorn.on('error', (err) => {
  console.error('Failed to start backend:', err);
  console.error('Please run "npm run setup" first to install dependencies');
  process.exit(1);
});

uvicorn.on('exit', (code) => {
  process.exit(code);
});