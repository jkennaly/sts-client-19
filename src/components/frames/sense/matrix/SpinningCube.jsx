// SpinningCube.jsx
// Components/Frames/Sense

import m from 'mithril'
import _ from 'lodash'
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh} from 'three';

import Card from '../../../elements/cards/Card.jsx'

function animateRender(renderer, scene, camera, cube) {
	return function animate() {
			window.requestAnimationFrame( animate )
			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01
			renderer.render( scene, camera )
		}
}

	let canvas, scene, camera, renderer, geometry, material, cube
const SpinningCube = {
	oncreate ({dom}) {
		//canvas = dom.querySelector('canvas.app-canvas')
		scene = new Scene()
		camera = new PerspectiveCamera( 75, dom.clientWidth / dom.clientHeight, 0.1, 1000 )
		renderer = new WebGLRenderer()
		renderer.setSize( dom.clientWidth, dom.clientHeight )
		dom.appendChild( renderer.domElement )
		geometry = new BoxGeometry()
		material = new MeshBasicMaterial({color: 0x00ff00})
		cube = new Mesh(geometry, material)
		scene.add(cube)
		camera.position.z = 5

		//console.dir('SpinningCube renderer', renderer)
		animateRender(renderer, scene, camera, cube)()
	},
	view: ({attrs}) => <div class="sts-canvas-wrapper"></div>
}
export default SpinningCube;