self.importScripts('https://unpkg.com/localforage@1.7.3/dist/localforage.js')

self.addEventListener('fetch', event => {
  if (event.request.method !== 'POST') {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith((async () => {
    const formData = await event.request.formData()
    const message = formData.get('text') || 'none'
    const file = formData.get('file') || 'none'
    formData.append('filename', file.name)

    await localforage.setItem('file', file)
    await localforage.setItem('filename', file.name)

    console.log(`Message "${file.name}" stored`)

    return Response.redirect('/')
  })())
})