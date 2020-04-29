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
  const connectionCode = `flownio-airdash-${getConnectionCode()}`
  peer = new peerjs.Peer(connectionCode)
  const time = new Date().toTimeString().substr(0, 8)
  console.log(`Listening on ${connectionCode} ${time}...`)
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
    console.error(`Peer error ${time}`, error.type, error.message)
    peer.destroy()
    setTimeout(() => {
      module.exports.startReceivingService(callback)
    }, 100)
  })
}