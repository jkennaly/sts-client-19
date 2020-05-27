// Active.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'

const clicked = (cards, focus, action = () => true, endAction = () => true) => clickedId => _.forEach(cards, card => {
	if(card.id === clickedId && !focus.some(f => f === card.id)) {
		//console.dir('Active clicked action', action)
		action(card)
	}
	else {
		endAction(card)

	}

})
const Active = (vnode) => {
	let currentCardClick = clicked(vnode.attrs.cards, vnode.attrs.focus, vnode.attrs.action)
	return {
		onupdate: ({attrs}) => currentCardClick = clicked(attrs.cards, attrs.focus, attrs.action, attrs.endAction),
	view: ({attrs}) => <div class={`sts-select-bar ${attrs.hidden ? 'hidden' : ''}`}>
		<h1>Action</h1>
		{
			attrs.cards.map(c => <Card 
				clickFunction={currentCardClick} 
				card={{key: c.id, subject:c}} 
				focus={attrs.focus.some(f => f === c.id)}
			/>)
		}

	</div>
}}
export default Active