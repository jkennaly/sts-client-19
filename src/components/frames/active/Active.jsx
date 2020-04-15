// Active.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'

const clicked = (cards, action = () => true, endAction = () => true) => clickedId => _.forEach(cards, card => {
	if(card.id === clickedId && !card.focus.value) {
		card.focus.set()
		//console.dir('Active clicked action', action)
		action(card)
	}
	else {
		card.focus.clear()
		endAction()

	}

})
const Active = (vnode) => {
	let currentCardClick = clicked(vnode.attrs.cards, vnode.attrs.action)
	return {
		onupdate: ({attrs}) => currentCardClick = clicked(attrs.cards, attrs.action, attrs.endAction),
	view: ({attrs}) => <div class="sts-frame-active">
		<h1>Action</h1>
		{
			attrs.cards.map(c => <Card clickFunction={currentCardClick} card={{key: c.id, subject:c}} />)
		}

	</div>
}}
export default Active