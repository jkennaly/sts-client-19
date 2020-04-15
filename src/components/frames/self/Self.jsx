// Self.jsx
// components/frames/Self


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'

const clicked = cards => clickedId => _.forEach(cards, card => card.id === clickedId && card.focus.set() || card.focus.clear() || true)
const Self = (vnode) => {
	let currentCardClick = clicked(_.filter(vnode.attrs.cards, c => c))
	return {
		onupdate: ({attrs}) => currentCardClick = clicked(_.filter(attrs.cards, c => c)),
		view: ({attrs}) => <div class="sts-frame-self">
			<h1>Self</h1>
			{
				//console.dir('Self selfCards', attrs.cards)
			}
			<Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.game.id, subject: attrs.cards.game}} 
				text={'' + attrs.cards.game.currentTick}
			/>
			<Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.player.id, subject: attrs.cards.player}} 
			/>
			{attrs.cards.avatar ? <Card 
				clickFunction={currentCardClick}
				card={{key: attrs.cards.avatar.id, subject: attrs.cards.avatar}} 
			/> : ''}


	</div>
}}
export default Self;