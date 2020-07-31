import { tryConnection, sendPayload } from './connection.js'
import { parseFormData } from './bodyParser.js'
import { Device } from './device.js'

console.log('Loading app.js')

const primaryColor = '#25AE88'
const warnColor = '#f1c40f'
const errorColor = '#e74c3c'

let showAddButton = true;

; (async function () {
  try {
    await navigator.serviceWorker.register('./sw.js')
    navigator.serviceWorker.addEventListener('message', swMessageReceived);
  } catch (err) {
    console.log('sw failed', err)
  }

  render()
  await connectToDevices()
})()

async function connectToDevices() {
  const devices = getDevices()
  for (const device of Object.values(devices)) {
    device.setConnecting();

    render()

    tryConnection(device.id)
      .then(() => device.setReady())
      .catch(() => device.setError())
      .then(() => {
        console.log('render');
        render()
      })
  }
}

async function swMessageReceived(event) {
  console.log('Message received')
  let { body, headers } = event.data
  const request = new Request('', { method: 'POST', body, headers })

  try {
    const { payload, meta } = await parseFormData(request)
    const activeDevice = getActiveDevice() || ''
    await sendPayload(payload, meta, activeDevice, setStatus)
  } catch (error) {
    console.error(error)
    setStatus(error)
  }
}

function render() {
  let activeDevice = getActiveDevice()
  const devices = getDevices()

  if (!devices[activeDevice]) {
    activeDevice = Object.keys(devices)[0]
  }

  const deviceRows = Object
    .entries(devices)
    .map(([id, device]) => renderDeviceRow(id, device, id === activeDevice))
    .join('')

  const content = `
    <section>
        <form>${deviceRows}</form>
        <div style="clear:both;"></div>
        <div style="margin: 10px 0;">${renderAddDevice()}</div>
    </section>
    <section style="margin-bottom: 40px">
        <p id="message" style="min-height: 20px;"></p>
        <form id="file-form" action="./" method="POST" enctype="multipart/form-data">
            <input name="rawtext" type="hidden" value="">
            <label for="file-input" id="file-button">Select file to send</label>
            <!-- bodyParser.js requires that the file input is the last element -->
            <input id="file-input" name="file" type="file" style="opacity: 0; position: absolute; z-index: -1">
        </form>
        <p style="color: #aaa; text-align: center; margin-top: 50px;">v0.2.0</p>
    </section>
  `
  document.querySelector('#content').innerHTML = content
  attachDocument()
}

function renderAddDevice() {
  if (showAddButton) {
    return `<button  id="add-device-btn" style="cursor: pointer; background: none; border: none; outline: 0; color: ${primaryColor}; padding: 10px 0;">+ Add Receiving Device</button>`
  } else {
    const codeInputs = `<input id="code-input">`
    return codeInputs + `<p>Enter device code</p>`
  }
}

function renderDeviceRow(code, device, checked) {
  const statusMessage = device.getStatusMessage()
  const statusColor = device.getStatusColor()

  console.log('render device row', statusMessage, statusColor, device);

  return `
    <div class="device" style="background: none; cursor: pointer;">
        <label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" style="padding-right: 15px;">
            <input class="device-radio" type="radio" id="${code}" name="device" value="${code}" ${checked ? 'checked' : ''}>
        </label>
        <div style="display: inline-block; padding: 10px; vertical-align: middle;">
            <div style="font-size: 18px">${device.name}</div>
            <div style="font-size: 14px; color: #555;">
                <span class="device-status-indicator" style="border-radius: 10px; width: 10px; height: 10px; background: ${statusColor}; margin-right: 5px; display: inline-block"></span> 
                <span class="device-status">${statusMessage || 'Unknown error'}</span> -
                <span class="device-status">${code}</span>
            </div>
        </div>
        <div class="remove-device-btn" style="cursor: pointer; background: none; border: 0; padding: 14px; outline: none; color: #aaa; float: right;" data-device-id="${code}">
            <i class="material-icons">close</i>
        </div>
    </div>
  `
}

function attachDocument() {
  if (!showAddButton) {
    new Cleave('#code-input', {
      delimiter: '-',
      blocks: [3, 3, 3],
      numericOnly: true
    });
  }

  document
    .querySelector('#file-input')
    .addEventListener('change', (e) => {
      const element = e.currentTarget
      // We could send the file directly here, but submitting it with the form
      // makes it easier to debug the service worker used for handling files from
      // the Android share menu
      console.log('File picked', element.files[0].name)
      gtag('filePicked', 'event');
      document.querySelector('#file-form').submit()
      setStatus('Preparing...')
    })

  const codeInputElement = () => document.querySelector('#code-input')
  if (codeInputElement()) {
    codeInputElement()
      .addEventListener('focusout', (e) => {
        if (!e.currentTarget.disabled) {
          showAddButton = true
          render()
        }
      })

    codeInputElement()
      .addEventListener('input', async (e) => {
        const element = e.currentTarget
        if (element.value.length === 11) {
          await tryAddingDevice(element.value, element)
        }
      })
  }

  const addDeviceButton = document.querySelector('#add-device-btn')
  if (addDeviceButton) {
    addDeviceButton
      .addEventListener('click', () => {
        showAddButton = false
        render()
        codeInputElement().focus()
      })
  }

  document
    .querySelectorAll('.remove-device-btn')
    .forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log('clicked', e.currentTarget.dataset)
        let devices = getDevices()
        const deviceId = e.currentTarget.dataset.deviceId
        delete devices[deviceId]
        localStorage.setItem('devices', JSON.stringify(devices))
        render();
        e.stopPropagation()
      })
    })

  document.querySelectorAll('.device')
    .forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const element = e.currentTarget
        element.querySelector('input').checked = true
        setActiveDevice(element.value)
      })
    })

  let deferredPrompt;
  document.querySelector('#android-install')
    .addEventListener('click', () => {
      deferredPrompt.prompt()
    })
  window
    .addEventListener('beforeinstallprompt', (e) => {
      deferredPrompt = e
    });
}

async function tryAddingDevice(id, element) {
  console.log(id)
  element.disabled = true
  setStatus('Connecting...')
  try {
    const result = await tryConnection(id)
    let newDevice = addDevice(id, result.deviceName || id)
    newDevice.setReady()
    setActiveDevice(id)
    showAddButton = true
    render()
  } catch (error) {
    setStatus(error)
    element.disabled = false
    element.focus()
  }
}

function getDevices() {
  let devices =
    Object.entries(localStorage)
      .filter(([key, value]) => key.startsWith('DEVICE_'))
      .map(([key, device]) => JSON.parse(device))

  console.log('getDevices', devices)
  const mappedDevices = {}

  Object.keys(devices).forEach(id => {
    const device = devices[id]
    mappedDevices[device.id] = new Device(device.id, device.name, device.addedAt, device.status)
  })

  return mappedDevices
}

function addDevice(code, name) {
  const newDevice = new Device(code, name)
  localStorage.setItem('DEVICE_' + code, JSON.stringify(newDevice))
  return newDevice;
}

function setActiveDevice(code) {
  localStorage.setItem('connection-id', code)
}

function getActiveDevice() {
  return localStorage.getItem('connection-id') || ''
}

function setStatus(status) {
  document.querySelector('#message').textContent = status
}