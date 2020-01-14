self.importScripts('https://unpkg.com/localforage@1.7.3/dist/localforage.js')

self.addEventListener('fetch', event => {
  if (event.request.method !== 'POST') {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith((async () => {
    const formData = await event.request.formData()
    const message = formData.get('text') || 'none'

    await localforage.setItem('message', message)
    console.log(`Message "${message}" stored`)

    return Response.redirect('/')
  })())
})