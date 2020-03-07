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

module.exports.startReceivingService = (callback) => {
  const connectionCode = `flownio-airdash-${getConnectionCode()}`
  const peer = new peerjs.Peer(connectionCode)
  console.log(`Listening on ${connectionCode}...`)
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
    console.error('Peer error', error)
  })
}
