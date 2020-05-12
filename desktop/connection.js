/** @external peerjs */

const primaryColor = '#25AE88'

const deviceName = require('os').hostname()
  .replace(/\.local/g, '')
  .replace(/-/g, ' ')

module.exports.getConnectionCode = () => {
  let id = localStorage.getItem('connection-id') || ''
  if (!id) {
    const num = () => Math.floor(Math.random() * 900) + 100
    id = `${num()}-${num()}-${num()}`
    localStorage.setItem('connection-id', id)
  }
  return id
}

let peer
module.exports.startReceivingService = (callback, setStatus) => {
  if (peer && !peer.disconnected && !peer.destroyed) {
    console.log('Already connected')
    setStatus(primaryColor, 'Ready to receive files')
    return
  }
  setStatus('#f1c40f', 'Connecting...')
  console.log('Will connect...')
  const connectionCode = `flownio-airdash-${getConnectionCode()}`
  if (peer) peer.destroy()
  peer = new peerjs.Peer(connectionCode)
  const time = new Date().toTimeString().substr(0, 8)
  console.log(`Listening on ${connectionCode} ${time}...`)
  setStatus('#f1c40f', 'Connecting...')
  peer.on('open', () => {
    setTimeout(() => {
      setStatus(primaryColor, 'Ready to receive files')
    }, 1000)
  })
  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conn.send({ type: 'connected', deviceName })
    })
    conn.on('data', (data) => {
      callback(data, conn)
    })
    conn.on('error', (error) => {
      const time = new Date().toTimeString().substr(0, 8)
      console.error(`Connection error ${time}`, error.type, error.message)
    })
  })
  peer.on('error', (error) => {
    const time = new Date().toTimeString().substr(0, 8)
    console.error(`Peer error ${time} dis: ${peer.disconnected} des: ${peer.destroyed}`, error.type, error.message)
    setStatus('#f1c40f', 'Error')
  })
}
