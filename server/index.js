var _ = require('lodash');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var catNames = require('cat-names');

var io = require('socket.io')(server);

var rooms = [createRoom()];
var usersNames = [];

io.on('connection', function (socket) {
    var userName;

    function refreshRooms() {
        socket.broadcast.emit('rooms_refreshed', rooms);
        socket.emit('rooms_refreshed', rooms);
    }

    function checkRoomReady(room) {
        var player = _.findWhere(room.players, {name: userName});
        if (player) {
            player.isReady = true;
        }
        if (room.players.length === 2 && _.every(_.pluck(room.players, 'isReady'))) {
            return true;
        } else {
            return false;
        }
    }

    function deletePlayer(name) {
        var idx = usersNames.indexOf(name);
        if (idx > -1) {
            usersNames.splice(idx, 1);
            _.each(rooms, function (room) {
                if (room.players.length > 0) {
                    var names = _.pluck(room.players, 'name');
                    var i = names.indexOf(name);
                    if (i > -1) {
                        room.players.splice(i, 1);
                        room.free = true;
                    }
                }
            });
        }
    }

    socket.on('register_name', function (name) {
        if (_.contains(usersNames, name) || name === '') {
            socket.emit('register_name_err', name);
        } else {
            usersNames.push(name);
            userName = name;
            socket.emit('register_name_ok', name);
        }
        refreshRooms();
    });

    socket.on('refresh_rooms', refreshRooms);

    socket.on('join_room', function (roomId) {
        var freeId = [];
        if (rooms.length > 2) {
            _.each(rooms, function (room) {
                if (room.players.length === 0) {
                    freeId.push(room.id);
                }
            });
        }

        var room = _.findWhere(rooms, {id: roomId});

        if (room.free) {
            room.players.push({
                name: userName,
                isReady: false
            });
            socket.emit('joined', room);
            if (room.players.length === 2) {
                room.free = false;
                room.currentPlayerMove = userName;
                socket.emit('room_full', room.id)
                if (freeId.length < 2) {
                    rooms.push(createRoom());
                }
            }
        } else {
            socket.emit('room_full', roomId);
            if (freeId.length < 2) {
                rooms.push(createRoom());
            }
        }

        refreshRooms();
    });

    socket.on('im_ready', function (roomId) {
        var room = _.findWhere(rooms, {id: roomId});

        if (checkRoomReady(room)) {
            socket.broadcast.emit('begin_battle', room);
            socket.emit('begin_battle', room);
            room.battle = true;
        }
        refreshRooms();
    })

    socket.on('shoot', function (data) {
        var room = _.findWhere(rooms, {id: data.roomId});
        var enemy = _.find(room.players, function (player) {
            return player.name !== data.playerName;
        });

        if (room.currentPlayerMove === data.playerName) {
            room.currentPlayerMove = enemy.name;
            socket.broadcast.emit('shoot', data);
        }
    });

    socket.on('zatopiony', function (data) {
        socket.broadcast.emit('zatopiony', data);
    });

    socket.on('trafiony', function (data) {
        socket.broadcast.emit('trafiony', data);
    });

    socket.on('pudlo', function (data) {
        socket.broadcast.emit('pudlo', data);
    });

    socket.on('game_over', function (data) {
        var room = _.findWhere(rooms, {id: data.roomId});
        room.battle = false;
        _.each(room.players, function (el) {
            el.isReady = false;
        });
        refreshRooms();
        socket.emit('game_over', data);
        socket.broadcast.emit('game_over', data);
    });

    socket.on('revenge_ready', function (roomId) {
        var room = _.findWhere(rooms, {id: roomId});

        if (checkRoomReady(room)) {
            _.each(room.players, function (el) {
                el.isReady = false;
            });
            socket.broadcast.emit('revenge', room);
            socket.emit('revenge', room);
        }
        refreshRooms();
    });

    socket.on('enemy_disconnected', function (data) {
        socket.broadcast.emit('show_enemy_decision', data);
    });

    socket.on('disconnect', function () {
        deletePlayer(userName);
        refreshRooms();
    });
});

function getFreeName() {
    var name = catNames.random();

    var roomWithThisName = _.findWhere(rooms, {name: name});

    if (roomWithThisName) {
        return getFreeName();
    } else {
        return name;
    }
}

function createRoom() {
    return {
        id: _.uniqueId(),
        name: getFreeName(),
        players: [],
        free: true,
        battle: false
    };
}

app.use(express.static('client/dist'));

var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log("App listen on " + port)
});