// TextEntryModal.jsx
// components/modals


import m from 'mithril'
import _ from 'lodash'

// change selections
import Button from '../elements/Button.jsx';

const classes = attrs => 'sts-modal ' + (attrs.display ? '' : 'hidden')
var textValue = ''
const TextEntryModal = {
	view: ({attrs}) => <div class={classes(attrs)}>
        <div class="sts-modal-content">
            <div>{attrs.prompt}</div>
            <input type="text" onchange={e => textValue = e.target.value}/>
            <Button action={e => {
                attrs.hide()

            }} buttonName="Cancel" />
            <Button action={e => {
                attrs.hide()
                attrs.action(textValue)
            }} buttonName="Accept" />
        </div>
    </div>
};

export default TextEntryModal;