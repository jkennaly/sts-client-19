// Demo.jsx
// Components/Elements

import m from 'mithril'

const Demo = {
  view: ({ attrs }) =>
    <div class="sts-demo">
	    <div class="sts-button-wrapper">
			<a href="https://0441.design/cart/?add-to-cart=18" class="sts-button-link sts-button sts-size-lg" role="button" id="quantize-alpha-buy">
				<span class="sts-button-content-wrapper">
					<span class="sts-button-text">Buy Quantize on Windows/Linux</span>
				</span>
			</a>
		</div>
	    <div class="sts-button-wrapper">
			<a href="https://0441.design/" class="sts-button-link sts-button sts-size-lg" role="button" id="quantize-alpha-buy">
				<span class="sts-button-content-wrapper">
					<span class="sts-button-text">Quit Demo</span>
				</span>
			</a>
		</div>
    </div>
}

export default Demo