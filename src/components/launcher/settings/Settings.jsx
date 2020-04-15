// Settings.jsx
// components/launcher/settings


import m from 'mithril'
import _ from 'lodash'

import ButtonSaveCancel from  '../../elements/ButtonSaveCancel.jsx'

import {getAll as getSettings, setAll as saveSettings} from  '../../../services/settings'

import Numeric from  './Numeric.jsx'
import Text from  './Text.jsx'




const Settings = (vnode) => {
	let settings = getSettings()
	return {
		//onupdate: () => console.log('Settings update'),
	view: ({attrs}) => <div class="main-stage">
		{
			_.values(settings)
				.map(setting => {
					return setting.type === 'Numeric' ? <Numeric setting={setting} update={val => console.dir('Numeric', val) ||( settings[val.name].value = val.value)}  /> : 
					setting.type === 'Text' ? <Text setting={setting} update={val => console.dir('Text', val) ||( settings[val.name].value = val.value)}  /> : 
					''
				})
		}
		<ButtonSaveCancel save={e => {
			//console.dir('Save Settings', settings)
			saveSettings(settings)
			//console.dir('Save Settings check', getSettings())
			
			m.route.set('/launcher')
		}} cancel={e => {
			settings = getSettings()
			m.route.set('/launcher')
		}} />

	</div>
}}
export default Settings;
