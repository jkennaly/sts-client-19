// RPG.js
//services/displays/rpg

import { isWebGLSupported} from 'webgl-detector';
import * as THREE from 'three'
import FBXLoader from 'three-fbxloader-offical'
import _ from 'lodash'

import Preloader from './libs/Preloader'
import SFX from './libs/SFX'
import JoyStick from './libs/JoyStick'
import Tween from './libs/Tween'

export default class RPG{
	constructor({container, scenario, engine, place, sensor, context}){
		if ( ! isWebGLSupported() ) throw new Error('WebGL Not supported');
		window.rpg = this
		this.engine = engine
		this.place = place
		this.sensor = sensor

		this.modes = Object.freeze({
			NONE:   Symbol("none"),
			PRELOAD: Symbol("preload"),
			INITIALISING:  Symbol("initialising"),
			CREATING_LEVEL: Symbol("creating_level"),
			ACTIVE: Symbol("active"),
			GAMEOVER: Symbol("gameover")
		});
		this.mode = this.modes.NONE;
		
		this.container;
		this.serial = 1
		this.player = { };
		this.stats;
		this.controls;
		this.camera;
		this.scene;
		this.renderer;
		this.cellSize = 16;
		this.interactive = false;
		this.levelIndex = 0;
		this._hints = 0;
		this.score = 0;
		this.debug = false;
		this.debugPhysics = false;
		this.cameraFade = 0.05;
        this.mute = false;
		this.sfx = {};
		this.sfx.context = context;
		
		this.messages = { 
			text:[ 
			"Welcome to Factorial",
			"GOOD LUCK!"
			],
			index:0
		}
		
		if (localStorage && !this.debug){
			//const levelIndex = Number(localStorage.getItem('levelIndex'));
			//if (levelIndex!=undefined) this.levelIndex = levelIndex;
		}
		if(container) {
			this.container = container
		} else {
			this.container = document.createElement( 'div' )
			this.container.style.height = '100%'
			document.body.appendChild( this.container )
		}
		
		const sfxExt = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg';
		const game = this;
		//this.anims = ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"];
		this.tweens = [];
		
		this.assetsPath = 'assets/';
		
		const scenarioAssets = _.map(scenario.assetFiles, (assets, assetType) => {
			if(['anims', 'entities', 'places'].includes(assetType)) return assets.map(anim => `${this.assetsPath}${anim}.fbx`)
			return assets.map(s => `${this.assetsPath}${s}.${sfxExt}`)
		})
			.flat()

		//console.dir('RPG Scenario assets', scenario.assetFiles, scenarioAssets)



		const options = {
			assets: scenarioAssets,
			container: this.container,
			oncomplete: function(){
				game.init()
				//game.animate()
			}
		}
		
		//this.anims.forEach( function(anim){ options.assets.push(`${game.assetsPath}${anim}.fbx`)});
		
		this.mode = this.modes.PRELOAD;
		
		document.getElementById("camera-btn").onclick = function(){ game.switchCamera(); };
		document.getElementById("briefcase-btn").onclick = function(){ game.toggleBriefcase(); };
		document.getElementById("action-btn").onclick = function(){ game.contextAction(); };
        document.getElementById("sfx-btn").onclick = function(){ game.toggleSound(); };
		
		this.actionBtn = document.getElementById("action-btn");
		
		this.clock = new THREE.Clock();

		//this.init();
		//this.animate();
		this.preloader = new Preloader(options);
	}
	
    toggleBriefcase(){
        const briefcase = document.getElementById("briefcase");
        const open = (briefcase.style.opacity > 0);
        
        if (open){
            briefcase.style.opacity = "0";
        }else{
            briefcase.style.opacity = "1";
        }
    }
    
