const { clipboard, nativeImage, ipcRenderer, remote } = require('electron')
const app = remote.app

const { getConnectionCode, startReceivingService } = require('./connection')
const { setStatus } = require('./render')
const {
  notifyFileSaved,
  notifyCopy,
} = require('./notifications')

const primaryColor = '#25AE88'

if (require('electron-is-dev')) {
  document.querySelector('#app-name').textContent = 'AirDash Dev'
}

document.querySelector('#location').value = locationFolder()
document.querySelector('#connection-id').textContent = getConnectionCode()

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
const COPY_FILE_IS_ENABLED = true

ipcRenderer.on('after-show', (event, message) => {
  startReceivingService(dataReceived, setStatus);
})
startReceivingService(dataReceived, setStatus);

function dataReceived(data, conn) {
  const batch = data.batch
  data = data.data

  if (typeof data === 'string') {
    clipboard.writeText(data)
    conn.send({ type: 'done' })
    notifyCopy(data)
    return
  }

  // If it's a file we receive an ArrayBuffer here
  if (data instanceof ArrayBuffer) {
    const path = require('path')
    const fs = require('fs')

    const batchSize = conn.metadata.batchSize
    const fileSize = conn.metadata.fileSize
    const filename = conn.metadata.filename
    const filepath = path.join(locationFolder(), filename)
    const filebuffer = new Buffer(data)

    if (batch === 0) {
      fs.writeFileSync(filepath, filebuffer)
    } else {
      fs.appendFileSync(filepath, filebuffer)
    }

    conn.send({ type: 'done' })

    if ((batch + 1) * batchSize >= fileSize) {
      fileReceivedSuccessfully(filepath, filename)
      setStatus(primaryColor, 'File received')
      setTimeout(() => {
        setStatus(primaryColor, 'Ready to receive files')
      }, 3000)
    } else {
      setStatus(primaryColor, `Receiving file ${batch}/${Math.round(fileSize / batchSize)} MB...`)
    }
  }
}

function fileReceivedSuccessfully(filepath, filename) {
  console.log('Received ' + filepath)
  setStatus(primaryColor, 'File received')

  // If enabled and is an image, write image to clipboard
  if (COPY_FILE_IS_ENABLED && isImage(filename)) {
    clipboard.writeImage(
      nativeImage.createFromPath(filepath)
    )
  }

  notifyFileSaved(filename, filepath)
}

function isImage(filename) {
  return /jpg|png|jpeg|svg|gif|/.test(filename)
}

function locationFolder() {
  const desktopPath = app.getPath('desktop')
  return localStorage.getItem('location') || desktopPath
}


