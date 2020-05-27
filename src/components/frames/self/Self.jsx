// Self.jsx
// components/frames/Self


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'

//const clicked = cards => clickedId => _.forEach(cards, card => card.id === clickedId && (card.focus.value = true) || (card.focus.value = false) || true)
const clicked = (cards, focus, action = () => true, endAction = () => true) => clickedId => _.forEach(cards, card => {
	//console.dir('Self clicked', clickedId, card)
	if(card.id === clickedId && !focus.some(f => f === card.id)) {
		//console.dir('Self clicked action', clickedId, focus, card)
		action(card)
	}
	else {
		//console.dir('Self clicked endAction', clickedId, focus, card)
		endAction(card)

	}

})
const Self = (vnode) => {
	let currentCardClick = clicked(_.filter(vnode.attrs.cards, c => c), vnode.attrs.focus, vnode.attrs.action, vnode.attrs.endAction)
	return {
		onupdate: ({attrs}) => currentCardClick = clicked(_.filter(attrs.cards, c => c), attrs.focus, attrs.action, attrs.endAction),
		view: ({attrs}) => <div class={`sts-select-bar ${attrs.hidden ? 'hidden' : ''}`}>
			<h1>Self</h1>
			{
				//console.dir('Self selfCards', attrs.cards)
			}
			<Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.game.id, subject: attrs.cards.game}} 
				text={'' + attrs.cards.game.currentTick}
				focus={attrs.focus.some(f => f === attrs.cards.game.id)}
			/>
			<Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.player.id, subject: attrs.cards.player}} 
				focus={attrs.focus.some(f => f === attrs.cards.player.id)}
			/>
			{attrs.cards.avatar ? <Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.avatar.id, subject: attrs.cards.avatar}} 
				focus={attrs.focus.some(f => f === attrs.cards.avatar.id)}
			/> : ''}


	</div>
}}
export default Self;