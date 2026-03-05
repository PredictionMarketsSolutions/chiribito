#!/usr/bin/env node

/**
 * view-logs.js
 * Script para ver logs del servidor en tiempo real
 * 
 * Uso:
 *   npm run logs           # Ver todos los logs en desarrollo
 *   npm run logs:error     # Ver solo errores
 *   npm run logs:watch     # Ver logs en tiempo real
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const logsDir = path.join(__dirname, '../logs');
const isDev = process.env.NODE_ENV !== 'production';

// Archivos de logs según ambiente
const logFiles = {
  dev: {
    all: 'dev.log',
    error: 'dev-error.log'
  },
  prod: {
    all: 'combined.log',
    error: 'error.log'
  }
};

const files = isDev ? logFiles.dev : logFiles.prod;

// Comando desde argumentos
const command = process.argv[2] || 'all';

function printHelp() {
  console.log(`
📊 Visor de Logs - Chiri Backend

Uso:
  node scripts/view-logs.js [comando]

Comandos:
  all       Ver todos los logs (por defecto)
  error     Ver solo errores
  watch     Ver logs en tiempo real (tail -f)
  help      Mostrar esta ayuda

Ejemplos:
  npm run logs              # Ver todos los logs
  npm run logs:error        # Ver solo errores
  npm run logs:watch        # Seguir logs en tiempo real

Archivos:
  Desarrollo: logs/dev.log, logs/dev-error.log
  Producción: logs/combined.log, logs/error.log
  `);
}

function checkLogsDirectory() {
  if (!fs.existsSync(logsDir)) {
    console.error('❌ Directorio de logs no existe.');
    console.log('\nEjecuta primero el servidor para generar logs:');
    console.log('  npm run dev\n');
    process.exit(1);
  }
}

function viewLogs(type = 'all') {
  checkLogsDirectory();
  
  const filename = type === 'error' ? files.error : files.all;
  const filepath = path.join(logsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Archivo de logs no encontrado: ${filename}`);
    console.log('\nEjecuta el servidor primero para generar logs.');
    process.exit(1);
  }

  console.log(`📊 Mostrando: ${filepath}\n`);
  console.log('═'.repeat(80));
  
  const content = fs.readFileSync(filepath, 'utf-8');
  console.log(content);
  
  console.log('═'.repeat(80));
  console.log(`\n✅ Total de líneas: ${content.split('\n').length}`);
}

function watchLogs(type = 'all') {
  checkLogsDirectory();
  
  const filename = type === 'error' ? files.error : files.all;
  const filepath = path.join(logsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Archivo de logs no encontrado: ${filename}`);
    console.log('\nEjecuta el servidor primero para generar logs.');
    process.exit(1);
  }

  console.log(`📊 Siguiendo logs en tiempo real: ${filepath}`);
  console.log('═'.repeat(80));
  console.log('(Presiona Ctrl+C para detener)\n');

  // En Windows, usar PowerShell Get-Content -Wait
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    const ps = spawn('powershell.exe', [
      '-Command',
      `Get-Content "${filepath}" -Wait -Tail 20`
    ], { stdio: 'inherit' });

    ps.on('exit', (code) => {
      console.log(`\n\n✅ Terminado (código ${code})`);
    });
  } else {
    // En Unix, usar tail -f
    const tail = spawn('tail', ['-f', '-n', '20', filepath], { stdio: 'inherit' });

    tail.on('exit', (code) => {
      console.log(`\n\n✅ Terminado (código ${code})`);
    });
  }
}

function searchLogs(query) {
  checkLogsDirectory();
  
  const filepath = path.join(logsDir, files.all);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Archivo de logs no encontrado`);
    process.exit(1);
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const matches = lines.filter(line => line.toLowerCase().includes(query.toLowerCase()));

  console.log(`🔍 Buscando: "${query}" en ${filepath}\n`);
  console.log('═'.repeat(80));
  
  if (matches.length === 0) {
    console.log('❌ No se encontraron coincidencias');
  } else {
    matches.forEach(line => console.log(line));
    console.log('═'.repeat(80));
    console.log(`\n✅ ${matches.length} coincidencias encontradas`);
  }
}

// Main
switch (command) {
  case 'all':
    viewLogs('all');
    break;
  
  case 'error':
  case 'errors':
    viewLogs('error');
    break;
  
  case 'watch':
  case 'tail':
  case 'follow':
    watchLogs('all');
    break;
  
  case 'watch:error':
    watchLogs('error');
    break;
  
  case 'search':
    const query = process.argv[3];
    if (!query) {
      console.error('❌ Proporciona un término de búsqueda');
      console.log('Uso: npm run logs:search "término"');
      process.exit(1);
    }
    searchLogs(query);
    break;
  
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  
  default:
    console.error(`❌ Comando desconocido: ${command}`);
    printHelp();
    process.exit(1);
}
