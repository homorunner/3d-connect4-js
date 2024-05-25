if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, stats;
var camera, controls, scene, renderer;
var cross;
var mouseVector = new THREE.Vector3();
var projector = new THREE.Projector();
var sphereM;

var xSect_cl = xSect(over, out);

init();
animate();

var game_state = {
	A: [],
	B: []
}

var PLAYERS = {
	P1_color : 0x333333,
	P2_color : 0xCCCCCC
}

function init() {
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.x = 25;
	camera.position.y = 25;
	camera.position.z = 30;
	controls = new THREE.OrbitControls(camera);
	controls.addEventListener('change', render);
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
	// world

	var BALL_RADIUS = 2;
	var sphereG = new THREE.SphereGeometry(BALL_RADIUS / 1.2, 20, 15);
	sphereM = {
					color: 0xffffff,
					opacity: 0.1,
					transparent: true
				};

	for (var x = 0; x < 5; x++)
		for (var y = 0; y < 5; y++)
			for (var z = 0; z < 5; z++) {
				var sphere = new THREE.Mesh(sphereG, new THREE.MeshLambertMaterial(sphereM));
				sphere.position.x = 2 * BALL_RADIUS * x - 3 * BALL_RADIUS;
				sphere.position.y = 2 * BALL_RADIUS * y - 3 * BALL_RADIUS;
				sphere.position.z = 2 * BALL_RADIUS * z - 3 * BALL_RADIUS;
				//if ( y === 3 ) sphere.name = "" + x + y;
				sphere.name = "" + x + y + z;
				scene.add(sphere);
			}

	var cylG = new THREE.CylinderGeometry(BALL_RADIUS/3,BALL_RADIUS/3,BALL_RADIUS*12)
	var cylM = {color: 0x77BB77, opacity: 0.1, transparent: true};
	for (var x = 0; x < 5; x++)
		for (var z = 0; z < 5; z++) {
			var cyl = new THREE.Mesh(cylG, new THREE.MeshLambertMaterial(cylM));
			cyl.position.x = 2 * BALL_RADIUS * x - 3 * BALL_RADIUS;
			cyl.position.y = 0;
			cyl.position.z = 2 * BALL_RADIUS * z - 3 * BALL_RADIUS;
			cyl.name = "r" + x + z;
			scene.add(cyl);
		}

	var pSz = 10*BALL_RADIUS;		
	var plateG = new THREE.CubeGeometry(pSz, pSz, BALL_RADIUS);
	var plateM = new THREE.Mesh(plateG, new THREE.MeshLambertMaterial({color: 0x77BB77}));
	plateM.rotation.x = 90*Math.PI/180
	plateM.position.y = -5*BALL_RADIUS;
	scene.add(plateM);
	// lights
	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);
	light = new THREE.DirectionalLight(0x665588);
	light.position.set(-1, -1, -1);
	scene.add(light);
	light = new THREE.AmbientLight(0x333333);
	scene.add(light);
	// renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setClearColor(scene.fog.color, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container = document.getElementById('container');
	container.appendChild(renderer.domElement);
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);
	//
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('click', onClick);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

function render() {
	renderer.render(scene, camera);
	stats.update();
}

function onMouseMove(e) {
	mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
	mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight);
	xSect_cl();
}

function find_name (name) {
	for (var i = 0; i < scene.children.length; i++) {
		if (scene.children[i].name === name)
			return scene.children[i];
	};
}


function draw_balls () {
	for (var i = 0; i < game_state.A.length; i++) {
		var b = find_name(game_state.A[i]).material;
		b.color= new THREE.Color( PLAYERS.P1_color );
		b.opacity= 1;
		b.transparent= false;
	}

	for (var i = 0; i < game_state.B.length; i++) {
		var b = find_name(game_state.B[i]).material;
		b.color= new THREE.Color(PLAYERS.P2_color);
		b.opacity= 1;
		b.transparent= false;
	}
	render();
}

var current_player = 0

function onClick(e) {
	function make_move(m) {

		var mvs = game_state.A.concat(game_state.B);
		var x = m[0],
			z = m[1];
		var maxi;
		//maxi = maxi || x + '0' + z;
		for (var i = 0; i < mvs.length; i++) {
			var this_m = mvs[i];
			if ((this_m[0] === x) && (this_m[2] === z)) {
				if (maxi) {
					maxi = maxi < this_m[1] ? this_m[1] : maxi;
				} else {
					maxi = this_m[1];
				}
			}
		}
		if (maxi === undefined) {
			maxi = 0;
		} else {
			maxi = parseInt(maxi) + 1;
			if (maxi > 4) return;
		}
		
		if(current_player % 2 == 1) {
			game_state.B.push('' + x + maxi + z);
		} else {
			game_state.A.push('' + x + maxi + z);
		}

		draw_balls();
		current_player++;
	}


	var raycaster = projector.pickingRay(mouseVector.clone(), camera),
		intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		var intersection = intersects[0],
			obj = intersection.object;
		if (obj.name[0] === 'r') {
			make_move(obj.name.substr(1));
		}
	}
}

function xSect (over, out) {
	var last;
	
	return function () {
		var raycaster = projector.pickingRay(mouseVector.clone(), camera),
		intersects = raycaster.intersectObjects(scene.children);
			if ( intersects.length > 0 ) {
				var intersection = intersects[0], 
					obj = intersection.object;	

				if ( obj.name[0] === "r") {
					var curI = scene.children.indexOf(obj);
					last = last || curI;
					if ( last !== curI ){
						out(scene.children[last]);
						last = curI;
					}
					over(scene.children[last]);
					render();
				} 
			} else {
				if (last) {
					out(scene.children[last]);
					render();
				}
			}
		} 
}

function over (o) {
	var mat = o.material;
	mat.opacity = 1;
	mat.transparent = false;
	mat.color.setRGB(1,0,0);
}

function out (o) {
	var mat = o.material;
	mat.opacity = 0.1;
	mat.transparent = true;
	mat.color.setRGB(0.5,0.8,0.5);
}