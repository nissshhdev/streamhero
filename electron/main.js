const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let serverInstance = null;
let activePort = process.env.PORT || 3000;

// Start internal Express & Socket.io server safely
function startServer() {
  try {
    serverInstance = require('../server.js');
    console.log('[Electron Main] StreamHero backend server initialized.');
  } catch (err) {
    console.error('[Electron Main] Backend server notice:', err.message);
  }
}

// Find responsive server port (checks 3000, then 3001, etc.)
function findActiveServer(startPort = 3000, maxPorts = 10, timeoutMs = 8000) {
  const startTime = Date.now();

  function testPort(p) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${p}/api/network-info`, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      req.on('error', () => resolve(false));
      req.setTimeout(500, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  return new Promise((resolve) => {
    async function checkAll() {
      // First check if serverInstance has a bound address
      if (serverInstance && serverInstance.server && serverInstance.server.address) {
        const addr = serverInstance.server.address();
        if (addr && addr.port) {
          activePort = addr.port;
          resolve(activePort);
          return;
        }
      }

      // Check ports in sequence
      for (let p = startPort; p < startPort + maxPorts; p++) {
        const ok = await testPort(p);
        if (ok) {
          activePort = p;
          resolve(activePort);
          return;
        }
      }

      if (Date.now() - startTime < timeoutMs) {
        setTimeout(checkAll, 200);
      } else {
        // Fallback to default port
        resolve(startPort);
      }
    }

    checkAll();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'StreamHero — Synchronized Watch Party',
    backgroundColor: '#161616',
    autoHideMenuBar: true,
    fullscreenable: true,
    show: false, // Prevents white flash during startup
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Automatically start maximized for seamless full-bleed experience
  mainWindow.maximize();

  // Open external links (like GitHub) in user's default desktop browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Custom application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Ctrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: () => shell.openExternal('https://github.com/nissshhdev/streamhero')
        },
        {
          label: 'About StreamHero',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About StreamHero',
              message: 'StreamHero Watch Party Desktop',
              detail: 'Synchronized local network & YouTube streaming application.\nCreated by Nishant.'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  try {
    const port = await findActiveServer(3000, 10, 8000);
    console.log(`[Electron Main] Loading StreamHero from http://localhost:${port}`);
    await mainWindow.loadURL(`http://localhost:${port}`);
  } catch (err) {
    console.error('[Electron Main] Error loading app URL, falling back to direct load:', err);
    await mainWindow.loadURL(`http://localhost:3000`);
  }

  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
