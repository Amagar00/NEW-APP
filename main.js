hereconst { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000, // Adjusted width for results app
    height: 800, // Adjusted height for results app
    webPreferences: {
      // Set to true for simplicity in older Electron versions
      nodeIntegration: true,
      contextIsolation: false 
    }
  });

  // Load your index.html file
  // '__dirname' refers to the root folder of your project on the cloud server.
  mainWindow.loadFile('index.html');

  // Optional: Open the DevTools. This is helpful for testing.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS, create a new window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
