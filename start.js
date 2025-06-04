const { exec } = require('child_process');

exec('start cmd.exe /k "cd frontend && npm run dev"', (err) => {
    if (err) console.error(`Error starting frontend: ${err}`);
});

exec('start cmd.exe /k "python ./backend/main.py"', (err) => {
    if (err) console.error(`Error starting backend: ${err}`);
});
