const { menubar } = require('menubar');
const isDev = require('electron-is-dev')

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
  icon: __dirname + '/trayIconTemplate.png',
  preloadWindow: true,
  browserWindow: {
    webPreferences: {
      nodeIntegration: true
    },
    width: 550,
    height: isDev ? 600 : 300
  }
});

mb.on('ready', () => {
  mb.tray.on('drop-files', function(event, files) {
    console.log('drop-files!', files);
  });

  console.log('App is ready');
  mb.showWindow()
  if (isDev) mb.window.openDevTools()
});