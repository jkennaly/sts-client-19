// Sense.jsx
// Components/Frames/Sense



import m from 'mithril'
import _ from 'lodash'

import SenseBar from './SenseBar.jsx'
import List from './matrix/List.jsx'
import Voxel from './matrix/ThirdPerson.jsx'


const clickedD = cards => clickedId => _.forEach(cards, card => (card.id === clickedId && !card.focus.value) && card.focus.set() || (card.id === clickedId && card.focus.value) && card.focus.clear() || true)
const Sense = (vnode) => {
	let currentCardClick = clickedD(vnode.attrs.senses)
	return {
		onupdate: ({attrs}) => currentCardClick = clickedD(attrs.senses),
		view: ({attrs}) => <div class="sts-frame-sense">
			
				<SenseBar 
					clickFunction={currentCardClick} 
					cards={attrs.senses} 
					valid={attrs.validSenses} 
				>
					<h1>Sense</h1>
				</SenseBar>
				{
					attrs.selectedSenses.some(s => s.defaultView === 'list') ? <List 
						cards={attrs.cards} 
						senses={attrs.senses}
						validSenses={attrs.validSenses}
						action={attrs.action}
						endAction={attrs.endAction}
						engine={attrs.engine}
						scenario={attrs.scenario}
					/> :
					attrs.selectedSenses.some(s => s.defaultView === 'voxel') ? <Voxel 
						cards={attrs.cards} 
						senses={attrs.senses}
						validSenses={attrs.validSenses}
						action={attrs.action}
						endAction={attrs.endAction}
						engine={attrs.engine}
						scenario={attrs.scenario}
					/> :
					''
				}
		</div>
}}
export default Sense;