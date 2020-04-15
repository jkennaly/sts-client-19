// players.js
// services/vm

import _ from 'lodash'
import Player from '../../store/entity/player/Player'


export function getOne(universe) {return new Player(universe)}
//export function setAll(newPlayers) {players = _.cloneDeep(newPlayers)}
//export function setOne(newPlayer) {players[newPlayer.name] = _.clone(newPlayer)}