
self.addEventListener('fetch', event => {
  if (event.request.method !== 'POST') {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(Response.redirect('./'))

  ;(async function() {
    // Since a reload is triggered we have to wait to send file
    // until new page is loaded (new client registered)
    const client = await waitForPageReload()

    const body = await event.request.clone().blob()
    const headers = Object.fromEntries(event.request.headers.entries())

    console.log('Posting message...')
    client.postMessage({ body, headers })
  })()
})

async function waitForPageReload() {
  const previousClient = await getFocusedClient()
  return new Promise((resolve) => {
    async function getClient() {
      const focusedClient = await getFocusedClient()
      if (focusedClient && (!previousClient || focusedClient.id !== previousClient.id)) {
        resolve(focusedClient)
        clearInterval(intervalId)
      } else {
        console.log('Waiting for new client...')
      }
    }

    const intervalId = setInterval(getClient, 1000)
    getClient()
  })
}

async function getFocusedClient() {
  const clients = await self.clients.matchAll()
  return clients.filter(client => client.focused)[0]
}
