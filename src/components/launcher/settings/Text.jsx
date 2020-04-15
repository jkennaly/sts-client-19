// Text.jsx
// components/launcher/settings


import m from 'mithril'
import _ from 'lodash'



const Text = (vnode) => {
	return {
		//onupdate: () => console.log('Text update'),
	view: ({attrs}) => <div class="sts-setting">
		<label for={attrs.setting.id} class="sts-setting-tag">
			{attrs.setting.tag}
		</label>
		<input 
			type="text" 
			id={attrs.setting.id} 
			name={attrs.setting.name} 
			class="sts-input-text"
			value={attrs.setting.value}
			onchange={e => attrs.update({name: attrs.setting.name, value: e.target.value})}
		/>
	</div>
}}
export default Text;
