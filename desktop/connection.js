/** @external peerjs */

const { setStatus } = require('./render')

const primaryColor = '#25AE88'
const useCustomPeerJsServer = true

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
module.exports.startReceivingService = (callback) => {
  if (isPeerAlreadyConnected(peer)) {
    console.log('Already connected')
    setStatus(primaryColor, 'Ready to receive files')
    return
  }

  setStatus('#f1c40f', 'Connecting...')
  console.log('Will connect...')

  const connectionCode = `flownio-airdash-${getConnectionCode()}`
  if (peer) peer.destroy()

  const options = useCustomPeerJsServer ? {
    host: 'peerjs.flown.io',
    path: '/myapp',
    secure: true
  } : null

  peer = new peerjs.Peer(connectionCode, options)
  const time = new Date().toTimeString().substr(0, 8)

  console.log(`Listening on ${connectionCode} ${time}...`)
  setStatus('#f1c40f', 'Connecting...')

  peer.on('open', () => onPeerOpen())
  peer.on('connection', (conn) => onPeerConnection(conn, callback))
  peer.on('error', (error) => onPeerError(error))
}

function isPeerAlreadyConnected(peer) {
  return peer && !peer.disconnected && !peer.destroyed;
}

function onPeerOpen() {
  setTimeout(() => {
    setStatus(primaryColor, 'Ready to receive files')
  }, 1000)
}

function onPeerConnection(conn, callback) {
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
}

function onPeerError(error) {
  const time = new Date().toTimeString().substr(0, 8)
  console.error(`Peer error ${time} dis: ${peer.disconnected} des: ${peer.destroyed}`, error.type, error.message)
  setStatus('#f1c40f', 'Error')
}