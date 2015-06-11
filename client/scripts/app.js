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

var shipsSizes = [2, 2];//, 3, 3, 4, 5];
var currentRoom;
var myName;

var cellSize = 50;
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

    var $gameScreenSpinner = $gameScreenBtns.find('#waiting-for-enemy');
    var $backToRoomsBtn = $gameScreenBtns.find("#bTRL");
    var $turnDiv = $gameScreen.find('#your-turn');

    var $gameScreenRes = $gameScreen.find('#game-screen-results');
    var gameResultDiv = $gameScreenRes.find('#result');
    var $backToRoomsBtnRevenge = $gameScreenRes.find('#bTH');
    var $decisionBar = $gameScreenRes.find("#revengeDecision");
    var $resultsSpinner = $gameScreenRes.find("#waiting-for-revenge");

    socket.on('rooms_refreshed', function (rooms) {
        var $rooms = rooms.map(function (room, idx) {
            var $li = $('<li>');

            var $label = $('<span>');
            $label.text(room.name);

            var $players = $('<span>');

            if (room.players.length === 1) {
                $players.text(' ' + room.players[0].name + ' is waiting for opponent');
            } else if (room.players.length === 2) {
                $players.text(_.pluck(room.players, ' name').join(" vs "));
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
            if (currentRoom.currentPlayerMove === myName) {
                $turnDiv.show();
            }
            startBattle();
        }
    });

    socket.on('revenge', function (room) {
        if (currentRoom && room.id === currentRoom.id) {
            var $revengeBtn = $gameScreenRes.find('input[name="revenge"]')
            $revengeBtn.prop("disabled", false);
            gameResultDiv.removeClass();
            gameResultDiv.text('');
            $resultsSpinner.hide();
            showRevengeGame();
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
            var $b = $(data.bounds);
            var $c = $(data.coord);

            $.each($b, function (idx, coordinate) {
                var $coordinate = $(coordinate);
                var x = $coordinate[0];
                var y = $coordinate[1];
                if ((x > -1 && y > -1) && (x < 10 && y < 10)) {
                    $enemyBoard.append(createShootMarker(x, y, 'X'));
                }
            });
        }
    });

    socket.on('pudlo', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName !== myName) {
            $enemyBoard.append(createShootMarker(data.x, data.y, 'X'));
        }
    });

    socket.on('game_over', function (data) {
        if (currentRoom && data.roomId === currentRoom.id) {

            $playerBoard.hide();
            $enemyBoardContainer.hide();
            $decisionBar.hide();
            $turnDiv.hide();

            if (data.playerName !== myName) {
                gameResultDiv.addClass("alert alert-success");
                gameResultDiv.text("Congratulations! You win!");
            } else {
                gameResultDiv.addClass("alert alert-danger");
                gameResultDiv.text("Unfortunately! You lose!");
            }

            $gameScreenRes.show();

            var $revengeBtn = $gameScreenRes.find('input[name="revenge"]');
            $revengeBtn.on('click', function () {
                socket.emit('revenge_ready', currentRoom.id);
                $resultsSpinner.show();
                $revengeBtn.prop("disabled", true);
            });

            var $disconnectBtn = $gameScreenRes.find('input[name="disconnect"]');
            $disconnectBtn.on('click', function () {
                socket.disconnect();
                socket.emit('enemy_disconnected', data);
                window.location = "/";
            });

            $backToRoomsBtnRevenge.on('click', function () {
                $gameScreen.hide();
                $gameScreenRes.hide();
                socket.disconnect();
                socket.connect();
                socket.emit('enemy_disconnected', data);
                socket.emit('register_name', myName);
            });
        }
    });

    socket.on('shoot', function (data) {
        if (!currentRoom)
            return;

        if (data.roomId === currentRoom.id && data.playerName !== myName) {
            var $ships = $playerBoard.find('.ship');
            var x = data.x;
            var y = data.y;

            $turnDiv.show();

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
                $playerBoard.append(createShootMarker(x, y, '?'));
                socket.emit('trafiony', {
                    roomId: currentRoom.id,
                    playerName: myName,
                    x: x,
                    y: y
                });
                if (hitCount === shipSize) {
                    var $boundsSunkShip = $hitShip.data('collisionBounds');

                    $playerBoard.append(createShootMarker(x, y, '!'));
                    socket.emit('zatopiony', {
                        roomId: currentRoom.id,
                        playerName: myName,
                        x: x,
                        y: y,
                        bounds: $boundsSunkShip,
                        coord: coordinates
                    });

                    $.each($boundsSunkShip, function (idx, coordinate) {
                        console.log(coordinate);
                        var $coordinate = $(coordinate);
                        var x = $coordinate[0];
                        var y = $coordinate[1];
                        if ((x > -1 && y > -1) && (x < 10 && y < 10)) {
                            $playerBoard.append(createShootMarker(x, y, 'X'));
                        }
                    });

                    $hitShip.remove();

                    if ($playerBoard.find('.ship').length === 0) {
                        socket.emit('game_over', {
                            roomId: currentRoom.id,
                            playerName: myName
                        });
                    }
                }
            } else {
                $playerBoard.append(createShootMarker(x, y, 'X'));
                socket.emit('pudlo', {
                    roomId: currentRoom.id,
                    playerName: myName,
                    x: x,
                    y: y
                });
            }
        }
    });

    socket.on('show_enemy_decision', function (data) {
        if (currentRoom && data.roomId === currentRoom.id && data.playerName === myName) {
            $decisionBar.show();
            $decisionBar.text("Your enemy disconnected! Please leave the room!")
            $decisionBar.addClass("alert alert-warning")
        }
    });

    function createShootMarker(x, y, text) {

        var $shoot = $('<div class="shoot">');

        if (text === 'X') {
            $shoot.attr('id', 'miss');
        } else if (text === '?') {
            $shoot.attr('id', 'hit')
        } else if (text === '!') {
            $shoot.attr('id', 'sunk')
        }

        $shoot.css({
            left: x * cellSize,
            top: y * cellSize
        });
        return $shoot;
    }

    function backToRooms() {
        $backToRoomsBtn.on('click', function () {
            $gameScreen.hide();
            $gameScreenSpinner.hide();
            socket.disconnect();
            socket.connect();
            socket.emit('register_name', myName);
        });
    }

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
        $playerBoard.show();
        $shipDock.show();
        $backToRoomsBtn.prop('disabled', false);
        $gameScreenBtns.show();

        preparePlayerBoard();
        prepareEnemyBoard();
        prepareShipDock();
    }

    function showRevengeGame() {
        preparePlayerBoard();
        prepareEnemyBoard();

        prepareShipDock();
        $gameScreenRes.hide();
        $playerBoard.show();
        $shipDock.show();
        $gameScreenBtns.show();
        $gameScreen.show();
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
                        left: obj.offset.left - cellSize,
                        top: obj.offset.top - cellSize
                    });
                }
            }
        });
    }

    function prepareEnemyBoard() {

        var $cells = _.range(0, 100).map(function (idx) {
            var $cell = $('<div class="cell">');

            $cell.on('click', function () {
                $turnDiv.hide();
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

            var $rotateButton = $('<div class="rotate-button glyphicon glyphicon-refresh">');

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
                        return coordinate[0] > 9 || coordinate[1] > 9;
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
                $ship.css('background', 'lightgrey');
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
        var $readyBtn = $gameScreenBtns.find('input[name="ready"]');
        $readyBtn.on('click', function () {
            socket.emit('im_ready', currentRoom.id);
            $backToRoomsBtn.prop('disabled', true);
            $readyBtn.prop('disabled', true);
            $gameScreenSpinner.show();
            disableDragAndRotation();
        });

        $readyBtn.prop('disabled', !ready);
    }

    function disableDragAndRotation() {
        var $ships = $playerBoard.find('.ship');

        $ships.each(function (idx, el) {
            $(el).draggable('disable');
            $(el).find('.rotate-button').off('click');
        });
    }

    function startBattle() {
        $enemyBoardContainer.show();
        $shipDock.hide();
        $gameScreenBtns.hide();
        $gameScreenSpinner.hide();
    }

    showLogin();
    backToRooms();
});
