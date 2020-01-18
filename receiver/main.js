const { menubar } = require('menubar');
const isDev = require('electron-is-dev')

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
  icon: __dirname + '/icon.png',
  preloadWindow: true,
  browserWindow: {
    webPreferences: {
      nodeIntegration: true
    },
    width: 800,
    height: 800
  }
});

mb.on('ready', () => {
  console.log('App is ready');

  if (isDev) mb.window.openDevTools()
});