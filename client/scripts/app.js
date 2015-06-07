"use strict";

var _ = require('lodash');
var $ = require('jquery');

require('jquery-ui/draggable');
require('jquery-ui/droppable');

window.jQuery = $;

require("bootstrap-webpack");
require('./../styles/main.less');

var io = require('socket.io-client');

var socket = io();

var shipsSizes = [2, 2, 3, 3, 4, 5];
var currentRoom;
var myName;

var cellSize = 30;
var padding = 4;


$(function () {
    var $loginScreen = $('#login-screen');
    var $roomListScreen = $('#room-list-screen');
    var $gameScreen = $('#game-screen');


    var $nickInput = $loginScreen.find('input[name="nick"]');
    var $saveBtn = $loginScreen.find('input[name="save"]');
    var $loginForm = $loginScreen.find('#login-form');

    var $roomList = $roomListScreen.find('#room-list');

    var $playerBoard = $gameScreen.find('#player-board');
    var $shipDock = $gameScreen.find('#ship-dock');
    var $enemyBoard = $gameScreen.find('#enemy-board');
    var $enemyBoardContainer = $gameScreen.find('#enemy-board-container');
    var $gameScreenBtns = $gameScreen.find('#game-screen-buttons');
    var $gameScreenSpinner = $gameScreen.find('#game-screen-buttons #waiting-for-enemy');

    socket.on('rooms_refreshed', function (rooms) {
        var $rooms = rooms.map(function (room, idx) {
            var $li = $('<li>');

            var $label = $('<span>');
            $label.text(room.name);

            var $players = $('<span>');

            if (room.players.length === 1) {
                $players.text(room.players[0].name + ' is waiting for oponent');
            } else if (room.players.length === 2) {
                $players.text(_.pluck(room.players, 'name').join(" vs "));
            } else {
                $players.text(' (empty) ');
            }

            var $button = $('<input type="button" class="btn btn-primary" name="join" value="Join"/>');
            $button.prop('disabled', !room.free);

            $li.append($label);
            $li.append($players);
            $li.append($button);

            $li.attr('room-id', room.id);

            $button.on('click', function () {
                socket.emit('join_room', room.id);
            });

            return $li
        });
        $roomList.empty();
        $roomList.append($rooms);
    });

    socket.on('register_name_ok', function (name) {
        console.log('register_name_ok');
        myName = name;
        $saveBtn.prop('disabled', true);
        $loginForm.toggleClass('has-success', true);
        $loginForm.toggleClass('has-error', false);
        $loginForm.find('.validation-msg').text('');
        showRooms();
    });

    socket.on('register_name_err', function () {
        console.log('register_name_err');
        $saveBtn.prop('disabled', false);

        $loginForm.toggleClass('has-success', false);
        $loginForm.toggleClass('has-error', true);
        $loginForm.find('.validation-msg').text('Invalid login');
    });

    socket.on('room_full', function (roomId) {
        var selector = 'li[room-id=' + roomId + ']';
        var $room = $roomList.find(selector);

        var $joinBtn = $room.find('input[name="join"]');

        $joinBtn.prop('disabled', true);
    });

    socket.on('joined', function (room) {
        console.log('joined', room);
        currentRoom = room;
        showGame(room);
    });

    socket.on('begin_battle', function (room) {
        console.log('begin_battle', room);
        if (currentRoom && room.id === currentRoom.id) {
            currentRoom = room;
            startBattle();
        }
    });

    socket.on('trafiony', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName !== myName) {
            $enemyBoard.append(createShootMarker(data.x, data.y, '?'));
        }
    });

    socket.on('zatopiony', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName !== myName) {
            $enemyBoard.append(createShootMarker(data.x, data.y, '!'));
        }
    });

    socket.on('pudlo', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName !== myName) {
            $enemyBoard.append(createShootMarker(data.x, data.y, 'X'));
        }
    });

    socket.on('game_over', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName !== myName) {
            alert('Wygrales');
        }
    });





    function createShootMarker(x, y, text) {
        var $shoot = $('<div class="shoot">');

        $shoot.text(text);

        $shoot.css({
            left: x * cellSize,
            top: y * cellSize
        });
        return $shoot;
    }

    socket.on('shoot', function (data) {
        if (!currentRoom)
            return;

        if (data.roomId === currentRoom.id && data.playerName !== myName) {
            var $ships = $playerBoard.find('.ship');
            var x = data.x;
            var y = data.y;


            $playerBoard.append(createShootMarker(x, y));

            var $hitShip;

            $ships.each(function (idx, el) {
                var $ship = $(el);
                var coordinates = $ship.data('coordinates');
                var currentHits = coordinates.map(function (coord) {
                    return coord[0] === data.x && coord[1] === data.y
                });

                if (_.any(currentHits)) {
                    $hitShip = $ship;
                }
            });


            if ($hitShip) {
                var coordinates = $hitShip.data('coordinates');
                var hitCount = $hitShip.data('hitCount') || 0;
                var shipSize = coordinates.length;

                hitCount = hitCount + 1;
                $hitShip.data('hitCount', hitCount);

                socket.emit('trafiony', {
                    roomId: currentRoom.id,
                    playerName: myName,
                    x: x,
                    y: y
                });
                if (hitCount === shipSize) {
                    socket.emit('zatopiony', {
                        roomId: currentRoom.id,
                        playerName: myName,
                        x: x,
                        y: y
                    });

                    $hitShip.remove();

                    if($playerBoard.find('.ship').length === 0){
                        socket.emit('game_over', {
                            roomId : currentRoom.id,
                            playerName : myName
                        });
                    }

                }
            } else {
                socket.emit('pudlo', {
                    roomId: currentRoom.id,
                    playerName: myName,
                    x: x,
                    y: y
                });
            }
        }
    });


    function showLogin() {
        socket.emit('refresh_rooms');
        $loginScreen.show();

        $saveBtn.on('click', function () {
            socket.emit('register_name', $nickInput.val());
        });
    }

    function showGame() {
        $loginScreen.hide();
        $roomListScreen.hide();
        $gameScreen.show();


        preparePlayerBoard();
        prepareEnemyBoard();
        prepareShipDock();
    }

    function showRooms() {
        $loginScreen.hide();
        $roomListScreen.show();
    }


    function preparePlayerBoard() {

        var $cells = _.range(0, 100).map(function (idx) {
            var $cell = $('<div class="cell">');

            // $cell.attr('x', idx % 10);
            // $cell.attr('y', (idx - idx % 10) / 10);

            return $cell;
        });

        $playerBoard.empty();
        $playerBoard.append($cells);

        $playerBoard.droppable({
            drop: function (ev, obj) {
                var $ship = obj.draggable;

                if (!$ship.parent().is($playerBoard)) {
                    $ship.appendTo($playerBoard);
                    $ship.draggable('option', 'containment', 'parent');

                    $ship.css({
                        'position': 'absolute',
                        left: obj.offset.left,
                        top: obj.offset.top
                    });
                }
            }
        });
    }


    function prepareEnemyBoard() {
        var $cells = _.range(0, 100).map(function (idx) {
            var $cell = $('<div class="cell">');

            $cell.on('click', function () {
                var x = idx % 10;
                var y = (idx - x) / 10;

                socket.emit('shoot', {
                    roomId: currentRoom.id,
                    playerName: myName,
                    x: x,
                    y: y
                });
            });

            return $cell;
        });

        $enemyBoard.empty();
        $enemyBoard.append($cells);
    }

    function prepareShipDock() {

        var $ships = shipsSizes.map(function (shipSize) {

            var $ship = $('<div class="ship">');
            var $inner = $('<div class="inner">');

            $ship.data('hits', []);

            $ship.append($inner);

            $ship.css({width: cellSize, height: (shipSize * cellSize)});

            var $rotateButton = $('<div class="rotate-button">');

            $rotateButton.on('click', function () {
                var currentWidth = $ship.css('width');
                var currentHeight = $ship.css('height');

                $ship.css({height: currentWidth, width: currentHeight});
                calculateCoordinates();
                gameIsReady(!checkCollisions() && shipsOnBoard());
            });

            $ship.append($rotateButton);

            function calculateCoordinates() {
                if ($ship.parent().is($playerBoard)) {

                    var left = parseInt($ship.css('left'), 10) / cellSize;
                    var top = parseInt($ship.css('top'), 10) / cellSize;
                    var height = parseInt($ship.css('height'), 10) / cellSize;
                    var width = parseInt($ship.css('width'), 10) / cellSize;

                    var coordinates = [];
                    var collisionBounds = [];

                    if (height === 1) {
                        coordinates = _.range(0, width).map(function (idx) {
                            return [left + idx, top];
                        });

                        var firstX = coordinates[0][0];
                        var k = -1;
                        while (k <= width) {
                            collisionBounds.push(_.range(top, top + height + 2).map(function (idx) {
                                return [firstX + k, idx - 1]
                            }));
                            k++;
                        }

                    } else {
                        coordinates = _.range(0, height).map(function (idx) {
                            return [left, top + idx];
                        });

                        var firstY = coordinates[0][1];
                        var k = -1;
                        while (k <= height) {
                            collisionBounds.push(_.range(left, left + width + 2).map(function (idx) {
                                return [idx - 1, firstY + k]
                            }));
                            k++;
                        }
                    }

                    collisionBounds = _.flatten(collisionBounds);

                    //console.log(JSON.stringify(coordinates));
                    //console.log(JSON.stringify(collisionBounds));

                    $ship.data('coordinates', coordinates);
                    $ship.data('collisionBounds', collisionBounds);
                }
            }

            $ship.draggable({
                grid: [cellSize, cellSize],
                stop: function () {
                    calculateCoordinates();
                    gameIsReady(!checkCollisions() && shipsOnBoard());
                }
            });

            return $ship
        });

        $shipDock.empty();
        $shipDock.append($ships);
    }

    function checkCollisions() {

        function checkCollision($ship, $ships) {
            var results = [];

            $ships.each(function (idx, el) {
                var $ship2 = $(el);
                if (!$ship.is($ship2)) {
                    var collisionBounds = $ship.data('collisionBounds');
                    var coordinates = $ship2.data('coordinates');

                    results.push(_.any(collisionBounds.map(function (boundsCoordinate) {
                        return _.any(coordinates.map(function (coordinate) {
                            return _.isEqual(coordinate, boundsCoordinate);
                        }));
                    })));
                } else {

                    var thisShipCoordinates = $ship.data('coordinates');
                    var items = thisShipCoordinates.map(function (coordinate) {
                        return coordinate[0] > 10 || coordinate[1] > 10;
                    });


                    results = results.concat(results, items);
                }
            });

            console.log(results)
            return _.any(results);
        }

        var $ships = $playerBoard.find('.ship');

        var collisions = $ships.map(function (idx, el) {
            var $ship = $(el);
            var hasCollision = checkCollision($ship, $ships);

            if (hasCollision) {
                $ship.css('background', 'red');
            } else {
                $ship.css('background', 'black');
            }

            return hasCollision;
        });


        return _.any(collisions);
    }

    function shipsOnBoard() {
        var shipsOnBoardCount = $playerBoard.find('.ship').length;

        return shipsSizes.length === shipsOnBoardCount;
    }

    function gameIsReady(ready) {
        var $readyBtn = $gameScreen.find('input[name="ready"]');

        $readyBtn.on('click', function () {
            socket.emit('im_ready', currentRoom.id);
            $readyBtn.prop('disabled', true);
            $gameScreenSpinner.show();
        });

        $readyBtn.prop('disabled', !ready);
    }

    function startBattle() {
        $enemyBoardContainer.show();
        $shipDock.hide();
        $gameScreenBtns.hide();
    }

    showLogin();
});