    toggleSound(){
        this.mute = !this.mute;
        const btn = document.getElementById('sfx-btn');
        
        if (this.mute) this.stopSound()
        else{
            this.sfx.factory.play
            this.sfx.fan.play();
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    stopSound(){
        this.mute = true
        const btn = document.getElementById('sfx-btn');
        
        for(let prop in this.sfx){
            let sfx = this.sfx[prop];
            if (sfx instanceof SFX) sfx.stop();
        }
        btn.innerHTML = '<i class="fas fa-volume-off"></i>';
    }

    get entities(){
    	return this.engine.at(this.place.id)
    }
    
	contextAction(){
		console.log('contextAction called ' + JSON.stringify(this.onAction));
		if (this.onAction !== undefined){
			if (this.onAction.action!=undefined){
				this.action = this.onAction.action;
			}
		}
		
		const game = this;
		
		if (this.onAction.mode !== undefined){
			switch(this.onAction.mode){
				case 'open-doors':
					this.sfx.door.play();
					this.sfx.button.play();
					const door = this.doors[this.onAction.index];
					const left = door.doors[0];
					const right = door.doors[1];
					this.cameraTarget = { position:left.position.clone(), target:left.position.clone() };
					this.cameraTarget.position.y += 150;
					this.cameraTarget.position.x -= 950;
					//target, channel, endValue, duration, oncomplete, easing="inOutQuad"){
					this.tweens.push( new Tween(left.position, "z", left.position.z - 240, 2, function(){
						game.tweens.splice(game.tweens.indexOf(this), 1);
					}));
					this.tweens.push( new Tween(right.position, "z", right.position.z + 240, 2, function(){
						game.tweens.splice(game.tweens.indexOf(this), 1);
						delete game.cameraTarget; 
						const door = game.doors[game.onAction.index];
						const left = door.doors[0];
						const right = door.doors[1];
						const leftProxy = door.proxy[0];
						const rightProxy = door.proxy[1];
						leftProxy.position.set(left.position.x, left.position.y, left.position.z)
						rightProxy.position.set(right.position.x, right.position.y, right.position.z)
					}))
					break;
                case 'collect':
                    this.activeCamera = this.player.cameras.collect;
                    //this.collect[this.onAction.index].visible = false;
                    //if (this.collected==undefined) this.collected = [];
                    //this.collected.push(this.onAction.index);
                    this.sensor.briefcase.add(this.onAction.src)
		          	this.scene.children
		          		.filter(c => _.get(c, 'scentity.id') !== this.sensor.id)
		          		.filter(c => _.get(c, 'scentity.assets.collect.assetName'))
		          		.filter(c => c.visible)
		          		.filter(c => this.player.object.position.distanceTo(c.position)<100)
						.forEach(object => {
							object.visible = false

						})
					//get engine update action
					const collect = this.sensor.displayActions.find(a => a.value === 'Collect').action(engine)
					this.entities
			            .filter(e => e.id !== this.sensor.id)
			            .filter(o => _.get(o, 'assets.collect.assetName'))
			            .forEach(c => collect(c.id, {
							newPlace: this.sensor.id,
							display: this.place.id,
							serial: ++this.serial
						}))
			
                    break;
			}
		}
	}
	
	switchCamera(fade=0.05){
		const cams = Object.keys(this.player.cameras);
		cams.splice(cams.indexOf('active'), 1);
		let index;
		for(let prop in this.player.cameras){
			if (this.player.cameras[prop]==this.player.cameras.active){
				index = cams.indexOf(prop) + 1;
				if (index>=cams.length) index = 0;
				this.player.cameras.active = this.player.cameras[cams[index]];
				break;
			}
		}
		this.cameraFade = fade;
	}
	
	initSfx(){
		const list = ['gliss','door','factory','button','fan'];
		const game = this;
		list.forEach(function(item){
			game.sfx[item] = new SFX({
				context: game.sfx.context,
				src:{mp3:`${game.assetsPath}${item}.mp3`, ogg:`${game.assetsPath}${item}.ogg`},
				loop: (item=='factory' || item=='fan'),
				autoplay: (item=='factory'|| item=='fan'),
				volume: 0.3
			});	
		})
	}
	
	set activeCamera(object){
		this.player.cameras.active = object;
	}
	
	init() {
		this.mode = this.modes.INITIALISING;

		this.camera = new THREE.PerspectiveCamera( 45, this.container.scrollWidth / this.container.scrollHeight, 1, 2000 );
		
		let col = 0x605050;
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( col );
		this.scene.fog = new THREE.Fog( col, 500, 1500 );

		let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
		light.position.set( 0, 200, 0 );
		this.scene.add( light );

		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, 200, 100 );
		light.castShadow = true;
		light.shadow.mapSize.width = 2048; 
		light.shadow.mapSize.height = 2048;
		light.shadow.camera.top = 3000;
		light.shadow.camera.bottom = -3000;
		light.shadow.camera.left = -3000;
		light.shadow.camera.right = 3000;
		light.shadow.camera.far = 3000;
		this.scene.add( light );

		// ground
		var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
		mesh.rotation.x = - Math.PI / 2;
		//mesh.position.y = -100;
		mesh.receiveShadow = true;
		//this.scene.add( mesh );

		var grid = new THREE.GridHelper( 2000, 40, 0x000000, 0x000000 );
		//grid.position.y = -100;
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		//this.scene.add( grid );

		// model
//		console.log('loading loader')
		const loader = new FBXLoader();
		//console.log('loader loaded')

		//console.log('audio sfx', this.sfx)
		
		

		
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( this.container.scrollWidth, this.container.scrollHeight );
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
		this.renderer.shadowMapDebug = true;
		this.container.appendChild( this.renderer.domElement );
			
		this.container.addEventListener( 'resize', function(){ game.onWindowResize(); }, false );

		
		return this.loadEnvironment(loader)(this.place)
			.then(() => Promise.all(this.entities.filter(e => e.pos && e.pos.length && e.assets).map(this.loadScentityPromise(loader))))
			.then(() => {
				this.createCameras();
				this.initSfx();
				this.action = "look-around";
				this.initPlayerPosition(this.player.coords);
				this.mode = this.modes.ACTIVE;
				const overlay = document.getElementById("overlay");
				overlay.classList.add("fade-in");
				overlay.addEventListener("animationend", function(evt){
					evt.target.style.display = 'none';
				}, false);
			})
			.then(() => this.animate())
			.catch(() => this.onError())
		
	}

	loadScentityPromise(loader){
		const kinematic = this.loadStaticScentityPromise(loader)
		const dynamic = this.loadAnimScentityPromise(loader)
		return scentity => _.get(scentity, 'assets.animations') ? dynamic(scentity) : kinematic(scentity)
	}


    loadStaticScentityPromise(loader){
		const game = this;
		return scentity => {
			//console.dir('rpg loadStaticScentityPromise', scentity)
			return new Promise((resolve, reject) => {
				//resolce true if scentity not located in this place
				const scentityPos = scentity.pos

				if(!game.place) throw new Error('rpg display place not set at scentity load')
				if(!scentityPos) throw new Error('scentity not located at display place')
				if(!scentityPos.length) throw new Error('scentity missing position')
				if(_.get(scentity, 'assets.addition.assetType') !== 'fbx') throw new Error('invalid scentity assetType')

				loader.load( `${this.assetsPath}${_.get(scentity, 'assets.addition.assetName')}.${_.get(scentity, 'assets.addition.assetType')}`, function ( object ) {
					game.scene.add(object);
					
		            const scale = scentity.scaleFactor * Math.pow(10, game.place.scale - scentity.scale + 1);
					object.scale.set(scale, scale, scale);
					object.name = scentity.name;
		            object.position.set(...scentityPos);
		            object.castShadow = true;

		            object.scentity = scentity
					
		            //if(scentity.assets.collect) game.collect.push(object)
					
					object.traverse( function ( child ) {
						if ( child.isMesh ) {
		                    child.castShadow = true;
		                    child.receiveShadow = true;
						}
					} );
					
					resolve(object)
				}, null, reject );
			})
				.catch(game.onError)
		}
	}
    
    loadAnimScentityPromise(loader){
		const game = this;
		return scentity => {
			//console.dir('rpg loadAnimScentityPromise', scentity)

			return new Promise((resolve, reject) => {
				//resolce true if scentity not located in this place
				/*
				const scentityInitPos = _.get(scentity, `located.${game.place.reference}`)
				const scentityRePos = _.get(scentity.effects.find(e => _.get(e, `newPosition`)), `newPosition`, [])
				const scentityPos = scentityRePos.length ? scentityRePos : scentityInitPos
				*/
				const scentityPos = scentity.pos
				if(!game.place) throw new Error('rpg display place not set at scentity load')
				if(!scentityPos) throw new Error('scentity not located at display place')
				if(!scentityPos.length) throw new Error('scentity missing position')
				if(_.get(scentity, 'assets.addition.assetType') !== 'fbx') throw new Error('invalid scentity assetType')

				loader.load( `${this.assetsPath}${_.get(scentity, 'assets.addition.assetName')}.${_.get(scentity, 'assets.addition.assetType')}`, function ( object ) {

					object.mixer = new THREE.AnimationMixer( object );
					object.mixer.addEventListener('finished', function(e){
						game.action = 'look-around';
		                if (game.player.cameras.active == game.player.cameras.collect){
		                    game.activeCamera = game.player.cameras.back;
		                    game.toggleBriefcase();
		                }
					})
					object.castShadow = true;
					
					game.player.mixer = object.mixer;
					game.player.root = object.mixer.getRoot();
					game.player.object = object;
					game.player.walk = object.animations[0];
					game.player.coords = scentityPos
					/*
					_.forEach(scentity.assets.animations.assetNames, anim => {
						console.dir('RPG loadAnimScentityPromise anim', anim)
						loader.load( `${game.assetsPath}${anim}.${scentity.assets.animations.assetType}`, function( animObj ){
							game.player[anim] = animObj.animations[0];
							if (anim=='push-button'){
								game.player[anim].loop = false;
							}
						})
					})
					*/
					object.traverse( function ( child ) {
						if ( child.isMesh ) {
							child.castShadow = true;
							child.receiveShadow = true;		
						}
					} );
					
					game.scene.add(object);
					
					game.joystick = new JoyStick({
						onMove: game.playerControl,
						game: game
					});
			
					
		            const scale = scentity.scaleFactor * Math.pow(10, game.place.scale - scentity.scale + 1);
					object.scale.set(scale, scale, scale);
					object.name = scentity.name;
		            object.position.set(...scentityPos);
		            object.castShadow = true;

		            object.scentity = scentity
					
		            if(scentity.assets.collect) game.collect.push(object)
					
					object.traverse( function ( child ) {
						if ( child.isMesh ) {
		                    child.castShadow = true;
		                    child.receiveShadow = true;
						}
					} );
					
					resolve(scentity.assets.animations.assetNames)
				}, null, reject );
			})
				.then(anims => Promise.all(anims.map(anim => {
					return new Promise((resolve, reject) => {
						loader.load( `${game.assetsPath}${anim}.${scentity.assets.animations.assetType}`, function( animObj ){
							//console.dir('RPG loadAnimScentityPromise anim', anim, animObj)
							game.player[anim] = animObj.animations[0];
							if (anim=='push-button'){
								game.player[anim].loop = false;
							}
							resolve(true)
						})
					})
				})))
				.catch(game.onError)
		}
	}
    
	loadEnvironment(loader){
		const game = this;
		return scentity => {
			//console.dir('rpg loadEnvironment', scentity)

			return new Promise((resolve, reject) => {
				if(_.get(scentity, 'assets.addition.assetType') !== 'fbx') throw new Error('invalid scentity assetType')

				loader.load( `${game.assetsPath}${_.get(scentity, 'assets.addition.assetName')}.${_.get(scentity, 'assets.addition.assetType')}`, function ( object ) {


				game.scene.add(object);
				game.doors = [];
				game.fans = [];
				
				object.receiveShadow = true;
				object.scale.set(0.8, 0.8, 0.8);
				object.name = "Environment";
				let door = { trigger:null, proxy:[], doors:[]};
				
				object.traverse( function ( child ) {
					if ( child.isMesh ) {
						if (child.name.includes('main')){
							child.castShadow = true;
							child.receiveShadow = true;
						}else if (child.name.includes('mentproxy')){
							child.material.visible = false;
							game.environmentProxy = child;
						}else if (child.name.includes('door-proxy')){
							child.material.visible = false;
							door.proxy.push(child);
							checkDoor();
	 					}else if (child.name.includes('door')){
							door.doors.push(child);
							checkDoor()
						}else if (child.name.includes('fan')){
							game.fans.push(child);
						}
					}else{
						if (child.name.includes('Door-null')){
							door.trigger = child;
							checkDoor();
						}
					}
					
					function checkDoor(){
						if (door.trigger!==null && door.proxy.length==2 && door.doors.length==2){
							game.doors.push(Object.assign({}, door));
							door = { trigger:null, proxy:[], doors:[]};
						}
					}
				} );
				resolve(object)
			}, null, reject )
		})
			.catch(game.onError)
	}}
	
	createDummyEnvironment(){
		const env = new THREE.Group();
		env.name = "Environment";
		this.scene.add(env);
		
		const geometry = new THREE.BoxBufferGeometry( 150, 150, 150 );
		const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
		
		for(let x=-1000; x<1000; x+=300){
			for(let z=-1000; z<1000; z+=300){
				const block = new THREE.Mesh(geometry, material);
				block.position.set(x, 75, z);
				env.add(block);
			}
		}
		
		this.environmentProxy = env;
	}
	
	playerControl(forward, turn){
		////console.log(`playerControl(${forward}), ${turn}`);
		turn = -turn;
		
		if (forward==0 && turn==0){
			delete this.player.move;
		}else{
			this.player.move = { forward, turn }; 
		}
		
		if (forward>0){
			if (this.player.action!='walk'&& this.player.action!='run') this.action = 'walk';
		}else if (forward<-0.2){
			if (this.player.action!='walk') this.action = 'walk';
		}else{
			if (this.player.action=="walk" || this.player.action=='run') this.action = 'look-around';
		}
		
	}
	
	createCameras(){
		const game = this
		const front = new THREE.Object3D();
		front.position.set(112, 100, 200);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 100, -250);
		back.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 465);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;
		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead, collect };
		game.activeCamera = this.player.cameras.wide;
		game.cameraFade = 1;
		setTimeout( function(){ 
			game.activeCamera = game.player.cameras.back; 
			game.cameraFade = 0.01; 
			setTimeout(function(){ game.cameraFade = 0.1; }, 1500);
		}, 2000)
	}
	
	initPlayerPosition(coords = [0, 0, 0]){
		//cast down
        this.player.object.position.set(...coords);
		const dir = new THREE.Vector3(0,-1,0);
		const pos = this.player.object.position.clone();
		pos.y += 200;
		const raycaster = new THREE.Raycaster(pos, dir);
		const gravity = 30;
		const box = this.environmentProxy;
		
		const intersect = raycaster.intersectObject(box);
		if (intersect.length>0){
			this.player.object.position.y = pos.y - intersect[0].distance;
		}
	}
	
	getMousePosition(clientX, clientY){
		const pos = new THREE.Vector2();
		pos.x = (clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		pos.y = -(clientY / this.renderer.domElement.clientHeight) * 2 + 1;
		return pos;
	}
	
	showMessage(msg, fontSize=20, onOK=null){
		const txt = document.getElementById('message_text');
		txt.innerHTML = msg;
		txt.style.fontSize = fontSize + 'px';
		const btn = document.getElementById('message_ok');
		const panel = document.getElementById('message');
		const game = this;
		if (onOK!=null){
			btn.onclick = function(){ 
				panel.style.display = 'none';
				onOK.call(game); 
			}
		}else{
			btn.onclick = function(){
				panel.style.display = 'none';
			}
		}
		panel.style.display = 'flex';
	}
	
	loadJSON(name, callback) {   

		var xobj = new XMLHttpRequest();
			xobj.overrideMimeType("application/json");
		xobj.open('GET', `${name}.json`, true); // Replace 'my_data' with the path to your file
		xobj.onreadystatechange = function () {
			  if (xobj.readyState == 4 && xobj.status == "200") {
				// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
				callback(xobj.responseText);
			  }
		};
		xobj.send(null);  
	 }
	
	onWindowResize() {
		this.camera.aspect = this.container.scrollWidth / this.container.scrollHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( this.container.scrollWidth, this.container.scrollHeight );

	}

	set action(name){
		if (this.player.action==name) return;
		const anim = this.player[name];
		const action = this.player.mixer.clipAction( anim,  this.player.root );
		this.player.mixer.stopAllAction();
		this.player.action = name;
		action.timeScale = (name=='walk' && this.player.move!=undefined && this.player.move.forward<0) ? -0.3 : 1;
        action.time = 0;
		action.fadeIn(0.5);	
		if (name=='push-button' || name=='gather-objects') action.loop = THREE.LoopOnce;
		action.play();
		this.player.actionTime = Date.now();
	}
	
	movePlayer(dt){
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.player.object.getWorldDirection(dir);
		if (this.player.move.forward<0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const box = this.environmentProxy;
	
		if (this.environmentProxy!=undefined){ 
			const intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) blocked = true;
			}
		}
		
		if (!blocked){
			if (this.player.move.forward>0){
				const speed = (this.player.action=='run') ? 200 : 100;
				this.player.object.translateZ(dt*speed);
			}else{
				this.player.object.translateZ(-dt*30);
			}
		}
		
		if (this.environmentProxy!=undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(50-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(intersect[0].distance-50);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.player.object.position.y){
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				}else if (targetY < this.player.object.position.y){
					//Falling
					if (this.player.velocityY==undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY){
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			}
		}
		//get engine update action
		const move = engine.gameState().player1.displayActions.find(a => a.value === 'Move').action(engine)
		const finalCoords = [this.player.object.position.x, this.player.object.position.y, this.player.object.position.z]
		move(this.sensor.id, {
			reference: this.place.reference,
			coords: finalCoords,
			display: this.place.id,
			serial: ++this.serial
		})
	}
	
	animate() {
		const game = this;
		const dt = this.clock.getDelta();
		
		window.requestAnimationFrame( function(){ game.animate(); } );
		
		if (this.tweens.length>0){
			this.tweens.forEach(function(tween){ tween.update(dt); });	
		}
		
		if (this.player.mixer!=undefined && this.mode==this.modes.ACTIVE){
			this.player.mixer.update(dt);
		}
		
		if (this.player.action=='walk'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>1000 && this.player.move.forward>0) this.action = 'run';
		}
		if (this.player.move!=undefined){
			if (this.player.move.forward!=0) this.movePlayer(dt);
			this.player.object.rotateY(this.player.move.turn*dt);
		}
		
		if (this.player.cameras!=undefined && this.player.cameras.active!=undefined){
			this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), this.cameraFade);
			let pos;
			if (this.cameraTarget!=undefined){
				this.camera.position.copy(this.cameraTarget.position);
				pos = this.cameraTarget.target;
			}else{
				pos = this.player.object.position.clone();
				pos.y += 60;
			}
			this.camera.lookAt(pos);
		}
		
		this.actionBtn.style = 'display:none;';
		let trigger = false;
		
		if (this.doors !== undefined){
			this.doors.forEach(function(door){
				if (game.player.object.position.distanceTo(door.trigger.position)<100){
					game.actionBtn.style = 'display:block;';
					game.onAction = { action:'push-button', mode:'open-doors', index:0 };
					trigger = true;
				}
			});
		}
        
        const collectibles = (_.get(this.sensor, 'briefcase.contents.length', 0) >= _.get(this.sensor, 'briefcase.slots', 0) ? [] : this.entities)
            .filter(e => e.id !== this.sensor.id)
            .filter(o => _.get(o, 'assets.collect.assetName'))
        if (collectibles.length && !trigger){
            collectibles
            	.map(scentity => this.scene.children.find(c => scentity.id === _.get(c, 'scentity.id', -1)))
            	.filter(_.isObject)
	            .forEach((sceneObject) => {
	            	if(!_.get(sceneObject, 'scentity.assets.collect.assetName')) game.onError('collected assets not defined')
					if (sceneObject.visible && this.engine.distWithinBetween(this.place.id)(sceneObject.scentity.id, this.sensor.id)<100){
						game.actionBtn.style = 'display:block;';
						game.onAction = { action:'gather-objects', mode:'collect', index:0, src:`${game.assetsPath}${_.get(sceneObject, 'scentity.assets.collect.assetName')}.${_.get(sceneObject, 'scentity.assets.collect.assetType')}` };
						trigger = true;
					}
				});

        }
		
		if (!trigger) delete this.onAction;
		
		if (this.fans !== undefined){
            let vol = 0;
            this.fans.forEach(function(fan){
                const dist = fan.position.distanceTo(game.player.object.position);
                const tmpVol = 1 - dist/1000;
                if (tmpVol>vol) vol = tmpVol;
                fan.rotateZ(dt); 
            });
            this.sfx.fan.volume = vol;
        }
	
		this.renderer.render( this.scene, this.camera );

		if (this.stats!=undefined) this.stats.update();

	}
	
	onError(error){
		const msg = error.message
		console.error(error);
		console.error(error.message);
	} 
}

