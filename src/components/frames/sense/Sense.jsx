// Sense.jsx
// Components/Frames/Sense



import m from 'mithril'
import _ from 'lodash'

import SenseBar from './SenseBar.jsx'
import List from './matrix/List.jsx'
import Voxel from './matrix/ThirdPerson.jsx'


const clickedD = cards => clickedId => _.forEach(cards, card => (card.id === clickedId && !card.focus.value) && (card.focus.value = true) || (card.id === clickedId && card.focus.value) && (card.focus.value = false) || true)

const clicked = (cards, focus, action = () => true, endAction = () => true) => clickedId => _.forEach(cards, card => {
	if(card.id === clickedId && !focus.some(f => f === card.id)) {
		//console.dir('Sense clicked action', clickedId, focus, card)
		action(card)
	}
	else {
		//console.dir('Sense clicked endAction', clickedId, focus, card)
		endAction(card)

	}

})

const Sense = (vnode) => {
	let currentCardClick = clicked(vnode.attrs.senses, vnode.attrs.focus)
	return {
		onupdate: ({attrs}) => currentCardClick = clicked(attrs.senses, attrs.focus, attrs.action, attrs.endAction),
		view: ({attrs}) => <div class="sts-frame-sense">
			
				<SenseBar 
					clickFunction={currentCardClick} 
					cards={attrs.senses} 
					valid={attrs.validSenses} 
						focus={attrs.focus}
				>
					<h1>Sense</h1>
				</SenseBar>
				{
					attrs.selectedSenses.some(s => s.defaultView === 'list') ? <List 
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
					attrs.selectedSenses.some(s => s.defaultView === 'voxel') ? <Voxel 
						engine={attrs.engine}
						scenario={attrs.scenario}
					/> :
					''
				}
		</div>
}}
export default Sense;