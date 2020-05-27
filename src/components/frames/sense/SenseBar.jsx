// SenseBar.jsx
// Components/Frames/SenseBar


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'

//let currentCardClick
const clicked = ({cards, focus, addFocus, removeFocus, setFocus, playOn, playOff}) => {
	//console.dir('Sense click setup', focus, cards)
	if(!focus) throw new Error('no senses in selectors')
	return clickedId => _.forEach(cards, card => {
	//console.dir('Sense clicked', card, clickedId)
			if(card.primary) {

		if(card.id === clickedId && !focus.some(f => f === card.id)) {
			//console.dir('Sense clicked action primary setFocus', clickedId, focus, card)
			setFocus(card)
		}
		else if(card.id === clickedId) {
			//console.dir('Sense clicked endAction primary removeFocus', clickedId, focus, card)
			removeFocus(card)
		}
	} else {
		if(card.id === clickedId && !focus.some(f => f === card.id)) {
			//console.dir('Sense clicked action secondary addFocus', clickedId, focus, card)
			addFocus(card)
			playOn()
		}
		else if(card.id === clickedId) {
			//console.dir('Sense clicked endAction secondary removeFocus', clickedId, focus, card)
			removeFocus(card)
			playOff()
		}
	}


})}

const SenseBar = (vnode) => {
	return {
		//onupdate: () => console.log('Sense update'),
/*
	oninit: ({attrs}) => currentCardClick = clicked(attrs),
	onupdate ({attrs}) {
		currentCardClick = clicked(attrs, this)
		//if there is a selectedSense that is not primary, enable sound, otherwise disable

	},
	*/
	view: ({attrs, children}) => <div class="sts-select-bar">
		{children}
			{

				attrs.cards.map(c => <Card 
					clickFunction={clicked(attrs.clickObject)} 
					card={{key: c.id, subject:c}} 
					valid={Boolean(attrs.valid.find(v => v.id === c.id))} 
					focus={attrs.focus.includes(c.id)}
				/>)
			}
	</div>
}}
export default SenseBar