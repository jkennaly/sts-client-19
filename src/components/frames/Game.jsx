// Game.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'
import Demo from '../elements/Demo.jsx'
import Button from  '../elements/Button.jsx'

import Active from './active/Active.jsx'
import Self from './self/Self.jsx'
import Sense from './sense/Sense.jsx'

import TextEntryModal from '../modals/TextEntryModal.jsx';

import {Game as GameCon} from '../../store/entity/diffuse/Game'
import Divine from '../../store/entity/discrete/Divine'
import Entity from '../../store/entity/Entity'
import ActionClass from '../../store/action/ActionClass'
import Place from '../../store/entity/place/Place'


import {getOne as getPlayer} from  '../../services/vm/players'
import {getOne as getPlace, getAll as getPlaces, registerGame, createSetpieces as createPlaces} from  '../../services/vm/places'
import {getAll as getSettings} from  '../../services/settings'
import engine from  '../../services/engine/engine'


let game, universe, player1, starters, activeCards, avatar, activeAction
const player1Cards = () => {return {game:game, player:player1, avatar: avatar}}
let modalData = {
	prompt: '',
	display: false,
	action: newText => 0,
	hide: () => false
}
const notify = gameState => {
	game = _.isEqual(game, gameState.game) ? game : gameState.game
	player1 = _.isEqual(player1, gameState.player1) || !gameState.player1 ? player1 : gameState.player1
	avatar = _.isEqual(avatar, gameState.avatar) ? avatar : gameState.avatar
	//player1Cards = {game:game, player:player1, avatar: avatar}
	//console.dir('Game notify gameState', gameState, player1Cards.avatar)
	//console.dir('Game notify', game.currentTick, player1Cards.game.currentTick)
	m.redraw()
}
let selfFocusIds = []
let senseFocusIds = []
let actionFocusIds = []
const Game = {
		oncreate: ({attrs}) => {		//console.dir('Game started')
	
	//make sure game has a player
	//make sure player has a place
	const settings = getSettings()
	try {
		game = new GameCon(settings)
		const registered = registerGame(_.cloneDeep(game))
		//console.dir('Game game made', game, registered)
		universe = getPlace({baseId: game.id, targetScale: 1})
		player1 = getPlayer(undefined, universe)
		starters = game.scenario.starterFunc({
			Divine: Divine, 
			Entity: Entity,
			ActionClass: ActionClass,
			createPlaces: createPlaces, 
			getPlace: getPlace, 
			universe: universe
		})
		starters.entities = [game, player1, ...starters.entities, ...getPlaces()]
		selfFocusIds = [player1.id]
		activeCards = []
		avatar = undefined
		activeAction = undefined
		engine.start(starters, notify)
	} catch (err) {
		console.error(err)
		m.route.set('/launcher')
	}
	//console.dir('player', player1)
	//console.dir('Game universe made')
	//player1Cards = {game:game, player:player1, avatar: avatar}
	//setFocusOptions(player1Cards)
	//setSelfFocus(player1.id)
	//console.dir('Game player1Cards', player1Cards)
			//console.dir('Game oncreate')
			//game = new GameCon()
			//player1Cards = {game:game, player:player1}
		},
		view: () => <div class="sts-frame-game">
		{console.dir('Game', m.route.get(), window.innerWidth)}
			{window && window.innerWidth <= 480 || global.nw || /\/(launcher|settings)$/.test(m.route.get()) ? '' : <Demo />}
		
			{
				//console.dir('Game.jsx', player1Cards(), game)
			}
			{game ? <Self 
				cards={player1Cards()} 
				focus={selfFocusIds} 
				action={c => {
					selfFocusIds = _.uniq([...selfFocusIds, c.id])
					//console.dir('Game.jsx self action', selfFocusIds)

				}}
				endAction={c => {
					selfFocusIds = selfFocusIds.filter(afi => afi !== c.id)
					//console.dir('Game.jsx self endAction', selfFocusIds)

				}}
			/> : ''}
			{game ? <Active 
				cards={[..._.get(_.find(player1Cards(), c => c && selfFocusIds.some(f => f === c.id)), 'actions', []), ..._.get(_.find(player1Cards(), c => c && selfFocusIds.some(f => f === c.id)), 'conferredActions', [])].filter(c => !c.display)} 
				focus={actionFocusIds}
				action={actionCard => {
					actionFocusIds = _.uniq([...actionFocusIds, actionCard.id])
					return activeAction = actionCard

				}}
				endAction={c => {
					actionFocusIds = actionFocusIds.filter(afi => afi !== c.id)
					activeAction = undefined

				}}
			/> : ''}
			{game ? <div class="sts-frame-main">
				
				<Sense 
					cards={engine.gameState().entities} 
					senses={
						_.flatMap(player1Cards(), c => c ? c.senses : [])
					}
					validSenses={
						_.filter(player1Cards(), c => c && selfFocusIds.some(f => f === c.id))
							.flatMap(c => c.senses)
					}
					selectedSenses={
						_.filter(player1Cards(), c => c && selfFocusIds.some(f => f === c.id))
							//.map(x => console.log('selectedSenses player1Cards()', x) || x)
							.flatMap(c => c.senses)
							.filter(s => senseFocusIds.includes(s.id))
					}
					action={c => {
						senseFocusIds = _.uniq([...senseFocusIds, c.id])
						//console.dir('Game.jsx sense action', senseFocusIds)

					}}
					setFocus={c => {
						senseFocusIds = [c.id]
						//m.redraw()
						//console.dir('Game.jsx sense action', senseFocusIds)

					}}
					addFocus={c => {
						senseFocusIds = _.uniq([...senseFocusIds, c.id])
						//m.redraw()
						//console.dir('Game.jsx sense action', senseFocusIds)

					}}
					removeFocus={c => {
						senseFocusIds = senseFocusIds.filter(afi => afi !== c.id)
						activeAction = undefined
						//m.redraw()

					}}
					activeAction={activeAction}
					endAction={c => {
						senseFocusIds = senseFocusIds.filter(afi => afi !== c.id)
						activeAction = undefined

					}}
					engine={engine}
					scenario={_.get(game, 'scenario')}
					focus={senseFocusIds}
					sensor={_.get(player1Cards(), 'avatar')}
					place={engine.getById(_.get(_.get(player1Cards(), 'avatar'), 'place'))}
				/>
			</div> : ''}
				<TextEntryModal 
					prompt={modalData.prompt}
					display={modalData.display} 
					action={modalData.action}
					hide={modalData.hide}
				/>
			 
	    </div>,
	    onremove: () => engine.stop()

}
export default Game;
