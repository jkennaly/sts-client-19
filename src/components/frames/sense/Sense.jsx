// Sense.jsx
// Components/Frames/Sense



import m from 'mithril'
import _ from 'lodash'

import List from './matrix/List.jsx'
import Voxel from './matrix/ThirdPerson.jsx'



const Sense = {
		
		view ({attrs}) { return <div class="sts-frame-sense">

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
					newContext={attrs.newContext}
				/> :
				''
			}
		</div>}
}
export default Sense;