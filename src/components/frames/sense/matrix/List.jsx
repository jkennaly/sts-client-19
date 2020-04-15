// List.jsx
// Components/Frames/Sense


import m from 'mithril'
import _ from 'lodash'

import Card from '../../../elements/cards/Card.jsx'

const List = (vnode) => {
	return {
		view: ({attrs}) => <div>
			{

				attrs.cards
					.filter(c => attrs.senses.filter(s => attrs.validSenses.find(v => s.id === v.id)).find(sense => sense.focus.value && c.profiles.find(p => p.value === sense.value)))
					.map(c => <Card 
						clickFunction={() => {
							if(!attrs.action) return
							//add action to queue with the card as target
							//console.dir('Sense clicked action', attrs.action, c)
							attrs.action.action(attrs.engine)(c.id)
							attrs.endAction()
						}} 
						card={{key: c.id, subject:c}} 
						targetable={Boolean(attrs.action && c.profiles.find(p => attrs.action.targetable(p, c.effects)))}
					/>)
			}
		</div>
}}
export default List;