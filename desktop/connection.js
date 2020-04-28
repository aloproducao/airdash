/** @external peerjs */

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
  connect(callback)
  setInterval(() => {
    peer.disconnect()
    connect(callback)
  }, 30 * 1000)
}

function connect(callback) {
  const connectionCode = `flownio-airdash-${getConnectionCode()}`
  peer = new peerjs.Peer(connectionCode)
  console.log(`Listening on ${connectionCode} ${new Date().toTimeString().substr(0, 8)}...`)
  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conn.send({ type: 'connected', deviceName })
    })
    conn.on('data', (data) => {
      callback(data, conn)
    })
    conn.on('error', (error) => {
      console.error('Connection error', error)
    })
  })
  peer.on('error', (error) => {
    console.error('Peer error', error.type, error)
  })
}