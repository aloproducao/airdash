const { menubar } = require('menubar')
const isDev = require('electron-is-dev')
const { ipcMain } = require('electron')

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
  icon: __dirname + '/trayIconTemplate.png',
  preloadWindow: true,
  tooltip: 'Drop a file or click for more',

  browserWindow: {
    webPreferences: {
      nodeIntegration: true
    },
    width: 450,
    height: isDev ? 500 : 250
  }
})

mb.on('ready', () => {
  mb.tray.on('drop-files', function (event, files) {
    console.log('drop-files!', files);
    mb.window.show();
    // ipcMain.emit('file', files)
    mb.window.webContents.send('file', files)
  })

  console.log('App is ready');
  mb.showWindow()
  if (isDev) mb.window.openDevTools()
})