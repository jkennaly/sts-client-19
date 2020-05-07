// Sense.jsx
// Components/Frames/Sense



import m from 'mithril'
import _ from 'lodash'

import SenseBar from './SenseBar.jsx'
import List from './matrix/List.jsx'
import Voxel from './matrix/ThirdPerson.jsx'


const clicked = ({senses: cards, focus, addFocus, removeFocus, setFocus}, state) => {
	////console.dir('Sense click setup', cards)
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
			if(!state.playing) state.currentContext.resume()
				state.playing = true
		}
		else if(card.id === clickedId) {
			//console.dir('Sense clicked endAction secondary removeFocus', clickedId, focus, card)
			removeFocus(card)
			if(state.playing) state.currentContext.suspend()
				state.playing = false
		}
	}


})}

const Sense = (vnode) => {
	let currentCardClick = clicked(vnode.attrs)
	return {
		oninit: ({attrs}) => currentCardClick = clicked(attrs),
		onupdate ({attrs}) {
			currentCardClick = clicked(attrs, this)
			//if there is a selectedSense that is not primary, enable sound, otherwise disable

		},
		view ({attrs}) { return <div class="sts-frame-sense">
			<SenseBar 
				clickFunction={currentCardClick} 
				cards={attrs.senses} 
				valid={attrs.validSenses} 
				focus={attrs.focus}
			>
				<h1>Sense</h1>
			</SenseBar>
			{
				//console.dir('Sense attrs.selectedSenses', attrs.selectedSenses)
			}
			{
				attrs.selectedSenses.some(s => s.primary && s.defaultView === 'list') ? <List 
					cards={attrs.cards} 
					senses={attrs.senses}
					validSenses={attrs.validSenses}
					action={attrs.action}
					activeAction={attrs.activeAction}
					endAction={attrs.endAction}
					engine={attrs.engine}
					scenario={attrs.scenario}
					focus={attrs.focus}
				/> :
				attrs.selectedSenses.some(s => s.primary && s.defaultView === 'voxel') ? <Voxel 
					engine={attrs.engine}
					scenario={attrs.scenario}
					place={attrs.place}
					sensor={attrs.sensor}
					newContext={ctx => {

						this.currentContext = ctx
						const startLoud = attrs.selectedSenses.some(s => !s.primary)
						this.playing = startLoud
						if(!startLoud) this.currentContext.suspend()

					}}
				/> :
				''
			}
		</div>}
}}
export default Sense;