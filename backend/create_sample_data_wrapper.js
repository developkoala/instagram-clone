const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Determine the virtual environment Python path based on OS
const isWindows = os.platform() === 'win32';
const venvPath = path.join(__dirname, 'venv');
const pythonPath = isWindows 
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

// Run the sample data creation script
const createData = spawn(pythonPath, ['create_sample_data.py'], {
  cwd: __dirname,
  stdio: 'inherit'
});

createData.on('error', (err) => {
  console.error('Failed to create sample data:', err);
  console.error('Make sure the backend server is running first');
  process.exit(1);
});

createData.on('exit', (code) => {
  if (code === 0) {
    console.log('Sample data created successfully!');
  }
  process.exit(code);
});