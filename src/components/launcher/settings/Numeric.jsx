// Numeric.jsx
// components/launcher/settings


import m from 'mithril'
import _ from 'lodash'



const Numeric = (vnode) => {
	return {
		//onupdate: () => console.log('Numeric update'),
	view: ({attrs}) => <div class="sts-setting">
		<label for={attrs.setting.id} class="sts-setting-tag">
			{attrs.setting.tag}
		</label>
		<input 
			type="number" 
			id={attrs.setting.id} 
			name={attrs.setting.name} 
			class="sts-input-numeric"
			value={attrs.setting.value}
			onchange={e => attrs.update({name: attrs.setting.name, value: e.target.value})}
		/>
	</div>
}}
export default Numeric;
