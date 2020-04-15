// SubjectSquare.jsx
// components/elements/cards

import m from 'mithril'
import jdenticon from 'jdenticon'



const SubjectSquare = {
	oncreate: () => jdenticon(),
  view: ({ attrs }) => <div class="sts-subject-square"> 
      <svg 
      	class="sts-subject-square-img" 
      	width="40" 
      	height="40" 
      	data-jdenticon-value={attrs.text} 
      />
      <span>{attrs.text}</span>
  </div>
};

export default SubjectSquare;
