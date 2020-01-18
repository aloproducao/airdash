const { menubar } = require('menubar');

const mb = menubar({
  index: 'file://' + __dirname + '/index.html',
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
  console.log('app is ready');
});