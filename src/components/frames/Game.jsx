// Game.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'
import Button from  '../elements/Button.jsx'

import Active from './active/Active.jsx'
import Self from './self/Self.jsx'
import Sense from './sense/Sense.jsx'

import TextEntryModal from '../modals/TextEntryModal.jsx';

import {setSelfOptions as setFocusOptions, setSelfFocus} 
	from  '../../services/focus'
import {Game as GameCon} from '../../store/entity/diffuse/Game'
import Divine from '../../store/entity/discrete/Divine'
import Place from '../../store/entity/place/Place'


import {getOne as getPlayer} from  '../../services/vm/players'
import {getOne as getPlace, registerGame} from  '../../services/vm/places'
import {getAll as getSettings} from  '../../services/settings'
import engine from  '../../services/engine/engine'


const Game = (vnode) => {
	//console.dir('Game started')
	
	//make sure game has a player
	//make sure player has a place
	let game, universe, player1, starters
	const settings = getSettings()
	try {
		game = new GameCon(settings)
		const registered = registerGame(_.cloneDeep(game))
		//console.dir('Game game made', game, registered)
		universe = getPlace({baseId: game.id, targetScale: 1})
		player1 = getPlayer(undefined, universe)
		starters = game.scenario.starterFunc({Divine: Divine, getPlace: getPlace, universe: universe})
		player1.focus.set()
	} catch (err) {
		console.error(err)
	}
	let modalData = {
		prompt: '',
		display: false,
		action: newText => 0,
		hide: () => false
	}
	//console.dir('player', player1)
	let senseCards = starters
	let activeCards = []
	let avatar
	let activeAction
	//console.dir('Game universe made')
	let player1Cards = {game:game, player:player1, avatar: avatar}
	const notify = gameState => {
		game = _.isEqual(game, gameState.game) ? game : gameState.game
		player1 = _.isEqual(player1, gameState.player1) || !gameState.player1 ? player1 : gameState.player1
		avatar = _.isEqual(avatar, gameState.avatar) ? avatar : gameState.avatar
		player1Cards = {game:game, player:player1, avatar: avatar}
		//console.dir('Game notify gameState', gameState, player1Cards.avatar)
		//console.dir('Game notify', game.currentTick, player1Cards.game.currentTick)
		m.redraw()
	}
	//setFocusOptions(player1Cards)
	//setSelfFocus(player1.id)
	//console.dir('Game player1Cards', player1Cards)
	return {
		oncreate: ({attrs}) => {
			//console.dir('Game oncreate')
			//game = new GameCon()
			//player1Cards = {game:game, player:player1}
			senseCards = starters
			//console.dir('Game senseCards', senseCards)
			engine.start([game, player1, ...starters], notify)
		},
		view: () => <div class="sts-frame-game">
			{
				//console.dir('Game.jsx', game)
			}
			<Self cards={player1Cards} focus={{}} />
			<Active 
				cards={_.get(_.find(player1Cards, c => c && c.focus.value), 'actions', [])} 
				action={actionCard => activeAction = actionCard}
				endAction={c => activeAction = undefined}
			/>
			<div class="sts-frame-main">
				
				<Sense 
					cards={senseCards} 
					senses={
						_.flatMap(player1Cards, c => c ? c.senses : [])
					}
					validSenses={
						_.filter(player1Cards, c => c && c.focus.value)
							.flatMap(c => c.senses)
					}
					selectedSenses={
						_.filter(player1Cards, c => c && c.focus.value)
							//.map(x => console.log('selectedSenses player1Cards', x) || x)
							.flatMap(c => c.senses)
							.filter(s => s.focus.value)
					}
					action={activeAction}
					endAction={c => activeAction = undefined}
					engine={engine}
					scenario={_.get(game, 'scenario')}
				/>
			</div>
				<TextEntryModal 
					prompt={modalData.prompt}
					display={modalData.display} 
					action={modalData.action}
					hide={modalData.hide}
				/>
			 
	    </div>

}}
export default Game;
