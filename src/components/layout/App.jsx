// App.jsx
// Components/Layout

import m from 'mithril';
import Launcher from '../launcher/Launcher.jsx'
import Settings from '../launcher/settings/Settings.jsx'
import Game from '../frames/Game.jsx'


const WelcomeView = () => [
	<h1 class="app-title">Science</h1>
]

//console.log('App')
const App = {
	oncreate: (vnode) => {
		//console.log('App created')
		const mainStage = vnode.dom.querySelector("#main-stage");
		m.route(mainStage, "/launcher", {
			"/launcher": Launcher,
			"/settings": Settings,
			"/game": Game
		});
		//m.mount(document.getElementById("DisplayBar"), DisplayBar)
	},
	view: ({ children }) =>
		<div class="App">
			<div id="main-stage">
				{children}
			</div>
			<div id="DisplayBar" />
		</div>
};

export default App;