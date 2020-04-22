// Settings.jsx
// components/launcher/settings


import m from 'mithril'
import _ from 'lodash'

import ButtonSaveCancel from  '../../elements/ButtonSaveCancel.jsx'

import {getAll as getSettings, setAll as saveSettings, selectorValues, selectorSet} from  '../../../services/settings'

import Numeric from  './Numeric.jsx'
import Text from  './Text.jsx'
import Selector from  './Selector.jsx'



	let settings

const Settings = {
		//onupdate: () => console.log('Settings update'),
	view: ({attrs}) => <div class="main-stage">
	{
		//console.dir(selectorValues('scenario'))
		//console.dir('Settings check', settings, getSettings())

	}
		{
			_.values(settings = settings || getSettings())
				.map(setting => {
					return setting.type === 'Numeric' ? <Numeric setting={setting} update={val => ( settings[val.name].value = val.value)}  /> : 
					setting.type === 'Text' ? <Text setting={setting} update={val => ( settings[val.name].value = val.value)}  /> : 
					setting.type === 'Selector' ? <Selector setting={setting} update={val => settings[setting.name] = selectorSet(setting.name, val.srcElement.value)}>{_.map(selectorValues(setting.name), v=> <option value={v} selected={v === settings[setting.name].value}>{v}</option>)}</Selector> :
					''
				})
		}
		<ButtonSaveCancel save={e => {
			//console.dir('Save Settings', settings)
			saveSettings(settings)
			//console.dir('Save Settings check', settings, getSettings())
			
			m.route.set('/launcher')
		}} cancel={e => {
			settings = getSettings()
			m.route.set('/launcher')
		}} />
	</div>
}
export default Settings;
