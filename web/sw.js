self.importScripts('https://unpkg.com/localforage@1.7.3/dist/localforage.js')

self.addEventListener('fetch', event => {
  async function responseWithAppName(appName, event) {
    const res = await fetch(event.request)
    if (!res.url.includes('manifest.json')) {
      return res
    }
    const json = await res.json()
    json.name = appName
    json.short_name = appName
    const jsonString = JSON.stringify(json)
    return new Response(jsonString)
  }

  if (event.request.method !== 'POST') {
    if (event.request.url.includes('localhost')) {
      event.respondWith(responseWithAppName('AirDash Dev 2', event))
    } else {
      event.respondWith(fetch(event.request))
    }
    return
  }

  event.respondWith((async () => {
    await localforage.clear()
    try {
      const formData = await event.request.formData()
      if (formData.get('text')) {
        await localforage.setItem('text', formData.get('text'))
      } else if (!formData.get('form')) {
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
    } catch (err) {
      console.log(err);
      await localforage.setItem('error', err.message)
    }

    return Response.redirect('./')
  })())
})