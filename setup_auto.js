const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Setting up Instagram Clone project...\n');

// Check if setup has already been completed
const backendVenvPath = path.join(__dirname, 'backend', 'venv');
const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');

if (fs.existsSync(backendVenvPath) && fs.existsSync(frontendNodeModules)) {
  console.log('✅ Setup already completed. Starting the project...\n');
  return;
}

try {
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install frontend dependencies
  console.log('\n📦 Installing frontend dependencies...');
  process.chdir('frontend');
  if (!fs.existsSync('node_modules')) {
    execSync('npm install', { stdio: 'inherit' });
  }
  process.chdir('..');

  // Setup backend
  console.log('\n🐍 Setting up Python backend...');
  process.chdir('backend');

  // Create virtual environment if it doesn't exist
  if (!fs.existsSync('venv')) {
    console.log('Creating Python virtual environment...');
    execSync('python3 -m venv venv', { stdio: 'inherit' });
  }

  // Install backend dependencies
  console.log('Installing backend dependencies...');
  const isWindows = os.platform() === 'win32';
  const pipPath = isWindows 
    ? path.join('venv', 'Scripts', 'pip')
    : path.join('venv', 'bin', 'pip');
  
  execSync(`${pipPath} install -r requirements.txt`, { stdio: 'inherit' });

  // Create .env file if it doesn't exist
  if (!fs.existsSync('.env') && fs.existsSync('.env.example')) {
    console.log('Creating .env file...');
    fs.copyFileSync('.env.example', '.env');
  }

  process.chdir('..');

  console.log('\n✅ Setup completed successfully!\n');
  console.log('To run the project, use: npm run dev');
  console.log('Frontend: http://localhost:5173');
  console.log('Backend API: http://localhost:8000\n');

} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.error('Please check the error above and try again.');
  process.exit(1);
}