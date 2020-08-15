const socket = io()

//Elements
const $messageForm = document.querySelector('#chatBox')
const $messageFormInput = $messageForm.querySelector('#message')
const $messageFormButton = $messageForm.querySelector('#send')
const $locationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')
const $location = document.querySelector('#urlMessage')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight


    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

//send message to server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // disable
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = document.querySelector('#message').value

    socket.emit('teddyChat', message, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

//send message to client
socket.on('messageStream', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//send location to server
$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }
        socket.emit('locationShare', userLocation, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location delivered!')
        })
    })
})

//send location to client
socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        message: location.text,
        createdAt: moment(location.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//set join chatroom
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})