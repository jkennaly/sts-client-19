// App.jsx
// Components/Layout

import m from 'mithril';
import Launcher from '../launcher/Launcher.jsx'
import Game from '../frames/Game.jsx'


const WelcomeView = () => [
	<h1 class="app-title">Science</h1>
];

const App = {
	oncreate: (vnode) => {
		const mainStage = vnode.dom.querySelector("#main-stage");

		m.route(mainStage, "/launcher", {
			"/launcher": {
				onmatch: Launcher

			},
			"/game": {
				onmatch: Game

			}
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