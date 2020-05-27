// Card.jsx
// components/elements/cards

import m from 'mithril'
import _ from 'lodash'

import SubjectSquare from './SubjectSquare.jsx'
import DataActionField from './DataActionField.jsx'

const Card = {
  view: ({ attrs }) => <div 
    class={'sts-card' + 
      (attrs.valid === false ? ' sts-card-focus-invalid' : 
        attrs.targetable === true ? ' sts-card-focus-targetable' : 
        attrs.focus === true ? ' sts-card-focus' : 
        '')
    } 
    key={attrs.card.key} 
    onclick={attrs.clickFunction && attrs.valid !== false ? (e => {
      //console.dir('Card click', !_.get(attrs, 'card.subject.effective', true), attrs.card)
      if(!_.get(attrs, 'card.subject.effective', true)) return attrs.card.subject.action()
     return attrs.clickFunction(attrs.card.subject.id)

    }) : e => e}
  >
    <div class="sts-horizontal-fields">
    {
      
      //console.log(attrs.card.subject.value, 'focus', attrs.card.subject.focus.value)
    }
      
      <SubjectSquare text={attrs.card.subject.value} />
      <DataActionField data={{name: attrs.name ? attrs.name: '', text: attrs.text ? attrs.text : ''}} />
      
    </div>
  </div>
}

export default Card
