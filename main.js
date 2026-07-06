const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let runningServer = null;

function writeLog(error) {
  try {
    const logPath = path.join(os.homedir(), 'Desktop', 'examon-dpp-error-log.txt');
    fs.writeFileSync(
      logPath,
      String(error && error.stack ? error.stack : error),
      'utf8'
    );
  } catch (_) {}
}

function createMainWindow(url) {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1250,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    title: 'Examon DPP Converter',
    backgroundColor: '#eef3f8',
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    writeLog(`Window load failed: ${errorCode} - ${errorDescription}`);
    dialog.showErrorBox('Load Error', `${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.includes('/outputs/') || targetUrl.toLowerCase().endsWith('.pdf')) {
      const pdfWindow = new BrowserWindow({
        width: 1100,
        height: 850,
        title: 'PDF Preview',
        backgroundColor: '#ffffff',
        show: true,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        }
      });

      pdfWindow.loadURL(targetUrl);
      return { action: 'deny' };
    }

    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function boot() {
  try {
    const dataDir = path.join(app.getPath('userData'), 'examon-dpp-data');
    process.env.EXAMON_DATA_DIR = dataDir;

    const { startServer } = require('./server');
    const started = await startServer(0);

    runningServer = started.server;

    createMainWindow(started.url);
  } catch (err) {
    writeLog(err);
    dialog.showErrorBox(
      'Examon DPP Converter Error',
      String(err && err.message ? err.message : err)
    );
    app.quit();
  }
}

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

app.whenReady().then(boot);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (runningServer) {
    try {
      runningServer.close();
    } catch (_) {}
  }
});