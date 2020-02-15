const { menubar } = require('menubar');
const { app, powerMonitor } = require('electron')
const isDev = require('electron-is-dev')

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
  icon: __dirname + '/trayIconTemplate.png',
  preloadWindow: true,
  browserWindow: {
    webPreferences: {
      nodeIntegration: true
    },
    width: 450,
    height: isDev ? 500 : 250
  }
});

mb.on('ready', () => {
  console.log('App is ready');

  powerMonitor.on('resume', () => {
    // Fix for connections not working after device sleep
    mb.window.reload()
  })

  mb.tray.on('drop-files', function(event, files) {
    console.log('drop-files!', files);
  });

  mb.showWindow()
  if (isDev) mb.window.openDevTools()
});
