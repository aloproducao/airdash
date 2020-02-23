const { ipcRenderer } = require('electron')
let showAddButton = true
const primaryColor = '#25AE88'

render();

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

ipcRenderer.on('file', (sender, files) => {
  // console.log('file', files)
  // got files here :P
})

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
      const path = require('path')
      const fs = require('fs')

      const filename = conn.metadata.filename || 'unknown'
      const filepath = path.join(locationFolder(), filename)
      fs.writeFileSync(filepath, new Buffer(data))
      conn.send({ type: 'done' })
      console.log('Received ' + filepath)

      notifyFileSaved(filename, filepath)
    })
  })
  previousPeer = peer
}

function render() {
  let activeDevice = getActiveDevice()
  const devices = getDevices()
  if (!devices[activeDevice]) {
    activeDevice = Object.keys(devices)[0]
  }
  const content = `
    <section>
        <form>
            ${Object.entries(devices).map(([id, obj], i) => renderDeviceRow(id, obj, id === activeDevice)).join('')}
        </form>
        <div style="clear:both;"></div>
        <div style="margin: 10px 0;">${renderAddDevice()}</div>
    </section>
    <section style="margin-bottom: 40px">
        <p id="message" style="min-height: 20px;"></p>
        <form id="file-form" action="./" method="POST" enctype="multipart/form-data">
            <input name="form" type="hidden" value="true">
            <div class="select-file-box">
                <p class="body"><span style="color: #25AE88;">Select</span> or drop files here</p>
            </div>
            <input id="file-input" onchange="fileChanged(this)" name="formfile" type="file" style="opacity: 0; position: absolute; z-index: -1">
        </form>
    </section>
  `
  document.querySelector('#content').innerHTML = content

  if (!showAddButton) {
    new Cleave('#code-input', {
      delimiter: '-',
      blocks: [3, 3, 3],
      numericOnly: true
    });
  }
}

function renderAddDevice() {
  if (showAddButton) {
    return `<button style="cursor: pointer; background: none; border: none; outline: 0; color: ${primaryColor}; padding: 10px 0;" onclick="addDeviceClicked(this)">+ Add Receiving Device</button>`
  } else {
    const codeInputs = `<input id="code-input" oninput="addDeviceInputChanged(this)" onfocusout="addDeviceInputFocusOut(this)">`
    return codeInputs + `<p>Enter device code</p>`
  }
}

function addDeviceInputFocusOut(element) {
  if (!element.disabled) {
    showAddButton = true
    render()
  }
}

function addDeviceClicked() {
  showAddButton = false
  render()
  document.querySelector('#code-input').focus()
}

async function addDeviceInputChanged(element) {
  if (element.value.length === 11) {
    const code = document.querySelector('#code-input').value
    await tryAddingDevice(code, element)
  }
}

async function tryAddingDevice(code, element) {
  element.disabled = true
  setStatus('Connecting...')
  try {
    const result = await tryConnection(code)
    setStatus('Connected...')
    addDevice(code, result.deviceName || code)
    setActiveDevice(code)
    showAddButton = true
    render()
  } catch (error) {
    setStatus(error)
    element.disabled = false
    element.focus()
  }
}

function renderDeviceRow(id, device, checked) {
  return `
    <div class="device" style="background: none; cursor: pointer;" onclick="deviceRowClicked(this)">
        <label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" style="padding-right: 15px;">
            <input class="device-radio" type="radio" id="${id}" onchange="deviceClicked(this)" name="device" value="${id}" ${checked ? 'checked' : ''}>
        </label>
        <div style="display: inline-block; padding: 10px; vertical-align: middle;">
            <div style="font-size: 18px">${device.name}</div>
            <div style="font-size: 14px; color: #555;">
                <span class="device-status-indicator" style="border-radius: 10px; width: 10px; height: 10px; background: ${primaryColor}; margin-right: 5px; display: inline-block"></span> 
                <span class="device-status">${id}</span>
            </div>
        </div>
        <button style="cursor: pointer; background: none; border: 0; padding: 14px; outline: none; color: #aaa; float: right;" onclick="removeDeviceClicked('${id}')">
            <i class="material-icons">close</i>
        </button>
    </div>
  `
}


function removeDeviceClicked(id) {
  let devices = getDevices()
  delete devices[id]
  localStorage.setItem('devices', JSON.stringify(devices))
  render();
}

function getDevices() {
  const devices = JSON.parse(localStorage.getItem('devices') || '{}')
  return devices
}

function addDevice(code, name) {
  const newDevice = { name, addedAt: new Date() }
  const devices = getDevices()
  devices[code] = newDevice
  localStorage.setItem('devices', JSON.stringify(devices))
}

function deviceRowClicked(element) {
  element.querySelector('input').checked = true
}

function deviceClicked(element) {
  setActiveDevice(element.value)
}

function getActiveDevice() {
  return localStorage.getItem('connection-id') || ''
}

function setActiveDevice(code) {
  localStorage.setItem('connection-id', code)
}


function notifyFileSaved(filename, filepath) {
  const title = `New File from:  ${getConnectionId()}`
  const image = `${__dirname}/trayIconTemplate@2x.png`
  const notifOptions = {
    body: `A new file has been saved, ${filename}`,
    icon: isImage(filename) ? filepath : image,
    silent: true,
  }

  const myNotification = new Notification(title, notifOptions)
  myNotification.onclick = () => {
    // we can do something when user click file,
    // for example open the directory, or preview the file
  }
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

async function tryConnection(deviceCode) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Connection timed out. Make sure the device code is correct and try again.')
    }, 15000)

    const peer = new peerjs.Peer(null, { debug: 3 })
    const connectionId = `flownio-airdash-${deviceCode}`
    const conn = peer.connect(connectionId)

    conn.on('message', (data) => {
      console.log('message ' + data)
    });
    conn.on('open', function () {
      console.log('data');
      conn.on('data', (data) => {
        console.log('open');
        clearTimeout(timeout)
        peer.destroy()
        resolve({ deviceName: data.deviceName })
      })
    })
    conn.on('error', function (err) {
      console.log('err', err)
      reject(err)
    })
  })
}

function setStatus(status) {
  document.querySelector('#message').textContent = status
}