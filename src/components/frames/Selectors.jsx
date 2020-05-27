// Selectors.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'
import Active from './active/Active.jsx'
import Self from './self/Self.jsx'
import SenseBar from './sense/SenseBar.jsx'


const Selectors = {
		view: ({children, attrs}) => <div class="sts-frame-main">
			<Self 
				cards={attrs.cards.self} 
				focus={attrs.focus.self} 
				action={attrs.action.self}
				endAction={attrs.endAction.self}
			/> 
			<Active 
				cards={attrs.cards.active} 
				focus={attrs.focus.active}
				action={attrs.action.active}
				endAction={attrs.endAction.active}
			/>
			<SenseBar 
				clickObject={{
					cards: attrs.cards.sense,
					focus: attrs.focus.sense,
					addFocus: attrs.addFocus,
					removeFocus: attrs.removeFocus,
					setFocus: attrs.setFocus,
					playOn: attrs.playOn,
					playOff: attrs.playOff
				}} 
				cards={attrs.cards.sense} 
				valid={attrs.valid} 
				focus={attrs.focus.sense}
			>
				<h1>Sense</h1>
			</SenseBar>
			{children}
			 
	    </div>

}
export default Selectors;
