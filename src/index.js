const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { Socket } = require('dgram')
const Filter = require('bad-words')
const { generateMessage } = require('../src/util/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./util/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New websocket connection')

    //on disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('messageStream', generateMessage(`${user.username} has left!`, 'Admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        //on connect
        socket.emit('messageStream', generateMessage('Welcome!', 'Admin'))
        socket.broadcast.to(user.room).emit('messageStream', generateMessage(`${user.username} has joined!`, 'Admin'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })


    //capture message, modify and send back
    socket.on('teddyChat', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profainity is not allowed!')
        }

        io.to(user.room).emit('messageStream', generateMessage(message, user.username))
        callback()
    })

    //capture location, modify and send back
    socket.on('locationShare', (location, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateMessage(`https://google.com/maps?q=${location.lat},${location.long}`, user.username))
        callback()
    })

})

server.listen(port, () => {
    console.log('Server is up on port' + port)
})
