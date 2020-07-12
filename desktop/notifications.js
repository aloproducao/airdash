
function notify(title, body, icon, opts = {}, cb) {
    const notifOptions = {
        body,
        icon,
        silent: true,
        ...opts,
    }

    const myNotification = new Notification(title, notifOptions)
    myNotification.onclick = () => {
        // we can do something when user click file,
        // for example open the directory, or preview the file
    }
}

function notifyCopy(data) {
    const title = `Received text`
    const body = data
    const image = `${__dirname}/trayIconTemplate@2x.png`
    notify(title, body, image)
}

function notifyFileSaved(filename, filepath) {
    const title = `New File`
    const body = `A new file has been saved, ${filename}`
    const image = `${__dirname}/trayIconTemplate@2x.png`
    notify(title, body, isImage(filename) ? filepath : image)
}

module.exports.notify = notify;
module.exports.notifyCopy = notifyCopy;
module.exports.notifyFileSaved = notifyFileSaved;