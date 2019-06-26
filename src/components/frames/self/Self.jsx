// Self.jsx
// components/frames/Self


import m from 'mithril'
import _ from 'lodash'

import Player from '../../../store/entity/player/Player.js'


const Self = (vnode) => {
	var self = new Player()
	return {
		view: () => <div class="frame-self">
			<h1>Self</h1>
			<embed 
				name={"self-layout" }
				id={"self-layout" }
				src={"img/GoldTypographyQuestion.svg"}
				width={"100%"}
				/>


	</div>
}}
export default Self;