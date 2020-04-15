// game.js
// services/vm

import _ from 'lodash'
import Game from '../../store/entity/diffuse/Game'

let game = new Game()

export function get() {
	return game
}
export function set() {game = new Game()}