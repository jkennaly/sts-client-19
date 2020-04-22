// Selector.jsx
// components/launcher/settings


import m from 'mithril'
import _ from 'lodash'

const Selector = (vnode) => {
	return {
		//onupdate: () => console.log('Selector update'),
	view: ({attrs, children}) => <div class="sts-setting">
		<label for={attrs.setting.id} class="sts-setting-tag">
			{attrs.setting.tag}
		</label>
		<select 
			id={attrs.setting.id} 
			name={attrs.setting.name} 
			class="sts-selector"
			onchange={e => attrs.update(e)}
		>
			{children}
		</select>
	</div>
}}
export default Selector;
