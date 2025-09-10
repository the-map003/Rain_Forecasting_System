const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Rain Forecasting System');
console.log('===================================\n');

// Function to start a process
function startProcess(name, command, args, cwd) {
    console.log(`📦 Starting ${name}...`);
    
    const process = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true
    });

    process.stdout.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`[${name}] ERROR: ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
    });

    return process;
}

// Start Backend
console.log('🔧 Starting Backend Server...');
const backendProcess = startProcess('Backend', 'node', ['index.js'], path.join(__dirname, 'backend'));

// Wait a moment for backend to start
setTimeout(() => {
    console.log('\n🌐 Starting Frontend...');
    const frontendProcess = startProcess('Frontend', 'npm', ['run', 'dev'], path.join(__dirname, 'frontend', 'rain_forecasting_system'));
    
    console.log('\n✅ System started!');
    console.log('📱 Frontend: http://localhost:5173');
    console.log('🔧 Backend: http://localhost:5000');
    console.log('📡 MQTT Broker: test.mosquitto.org:1883');
    console.log('\n💡 Press Ctrl+C to stop all processes');
    
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down system...');
    backendProcess.kill();
    process.exit(0);
});
