// SenseBar.jsx
// Components/Frames/SenseBar


import m from 'mithril'
import _ from 'lodash'

import Card from '../../elements/cards/Card.jsx'


const SenseBar = (vnode) => {
	return {
		//onupdate: () => console.log('Sense update'),
	view: ({attrs, children}) => <div class="sts-sense-bar">
		{children}
			{

				attrs.cards.map(c => <Card 
					clickFunction={attrs.clickFunction} 
					card={{key: c.id, subject:c}} 
					valid={Boolean(attrs.valid.find(v => v.id === c.id))} 
					focus={attrs.focus.includes(c.id)}
				/>)
			}
	</div>
}}
export default SenseBar