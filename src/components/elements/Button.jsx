// Button.jsx
// Components/Elements

import m from 'mithril'

const Button = {
  view: ({ attrs }) =>
    <div onclick={attrs.action ? e => {e.preventDefault(); attrs.action(e)}: e => {e.preventDefault(); console.log('no action', document.location.origin); document.location.assign(document.location.origin)}} class="ui-button">
      <span>{attrs.buttonName}</span>
    </div>
}

export default Button