!function initSceneWithWebVR() {

    // init globe variant
    let container,
        scene,
        renderer,
        camera,
        stats,
        VRMODE = true;

    // init container
    container = document.createElement('div');
    document.body.appendChild(container);

    // init globe objects
    window.objects = {
        'nodes': [],
        'links': [],
        'labels':[]
    };

    // init Raycaster
    window.raycaster = new THREE.Raycaster();

    // init scene
    window.scene = scene = new THREE.Scene()
    scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    // scene.fog = new THREE.Fog( scene.background, 1, 5000 );

    // add AxesHelper
    // scene.add(new THREE.AxesHelper(100));

    // init camera
    window.camera = camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000)

    camera.position.set(0, 0, 100)
    // VRMODE ? camera.lookAt(new THREE.Vector3(0, 0, 0)) : null

    // VR user (set vr camera transform)
    // window.user = user = new THREE.Object3D()
    // user.name = 'user'
    // user.rotateY(180)
    // scene.add(user)

    // init crosshair
    // let crosshair = new THREE.Mesh(
    //     new THREE.RingGeometry(0.01, 0.02, 32),
    //     new THREE.MeshBasicMaterial({
    //         color: 0xffffff,
    //         opacity: 0.5,
    //         transparent: true
    //     })
    // );

    // crosshair.position.z = - 2;
    // camera.add(crosshair);
    camera.rotateY(180)

    // const helper = new THREE.CameraHelper(camera);
    // scene.add(helper);

    scene.add(camera);

    // init light    
    scene.add(new THREE.HemisphereLight(0x888877, 0x777788));
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = - 2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = - 2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);

    //////////////////////////
    // let MCEffect;
    // let resolution = 200;
    // let MCMaterial = new THREE.MeshPhongMaterial({
    //     // wireframe: true,
    //     color: '#333',
    //     // flatShading: true,
    //     transparent: true,
    //     opacity: .3,
    //     // needsUpdate: true,
    //     depthWrite: false
    //     // side: THREE.BackSide, 
    // })

    // let MCMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 2, vertexColors: THREE.VertexColors } )

    // window.MCEffect = MCEffect = new THREE.MarchingCubes(resolution, MCMaterial, true, true);

    // MCEffect.enableUvs = false;
    // // MCEffect.enableColors = true;
    // MCEffect.isolation = 200;
    // MCEffect.init( resolution )
    // // MCEffect.material.color.setHSL( 0, 0, 1 );

    // MCEffect.scale.set(500, 500, 500);
    // scene.add(MCEffect);

    // init skydome
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`

    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
        float h = normalize( vWorldPosition + offset ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
    }`

    const uniforms = {
        topColor: { value: new THREE.Color('#222') },
        bottomColor: { value: new THREE.Color('#111') },
        offset: { value: 10 },
        exponent: { value: .6 }
    };

    // scene.fog.color.copy( uniforms[ "bottomColor" ].value );

    const skyGeo = new THREE.SphereGeometry(500, 50, 50);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    let skydome = new THREE.Mesh(skyGeo, skyMat)
    skydome.name = 'skydome'
    scene.add(skydome);

    // renderer setting
    window.renderer = renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0000000, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.vr.enabled = VRMODE;
    container.appendChild(renderer.domElement);

    // add WebVR Button
    VRMODE ? document.body.appendChild(WEBVR.createButton(renderer)) : null;

    // init stats
    // window.stats = stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // stats.domElement.style.right = '0px';
    // document.body.appendChild(stats.domElement);

    // init OrbitControls
    // window.controls = new THREE.OrbitControls(camera, renderer.domElement)  //OrbitControls TrackballControls
    

}()


window.addEventListener('resize', onWindowResize, false);

// document.addEventListener('mousemove', function (event) {
//     // let rect = renderer.domElement.getoundingClientRect();
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//     // mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
//     // mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;
// });

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}
