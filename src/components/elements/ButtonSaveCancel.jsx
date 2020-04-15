// ButtonSaveCancel.jsx
// Components/Elements

import m from 'mithril'
import Button from  './Button.jsx'

const ButtonSaveCancel = {
  view: ({ attrs }) => <div class="button-row">
		<Button buttonName={`Cancel`} action={attrs.cancel} />
		<Button buttonName={`Save`} action={attrs.save} />
	</div>
};

export default ButtonSaveCancel;