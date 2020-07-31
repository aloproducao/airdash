

const primaryColor = '#25AE88'
const warnColor = '#f1c40f'
const errorColor = '#e74c3c'

export const STATUS_CONNECTING = { message: 'Connecting', color: warnColor }
export const STATUS_ERROR = { message: 'Could not connect', color: errorColor }
export const STATUS_READY = { message: 'Ready', color: primaryColor }

export const STATUSES = {
    connecting: STATUS_CONNECTING,
    ready: STATUS_READY,
    error: STATUS_ERROR,
}