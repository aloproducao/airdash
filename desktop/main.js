const { menubar } = require('menubar')
const { app, powerMonitor } = require('electron')
const isDev = require('electron-is-dev')

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
  icon: __dirname + '/trayIconTemplate.png',
  preloadWindow: true,
  browserWindow: {
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    },
    width: 450,
    height: isDev ? 500 : 250
  }
});

mb.on('after-show', () => {
  mb.window.webContents.send('after-show', null)
})

mb.on('ready', () => {
  console.log('App is ready')

  powerMonitor.on('resume', () => {
    // Fix for connections not working after device sleep
    mb.window.reload()
  })

  if (!app.getLoginItemSettings().wasOpenedAsHidden) {
    mb.showWindow()
  }

  if (isDev) mb.window.openDevTools()
})

app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true })
