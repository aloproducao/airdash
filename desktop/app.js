const { clipboard, nativeImage } = require('electron')

if (require('electron-is-dev')) {
  document.querySelector('#app-name').textContent = 'AirDash Dev'
}

document.querySelector('#location').value = locationFolder()
document.querySelector('#connection-id').textContent = getConnectionId()

document.querySelector('#select-location').onclick = async () => {
  const { dialog } = require('electron').remote
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  const location = result.filePaths[0]
  if (location) {
    localStorage.setItem('location', location)
    document.querySelector('#location').value = location
  }
}

// I add this "configs" here for now until some kind of user settings is in place 
// Set to true to copy files to clipboard
const COPY_FILE = true
// Enable receiving raw text and automatically paste to clipboard
const RAW_TEXT = true


let previousPeer = null
reconnect()
if (!getConnectionId()) {
  refreshDeviceId()
}

function refreshDeviceId() {
  const num = () => Math.floor(Math.random() * 900) + 100
  const newId = `${num()}-${num()}-${num()}`
  localStorage.setItem('connection-id', newId)
  document.querySelector('#connection-id').textContent = newId
  reconnect()
}

function reconnect() {
  if (previousPeer) previousPeer.destroy()
  const connectionId = `flownio-airdash-${getConnectionId()}`
  const peer = new peerjs.Peer(connectionId)
  console.log(`Listening on ${connectionId}...`)
  peer.on('connection', (conn) => {
    conn.on('open', () => {
      const hostname = require('os').hostname()
      const name = hostname
        .replace(/\.local/g, '')
        .replace(/-/g, ' ')
      conn.send({ type: 'connected', deviceName: name })
    })
    conn.on('data', (data) => {
      console.log('data', data);
      // If enabled and is a string we copy to clipboard
      // TODO: this should be configured by the user at some point
      if (RAW_TEXT && typeof data === 'string') {
        clipboard.writeText(data)
        notifyCopy(data)
        return
      }

      // If it's a file we receive an ArrayBuffer here 
      if (data instanceof ArrayBuffer) {
        const path = require('path')
        const fs = require('fs')

        const filename = conn.metadata.filename || 'unknown'
        const filepath = path.join(locationFolder(), filename)
        const filebuffer = new Buffer(data)

        fs.writeFileSync(filepath, filebuffer)
        conn.send({ type: 'done' })
        console.log('Received ' + filepath)

        // If enabled and is an image, write image to clipboard
        if (COPY_FILE && isImage(filename)) {
          clipboard.writeImage(
            nativeImage.createFromPath(filepath)
          )
        }

        notifyFileSaved(filename, filepath)
        return
      }
    })
  })
  previousPeer = peer
}

function notify(title, body, icon, opts = {}, cb) {
  const notifOptions = {
    body,
    icon,
    silent: true,
    ...opts,
  }

  const myNotification = new Notification(title, notifOptions)
  myNotification.onclick = () => {
    // we can do something when user click file,
    // for example open the directory, or preview the file
  }
}


function notifyCopy(data) {
  const title = `Received Text from:  ${getConnectionId()}`
  const body = data
  const image = `${__dirname}/trayIconTemplate@2x.png`
  notify(title, body, image)
}

function notifyFileSaved(filename, filepath) {
  const title = `New File from:  ${getConnectionId()}`
  const body = `A new file has been saved, ${filename}`
  const image = `${__dirname}/trayIconTemplate@2x.png`
  notify(title, body, isImage(filename) ? filepath : image)
}

function isImage(filename) {
  return /jpg|png|jpeg|svg|gif|/.test(filename)
}

function locationFolder() {
  const path = require('path')
  const os = require('os')
  const desktopPath = path.join(os.homedir(), 'Desktop')
  return localStorage.getItem('location') || desktopPath
}

function getConnectionId() {
  return localStorage.getItem('connection-id') || ''
}
