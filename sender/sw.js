self.importScripts('https://unpkg.com/localforage@1.7.3/dist/localforage.js')

self.addEventListener('fetch', event => {
  if (event.request.method !== 'POST') {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith((async () => {
    const formData = await event.request.formData()

    await localforage.clear()

    if (!formData.get('form')) {
      let file = formData.get('file') || ''
      if (!file) {
        file = formData.get('imaging')
        if (file) {
          console.log('IMAGING NAME CONFIRMED', file)
        }
      } else {
        console.log('Name was still "file"')
      }
      await localforage.setItem('file', file)
      await localforage.setItem('filename', file.name)
    } else {
      const file = formData.get('formfile') || 'none'

      await localforage.setItem('file', file)
      await localforage.setItem('filename', file.name)

      console.log(`File "${file.name}" stored`)
    }

    return Response.redirect('./')
  })())
})