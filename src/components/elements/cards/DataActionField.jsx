// DataActionField.jsx
// components/elements/cards

import m from 'mithril'



const DataActionField = {
  view: ({ attrs }) => <div class="sts-vertical-fields">
    <div class="sts-fields">
      {attrs.data.name}
    </div>
    <div class="sts-fields-minor">
      {attrs.data.text}
    </div>
  </div>
};

export default DataActionField;
