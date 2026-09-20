const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mlDir = __dirname;
const appPy = path.join(mlDir, 'app.py');
const reqTxt = path.join(mlDir, 'requirements.txt');

function testCommand(cmd, argsStr) {
  try {
    execSync(`${cmd} ${argsStr}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function findBestPython() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);

  if (process.env.LOCALAPPDATA) {
    candidates.push(`"${path.join(process.env.LOCALAPPDATA, 'Programs', 'Python', 'Python313', 'python.exe')}"`);
    candidates.push(`"${path.join(process.env.LOCALAPPDATA, 'Programs', 'Python', 'Python312', 'python.exe')}"`);
    candidates.push(`"${path.join(process.env.LOCALAPPDATA, 'Programs', 'Python', 'Python311', 'python.exe')}"`);
    candidates.push(`"${path.join(process.env.LOCALAPPDATA, 'Programs', 'Python', 'Python310', 'python.exe')}"`);
  }

  candidates.push('py -3.13', 'py -3.12', 'py -3.11', 'py -3', 'py', 'python', 'python3');

  // Pass 1: find one that already has all dependencies ready
  for (const cmd of candidates) {
    if (testCommand(cmd, '-c "import flask, flask_cors, sklearn, pandas, numpy, scipy, sentence_transformers"')) {
      return { cmd, ready: true };
    }
  }

  // Pass 2: find one that has pip available
  for (const cmd of candidates) {
    if (testCommand(cmd, '-c "import pip"') || testCommand(cmd, '-m pip --version')) {
      return { cmd, ready: false };
    }
  }

  // Pass 3: find any python that executes
  for (const cmd of candidates) {
    if (testCommand(cmd, '--version')) {
      return { cmd, ready: false };
    }
  }

  return null;
}

const pyTarget = findBestPython();
if (!pyTarget) {
  console.error('\n❌ [BhoomiSetu ML Service Error] Python runtime not found.');
  console.error('Please install Python 3.10+ from https://www.python.org/downloads/ and ensure Python is added to your PATH.\n');
  process.exit(1);
}

const pythonCmd = pyTarget.cmd;

// If packages are not ready, try installing
if (!pyTarget.ready) {
  console.log('📦 Installing required ML dependencies from requirements.txt...');
  try {
    execSync(`${pythonCmd} -m pip install -r "${reqTxt}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️ Failed to install dependencies automatically. Please run: pip install -r bhoomisetu-ml-service/requirements.txt');
  }
}

console.log(`🚀 Starting BhoomiSetu ML Service on http://localhost:5001 using ${pythonCmd}...`);
const pyProc = spawn(`${pythonCmd} "${appPy}"`, {
  cwd: mlDir,
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

pyProc.on('error', (err) => {
  console.error('❌ Failed to start ML service:', err.message);
  process.exit(1);
});

pyProc.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  pyProc.kill('SIGINT');
});

process.on('SIGTERM', () => {
  pyProc.kill('SIGTERM');
});

