
export async function tryConnection(deviceCode) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Connection timed out. Make sure the device code is correct and try again.')
    }, 5000)

    const peer = new peerjs.Peer()
    const connectionId = `flownio-airdash-${deviceCode}`
    const conn = peer.connect(connectionId)
    conn.on('open', async function () {
      conn.on('data', (data) => {
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

export async function sendPayload(payload, meta, activeDevice, setStatus) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Connection timed out. Make sure the device id is correct and try again.')
    }, 5000)

    if (!activeDevice) return

    const connectionId = `flownio-airdash-${activeDevice}`
    setStatus('Connecting...')
    console.log(`Sending ${meta} to ${connectionId}...`)

    const peer = new peerjs.Peer()
    const conn = peer.connect(connectionId, { metadata: { filename: meta } })
    conn.on('open', async function () {
      clearTimeout(timeout)
      setStatus('Sending...')
      setTimeout(_ => {
        // conn.send blocks thread so wait one tick to let the
        // status change go through
        conn.send(payload)
      })
    })
    conn.on('data', async function (data) {
      const type = data && data.type
      if (type === 'connected') {
      } else if (type === 'done') {
        setStatus('Sent ' + meta)
        resolve('done')
      } else {
        console.log('unknown message', data)
        setStatus('Unknown message ' + data)
        reject(data)
      }
    })
    conn.on('error', function (err) {
      console.log('err', err)
      setStatus(err)
      reject(err)
    })
  })
}