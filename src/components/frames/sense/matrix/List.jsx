// List.jsx
// Components/Frames/Sense


import m from 'mithril'
import _ from 'lodash'

import Card from '../../../elements/cards/Card.jsx'

const List = (vnode) => {
	return {
		view: ({attrs}) => <div>
		{
			//console.dir('List cards', attrs.cards)
		}
			{

				attrs.cards
					.filter(c => attrs.senses.filter(s => attrs.validSenses.find(v => s.id === v.id)).find(sense => attrs.focus.includes(sense.id) && c.profiles.find(p => p.value === sense.value)))
					.map(c => <Card 
						clickFunction={() => {
							if(!attrs.activeAction) return
							//add action to queue with the card as target
							//console.dir('Sense clicked action', attrs.activeAction, c)
							attrs.activeAction.action(attrs.engine)(c.id)
							attrs.endAction(c)
						}} 
						card={{key: c.id, subject:c}} 
						targetable={Boolean(attrs.activeAction && c.profiles.find(p => attrs.activeAction.targetable(p, c.effects)))}
					/>)
			}
		</div>
}}
export default List;