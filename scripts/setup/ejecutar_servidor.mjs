import { spawn } from 'child_process';

const devServer = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit',
});

devServer.on('error', (err) => {
  console.error('Error al iniciar el servidor de desarrollo:', err);
});

devServer.on('exit', (code) => {
    console.log(`El servidor ha salido con el código ${code}`);
});
