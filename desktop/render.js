
function setStatus(color, status) {
    let $message = document.querySelector('#status-message')
    let $indicator = document.querySelector('#status-indicator')
    $indicator.style.background = color
    $message.textContent = status
}

module.exports = {
    setStatus
}