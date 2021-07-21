!function init_data() {
    $.ajax({
        type: "get",
        async: true,
        ////////////////BRAIN NETWORK
        // url: "/abnormal_1013_S_5071",   
        // url: "/normal_1_S_0071",

        ////////////////CITATION NETWORK
        // url: "/cite_graph_test",

        ////////////////SOCIAL NETWORK
        // url: 'social_graph_contact',
        // url: 'social_graph_friendship',
        // url: 'social_graph_facebook',
        url: 'social_graph_sensor',

        ////////////////User Study
        // url: 'test',

        ///////////////OTHER
        // url: "http://localhost:5000/test",

        dataType: "json",
        contentType: "application/json",
        beforeSend: function () { },
        success: function (data) {
            console.log(data)
            // socialGraphPro(data)
            // brainGraph(data)
            // citationGraph(data)
            socialGraph(data)
            // test(data)
        },
        complete: function () {

        },
        error: function () {
            alert('ajax Error!');
        }
    });
}()

function test(data) {

    window.graphGroup = new THREE.Object3D()

    let nodes = data.nodes;
    let links = data.links;

    window.groupData = {}
    let mapping = {}


    let simulation = d3.forceSimulation(nodes, 3)
        // .force("charge", d3.forceManyBody())
        // .force("link", d3.forceLink(links).id(d => d.id))
        // .force("center", d3.forceCenter(0, 0, 0))
        // .tick(500)

    window.clique_mapping_init = data.INIT
    window.clique_mapping_1D = data.L1D
    window.clique_mapping_2D = data.L2D
    window.clique_mapping_3D = data.L3D

    Object.keys(clique_mapping_init).forEach(d => {
        clique_mapping_init[d] = new THREE.Vector3(clique_mapping_init[d].x, clique_mapping_init[d].y, clique_mapping_init[d].z)
        clique_mapping_1D[d] = new THREE.Vector3(clique_mapping_1D[d].x, clique_mapping_1D[d].y, clique_mapping_1D[d].z)
        clique_mapping_2D[d] = new THREE.Vector3(clique_mapping_2D[d].x, clique_mapping_2D[d].y, clique_mapping_2D[d].z)
        clique_mapping_3D[d] = new THREE.Vector3(clique_mapping_3D[d].x, clique_mapping_3D[d].y, clique_mapping_3D[d].z)
    })

    let colors = ["#669", "#4e79a7", "#f28e2c", "#ff5759", "#76b702", "#09a14f", "#ed0949", "#0f7aa1", "#ff00a7", "#40f5ff", "#00eeab"]

    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(3, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: colors[node.group],
            // color: '#ed0949',
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        let joints = []

        links.forEach((link, i) => {
            if (link.source == node.id) {
                joints.push(i)
            }

            if (link.target == node.id) {
                joints.push(i)
            }
        })

        nodeMesh.name = 'node_' + node.id;

        // extra data attributes
        nodeMesh.userData.group = node.group;
        nodeMesh.userData.id = node.id;
        nodeMesh.userData.joints = joints;

        nodeMesh.needsUpdate = true;

        // nodeMesh.position.fromArray([node.x, node.y, node.z])
        nodeMesh.position.copy(clique_mapping_init['node' + node.id])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (link) => {

        const line = new THREE.CatmullRomCurve3([
            clique_mapping_init['node' + link.source],
            clique_mapping_init['node' + link.target]
            // new THREE.Vector3(link.source.x, link.source.y, link.source.z),
            // new THREE.Vector3(link.target.x, link.target.y, link.target.z)
        ]);

        let lineMaterial = new THREE.MeshStandardMaterial({
            // color: link.source.group == link.target.group ? colors[link.source.group] : '#eee',
            // color: '#fff',
            // opacity: link.relation*0.15,
            metalness: 0,
            roughness: 0,
            transparent: true,
            envMapIntensity: 1,
        });

        let lineGeometry = new THREE.TubeBufferGeometry(line, 100, 0.2);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        // link.geometry.computeBoundingBox();

        linkMesh.name = `${link.source}-${link.target}`;
        linkMesh.needsUpdate = true;

        linkMesh.userData.source = link.source;
        linkMesh.userData.target = link.target;
        linkMesh.userData.value = link.value;

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)

    }

    nodes.forEach(node => {
        groupData['node' + node.id] = node.group
        // mapping['node' + node.id] = new THREE.Vector3().fromArray([node.x, node.y, node.z])
        createNode(node)
    })

    links.forEach(link => {
        createLink(link)
    })

    scene.add(graphGroup)

    addLabel(clique_mapping_init)

    function addLabel(clique_mapping) {

        const loader = new THREE.FontLoader();
        loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {

            const matLite = new THREE.MeshBasicMaterial({
                color: '#fff',
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });

            nodes.forEach(node => {

                // if (node.group == 7) {
                const message = node.id;

                const shapes = font.generateShapes(message, 3);

                const geometry = new THREE.ShapeGeometry(shapes);

                const text = new THREE.Mesh(geometry, matLite);

                text.position.copy(clique_mapping['node' + node.id])
                // text.position.fromArray([node.x, node.y, node.z])

                text.position.x += 3.5;
                // text.position.y += 1;
                // text.position.z += 5;
                text.visible = false
                text.needsUpdate = true;

                // text.lookAt(camera.position)

                text.quaternion.copy(camera.quaternion)

                objects.labels.push(text)

                graphGroup.add(text);
                // }

            })

        })
    }

    // bundleByGloble()

    function bundleByGloble() {

        let nodes_data = {}

        objects.nodes.forEach(d => {

            let pos = new THREE.Vector3()
            // d.getWorldPosition(pos)
            nodes_data[d.userData.id] = d.position

        })

        let links_data = objects.links.map((linkMesh, i) => {
            return {
                index: i,
                source: linkMesh.userData.source,
                target: linkMesh.userData.target
            }
        })

        let bundleRes = forceBundling()
            .nodes(nodes_data)
            .edges(links_data)
            .compatibility_threshold(0.6)
            ()

        console.log(bundleRes);

        bundleRes.forEach(d => {
            // console.log(d);
            objects.links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                //    objects.links[d[0].index].userData.value* 0.1)
                0.2)
            );
        })

    }

    // cliqueLayout()

    function cliqueLayout() {

        let commnities = [...Array(11)].map((d, i) => {
            return {
                'id': i
            }
        })

        let simulation = d3.forceSimulation(commnities, 3)
            .force("charge", d3.forceManyBody()
                .strength(d => -20)
                // .theta(0.7)
                // .distanceMin(0.01) 
                // .distanceMax(1) 
            )
            .force("center", d3.forceCenter(0, 0, 0))
            // .force("collide", d3.forceCollide(2))
            .tick(100)

        for (let i = 0; i < 11; i++) {

            let subnodes = objects.nodes.filter(d => d.userData.group == i).map(d => {
                return {
                    id: d.userData.id,
                    // name: d.userData.name,
                    group: d.userData.group
                }
            })
            let sublinks = objects.links.filter(d => groupData['node' + d.userData.source] == i && groupData['node' + d.userData.target] == i).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })


            let simulation = d3.forceSimulation(subnodes, 3)
                .force("charge", d3.forceManyBody()
                    .strength(d => 0.1)
                    // .theta(0.7)
                    // .distanceMin(0.01) 
                    // .distanceMax(1) 
                )
                .force("link", d3.forceLink(sublinks).id(d => d.id)
                    // .distance(0.5)
                    // .strength(d => d.source.group == d.target.group ? 1 : 0.1)
                )
                // .force('x',d3.forceX().strength(d=>0))
                // .force('y',d3.forceY().strength(d=>0))
                // .force('z',d3.forceZ().strength(d=>0))
                .force("center", d3.forceCenter(commnities[i].x, commnities[i].y, commnities[i].z)
                    .strength(0.01))
                // .force("collision", d3.forceCollide(5))
                .tick(100)

            subnodes.forEach(d => {

                let nodeMesh = objects.nodes.find(s => s.name == 'node_' + d.id)

                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                clique_mapping_1D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                clique_mapping_2D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, commnities[i].y, d.z))
                clique_mapping_3D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                nodeMesh.position.copy(clique_mapping_1D['node' + d.id])


            })
        }
        
        console.log(JSON.stringify(mapping));
        console.log(JSON.stringify(clique_mapping_1D));
        console.log(JSON.stringify(clique_mapping_2D));
        console.log(JSON.stringify(clique_mapping_3D));


        //     // let nodes_data = {}
        //     // let links_data = []
        //     // let linksL = []


        //     // objects.links.forEach(linkMesh => {

        //     //     const line = new THREE.CatmullRomCurve3([
        //     //         mapping['node' + linkMesh.userData.source],
        //     //         mapping['node' + linkMesh.userData.target]
        //     //     ]);


        //     //     if (groupData['node' + linkMesh.userData.source] != groupData['node' + linkMesh.userData.target]) {

        //     //         links_data.push({
        //     //             source: linkMesh.userData.source,
        //     //             target: linkMesh.userData.target
        //     //         })

        //     //         linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.05));

        //     //         linksL.push(linkMesh)
        //     //     }
        //     //     else {
        //     //         linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2));
        //     //     }

        //     // })


        //     // Object.keys(mapping).forEach(d => {
        //     //     nodes_data[d.replace('node', '')] = { x: mapping[d].x, y: mapping[d].y, z: mapping[d].z }
        //     // })

        //     // let bundleRes = forceBundling()
        //     //     .nodes(nodes_data)
        //     //     .edges(links_data)
        //     //     .compatibility_threshold(0.6)
        //     //     ()

        //     // linksL.forEach((d, i) => {
        //     //     d.geometry.copy(new THREE.TubeBufferGeometry(
        //     //         new THREE.CatmullRomCurve3(
        //     //             bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z))
        //     //         )
        //     //         ,100,
        //     //         .02)
        //     //         // , false, 'catmullrom', 0.1
        //     //         );
        //     // })
    }

    // !function () {

    //     renderer.render(scene, camera);
    //     stats.update()
    //     objects.labels.forEach(text => {
    //         text.quaternion.copy(camera.quaternion)
    //     })
    //     controls.update()
    //     requestAnimationFrame(arguments.callee)
    // }()

}

function brainGraph(data) {

    window.graphGroup = new THREE.Object3D()
    scene.add(graphGroup)

    var loader = new THREE.OBJLoader();

    loader.load('./data/brain/brain-andre.obj', function (obj) {

        let scale = 0.3
        obj.scale.set(scale, scale, scale)
        obj.children.forEach(o => {
            o.material.transparent = true
            o.material.opacity = 0.3
            o.material.color.set('#444')
            o.material.envMapIntensity = 1
            o.material.depthWrite = false
        })

        let center = new THREE.Vector3()
        new THREE.Box3().setFromObject(obj).getCenter(center)

        // new_obj.position.y -= 9
        obj.name = 'brain-model'
        obj.position.copy(graphGroup.worldToLocal(center)); // center the model
        // obj.position.x += 0.5
        obj.position.y += 2
        obj.position.z -= 14
        obj.rotation.x = -Math.PI / 6;   // rotate the model
        // obj.rotation.z =  Math.PI/2;   // rotate the model
        // obj.position.copy(center)
        graphGroup.add(obj)
    });

    // let center = new THREE.Vector3(23.319318166914204, 29.17259966607288, 24.127389132606524) // abnormal
    // let center = new THREE.Vector3(23.317744224312523,  29.17259966607288,  24.127389132606524)  // normal

    window.clique_mapping_init = data.INIT
    window.clique_mapping_1D = data.L1D
    window.clique_mapping_2D = data.L2D
    window.clique_mapping_3D = data.L3D
    window.groupData = {}

    Object.keys(clique_mapping_init).forEach(d => {
        clique_mapping_init[d] = new THREE.Vector3(clique_mapping_init[d].x, clique_mapping_init[d].y, clique_mapping_init[d].z)
        clique_mapping_1D[d] = new THREE.Vector3(clique_mapping_1D[d].x, clique_mapping_1D[d].y, clique_mapping_1D[d].z)
        clique_mapping_2D[d] = new THREE.Vector3(clique_mapping_2D[d].x, clique_mapping_2D[d].y, clique_mapping_2D[d].z)
        clique_mapping_3D[d] = new THREE.Vector3(clique_mapping_3D[d].x, clique_mapping_3D[d].y, clique_mapping_3D[d].z)
    })

    let colors = ['#00c462', '#f60716', '#511281', '#0f41ad', '#f33e8b', '#f58704']

    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(1, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: colors[node.group % 6],
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        let joints = []

        data.links.forEach((link, i) => {
            if (link.source == node.id) {
                joints.push(i)
            }

            if (link.target == node.id) {
                joints.push(i)
            }
        })

        nodeMesh.name = 'node_' + node.id;
        nodeMesh.userData.joints = joints
        nodeMesh.userData.group = node.group
        nodeMesh.userData.id = node.id
        nodeMesh.userData.name = node.name

        node.needsUpdate = true;

        nodeMesh.position.copy(clique_mapping_init['node' + node.id])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (s) => {

        let start = clique_mapping_init['node' + s.source]
        let end = clique_mapping_init['node' + s.target]

        const line = new THREE.CatmullRomCurve3([
            // new THREE.Vector3(start.x,start.y,start.z),
            // new THREE.Vector3(end.x,end.y,end.z)
            start,
            end
        ]);

        let lineMaterial = new THREE.MeshStandardMaterial({
            color: groupData['node' + s.source] == groupData['node' + s.target] ? colors[groupData['node' + s.target] % 6] : '#ddd',
            metalness: 0,
            roughness: 0,
            opacity: 0.6,
            transparent: true,
            envMapIntensity: 1,
        });

        let lineGeometry = new THREE.TubeBufferGeometry(line, 10, 0.018);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        linkMesh.name = `${s.source}-${s.target}`;

        linkMesh.userData.source = s.source;
        linkMesh.userData.target = s.target;
        linkMesh.userData.value = s.value;

        linkMesh.needsUpdate = true;

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)

        // let lineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     mapping['node' + s.source],
        //     mapping['node' + s.target]
        // ]);

        // let lineMaterial = new THREE.LineBasicMaterial({
        //     color: '#fff',
        //     opacity: .1,
        //     transparent: true
        // })

        // let line = new THREE.Line(lineGeometry, lineMaterial);

        // objects.links.push(line)
        // graphGroup.add(line)
    }

    // let scale = 0.6

    data.nodes.forEach(node => {
        // mapping['node' + node.id] = new THREE.Vector3(node.x*scale, node.y*scale, node.z*scale).sub(center)
        groupData['node' + node.id] = node.group
        createNode(node)
    })

    data.links.forEach(link => {
        createLink(link)
    })



    // updateLayout(clique_mapping_2D)

    bundleByGloble()

    function bundleByGloble() {

        let nodes_data = {}

        objects.nodes.forEach(d => {

            let pos = new THREE.Vector3()
            // d.getWorldPosition(pos)
            nodes_data[d.userData.id] = d.position

        })

        let links_data = objects.links.map((linkMesh, i) => {
            return {
                index: i,
                source: linkMesh.userData.source,
                target: linkMesh.userData.target
            }
        })

        let bundleRes = forceBundling()
            .nodes(nodes_data)
            .edges(links_data)
            .compatibility_threshold(0.5)
            ()

        bundleRes.forEach(d => {
            // console.log(d);
            objects.links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                .1)
            );
        })

    }

    addLabel(clique_mapping_init)

    function addLabel(clique_mapping) {

        const loader = new THREE.FontLoader();
        loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {

            const matLite = new THREE.MeshBasicMaterial({
                color: '#ddd',
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                writeDepth: false
            });

            data.nodes.forEach(node => {

                const message = node.name;

                const shapes = font.generateShapes(message, 1.5);

                const geometry = new THREE.ShapeGeometry(shapes);

                const text = new THREE.Mesh(geometry, matLite);

                text.position.copy(clique_mapping['node' + node.id])

                text.name = 'text_' + node.name;

                text.position.x -= 2;
                // text.position.y += 1;
                // text.position.z += 1;

                // text.needsUpdate = true;
                text.visible = false;

                // text.lookAt(camera.position)

                // text.quaternion.copy(camera.quaternion)

                objects.labels.push(text)

                graphGroup.add(text);
            })

        })
    }


    function updateLayout(clique_mapping) {

        objects.nodes.forEach(nodeMesh => {
            nodeMesh.position.copy(clique_mapping['node' + nodeMesh.userData.id])
        })

        objects.links.forEach(linkMesh => {

            const line = new THREE.CatmullRomCurve3([
                clique_mapping['node' + linkMesh.userData.source],
                clique_mapping['node' + linkMesh.userData.target]
            ]);

            linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.25));

        })
    }
    // console.log(JSON.stringify(clique_mapping_init));
    // new THREE.Box3().setFromObject(graphGroup).getCenter(graphGroup.position).multiplyScalar(-1);

    /////// get center////////
    // let graphGroupcenter = new THREE.Vector3()
    // new THREE.Box3().setFromObject(graphGroup).getCenter(graphGroupcenter);
    // console.log(graphGroupcenter);
    //////////////////////////


    // cliqueLayout()

    function cliqueLayout() {

        let commnities = [...Array(6)].map((d, i) => {
            return {
                'id': i
            }
        })

        let simulation = d3.forceSimulation(commnities, 3)
            .force("charge", d3.forceManyBody()
                .strength(d => -50)
                // .theta(0.7)
                // .distanceMin(0.01) 
                // .distanceMax(1) 
            )
            .force("center", d3.forceCenter(0, 0, 0))
            .force("collide", d3.forceCollide(2))
            .tick(100)

        for (let i = 0; i <= 5; i++) {

            let subnodes = objects.nodes.filter(d => d.userData.group == i).map(d => {
                return {
                    id: d.userData.id,
                    name: d.userData.name,
                    group: d.userData.group
                }
            })
            let sublinks = objects.links.filter(d => groupData['node' + d.userData.source] == i && groupData['node' + d.userData.target] == i).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })


            let simulation = d3.forceSimulation(subnodes, 3)
                .force("charge", d3.forceManyBody()
                    .strength(d => 0.1)
                    // .theta(0.7)
                    // .distanceMin(0.01) 
                    // .distanceMax(1) 
                )
                .force("link", d3.forceLink(sublinks).id(d => d.id)
                    // .distance(0.5)
                    // .strength(d => d.source.group == d.target.group ? 1 : 0.1)
                )
                // .force('x',d3.forceX().strength(d=>0))
                // .force('y',d3.forceY().strength(d=>0))
                // .force('z',d3.forceZ().strength(d=>0))
                .force("center", d3.forceCenter(commnities[i].x, commnities[i].y, commnities[i].z)
                    .strength(0.01))
                // .force("collision", d3.forceCollide(5))
                .tick(100)

            subnodes.forEach(d => {

                let nodeMesh = objects.nodes.find(s => s.name == 'node_' + d.id)

                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                clique_mapping_1D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                clique_mapping_2D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, commnities[i].y, d.z))
                clique_mapping_3D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                nodeMesh.position.copy(clique_mapping_2D['node' + d.id])


            })
        }

        //     console.log(JSON.stringify(clique_mapping_1D));
        console.log(JSON.stringify(clique_mapping_2D));
        console.log(JSON.stringify(clique_mapping_3D));


        //     // let nodes_data = {}
        //     // let links_data = []
        //     // let linksL = []


        //     // objects.links.forEach(linkMesh => {

        //     //     const line = new THREE.CatmullRomCurve3([
        //     //         mapping['node' + linkMesh.userData.source],
        //     //         mapping['node' + linkMesh.userData.target]
        //     //     ]);


        //     //     if (groupData['node' + linkMesh.userData.source] != groupData['node' + linkMesh.userData.target]) {

        //     //         links_data.push({
        //     //             source: linkMesh.userData.source,
        //     //             target: linkMesh.userData.target
        //     //         })

        //     //         linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.05));

        //     //         linksL.push(linkMesh)
        //     //     }
        //     //     else {
        //     //         linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2));
        //     //     }

        //     // })


        //     // Object.keys(mapping).forEach(d => {
        //     //     nodes_data[d.replace('node', '')] = { x: mapping[d].x, y: mapping[d].y, z: mapping[d].z }
        //     // })

        //     // let bundleRes = forceBundling()
        //     //     .nodes(nodes_data)
        //     //     .edges(links_data)
        //     //     .compatibility_threshold(0.6)
        //     //     ()

        //     // linksL.forEach((d, i) => {
        //     //     d.geometry.copy(new THREE.TubeBufferGeometry(
        //     //         new THREE.CatmullRomCurve3(
        //     //             bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z))
        //     //         )
        //     //         ,100,
        //     //         .02)
        //     //         // , false, 'catmullrom', 0.1
        //     //         );
        //     // })
    }

    // !function () {

    //     renderer.render(scene, camera);
    //     stats.update()

    //     objects.labels.forEach(text => {
    //         text.quaternion.copy(camera.quaternion)
    //     })

    //     // controls.update()
    //     requestAnimationFrame(arguments.callee)
    // }()


}

function socialGraph(data) {


    window.graphGroup = new THREE.Object3D()

    let nodes = data.nodes;
    let links = data.links;

    window.clique_mapping_init = data.INIT
    window.clique_mapping_1D = data.L1D
    window.clique_mapping_2D = data.L2D
    window.clique_mapping_3D = data.L3D

    Object.keys(clique_mapping_init).forEach(d => {
        clique_mapping_init[d] = new THREE.Vector3(clique_mapping_init[d].x, clique_mapping_init[d].y, clique_mapping_init[d].z)
        clique_mapping_1D[d] = new THREE.Vector3(clique_mapping_1D[d].x, clique_mapping_1D[d].y, clique_mapping_1D[d].z)
        clique_mapping_2D[d] = new THREE.Vector3(clique_mapping_2D[d].x, clique_mapping_2D[d].y, clique_mapping_2D[d].z)
        clique_mapping_3D[d] = new THREE.Vector3(clique_mapping_3D[d].x, clique_mapping_3D[d].y, clique_mapping_3D[d].z)
    })

    let mapping = {}
    let groupData = {}

    let classColor = {
        "2BIO1": "#9624ce",
        "2BIO2": "#2496ce",
        "2BIO3": "#96ce25",

        "PC": "#cf9623",
        "PC*": "#0fbb78",
        "PSI*": "#ff0F4F",

        "MP": "#ce2395",
        "MP*1": '#25ce24',
        "MP*2": "#2424ce"
    }

    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(2, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: classColor[node.group],
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        // nodeMesh.name = 'node_' + node.id;

        // extra data attributes

        let joints = []

        data.links.forEach((link, i) => {
            if (link.source == node.id) {
                joints.push(i)
            }

            if (link.target == node.id) {
                joints.push(i)
            }
        })

        nodeMesh.name = 'node_' + node.id;
        nodeMesh.userData.joints = joints
        nodeMesh.userData.class = node.group;
        nodeMesh.userData.id = node.id;
        // nodeMesh.userData.sex = node.sex;

        if (['MP*2', 'MP', '2BIO1'].includes(node.group)) {
            nodeMesh.visible = true;
        }
        else {
            nodeMesh.visible = false;
        }

        nodeMesh.needsUpdate = true;

        // nodeMesh.position.fromArray([node.x, node.y, node.z])
        nodeMesh.position.copy(clique_mapping_init['node' + node.id])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (link) => {

        const line = new THREE.CatmullRomCurve3([
            clique_mapping_init['node' + link.source],
            clique_mapping_init['node' + link.target]
            // new THREE.Vector3(link.source.x, link.source.y, link.source.z),
            // new THREE.Vector3(link.target.x, link.target.y, link.target.z)
        ]);

        let lineMaterial = new THREE.MeshStandardMaterial({
            color: groupData['node' + link.source] == groupData['node' + link.target] ? classColor[groupData['node' + link.source]] : '#eee',
            // color:'#96ce25',
            // opacity: link.relation*0.15,
            metalness: 0,
            roughness: 0,
            transparent: true,
            envMapIntensity: 1,
        });

        //[1,744]
        let lineGeometry = new THREE.TubeBufferGeometry(line, 100, Math.sqrt(link.value) * 0.05);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        if (['MP*2', 'MP', '2BIO1'].includes(groupData['node'+link.source])&&['MP*2', 'MP', '2BIO1'].includes(groupData['node'+link.target])) {
            linkMesh.visible = true;
        }
        else{
            linkMesh.visible = false;

        }

        // link.geometry.computeBoundingBox();

        linkMesh.name = `${link.source}-${link.target}`;
        linkMesh.needsUpdate = true;

        linkMesh.userData.source = link.source;
        linkMesh.userData.target = link.target;
        linkMesh.userData.value = link.value;

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)

    }

    nodes.forEach(d => {
        groupData['node' + d.id] = d.group
        createNode(d)
    })
    links.forEach(d => createLink(d))


    // updateLayout(clique_mapping_3D)
    // bundleByGloble()   
    addLabel(clique_mapping_init)

    function addLabel(clique_mapping) {

        const loader = new THREE.FontLoader();
        loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {

            const matLite = new THREE.MeshBasicMaterial({
                color: '#fff',
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });

            nodes.forEach(node => {

                const message = node.id;

                const shapes = font.generateShapes(message, 3);

                const geometry = new THREE.ShapeGeometry(shapes);

                const text = new THREE.Mesh(geometry, matLite);

                // if (node.group == 'MP*2') {
                //     text.position.copy(clique_mapping_3D['node' + node.id])
                // }
                // else {
                //     text.position.copy(clique_mapping_1D['node' + node.id])
                // }

                // if (['MP*2', 'MP', '2BIO1'].includes(node.group)){
                //     text.visible = true;
                // }
                // else{
                //     text.visible = false;

                // }

                text.name = 'text_' + node.id

                text.position.copy(clique_mapping['node' + node.id])

                text.position.x += 4;
                // text.position.y += 1;
                // text.position.z += 1;

                text.needsUpdate = true;

                // text.lookAt(camera.position)

                text.quaternion.copy(camera.quaternion)

                objects.labels.push(text)

                graphGroup.add(text);
            })

        })
    }

    scene.add(graphGroup)


    // !function () {

    //     renderer.render(scene, camera);
    //     stats.update()
    //     objects.labels.forEach(text => {
    //         text.quaternion.copy(camera.quaternion)
    //     })

    //     controls.update()
    //     requestAnimationFrame(arguments.callee)
    // }()



    function bundleByGloble() {

        let nodes_data = {}

        objects.nodes.forEach(d => {

            let pos = new THREE.Vector3()
            // d.getWorldPosition(pos)
            nodes_data[d.userData.id] = d.position

        })

        let links_data = objects.links.map((linkMesh, i) => {
            return {
                index: i,
                source: linkMesh.userData.source,
                target: linkMesh.userData.target
            }
        })

        let bundleRes = forceBundling()
            .nodes(nodes_data)
            .edges(links_data)
            .compatibility_threshold(0.7)
            ()

        bundleRes.forEach(d => {
            // console.log(d);
            objects.links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                Math.sqrt(objects.links[d[0].index].userData.value) * 0.05)
            );
        })

    }

    function updateLayout(clique_mapping) {

        objects.nodes.forEach(nodeMesh => {
            if (nodeMesh.userData.class == 'MP*2' && 0) {
                nodeMesh.position.copy(clique_mapping_3D['node' + nodeMesh.userData.id])
            }
            else {
                nodeMesh.position.copy(clique_mapping['node' + nodeMesh.userData.id])
            }
        })

        objects.links.forEach(linkMesh => {

            let line;


            // if (0) {

            // }
            // if (groupData['node' + linkMesh.userData.source] == 'MP*2'&&groupData['node' + linkMesh.userData.target] == 'MP*2') {

            //     line = new THREE.CatmullRomCurve3([
            //         clique_mapping_3D['node' + linkMesh.userData.source],
            //         clique_mapping_3D['node' + linkMesh.userData.target]
            //     ]);
            // }
            // else if(groupData['node' + linkMesh.userData.source] == 'MP*2'&&groupData['node' + linkMesh.userData.target] != 'MP*2'){
            //     line = new THREE.CatmullRomCurve3([
            //         clique_mapping_3D['node' + linkMesh.userData.source],
            //         clique_mapping['node' + linkMesh.userData.target]
            //     ]);
            // }
            // else if(groupData['node' + linkMesh.userData.source] != 'MP*2'&&groupData['node' + linkMesh.userData.target] == 'MP*2'){
            //     line = new THREE.CatmullRomCurve3([
            //         clique_mapping['node' + linkMesh.userData.source],
            //         clique_mapping_3D['node' + linkMesh.userData.target]
            //     ]);
            // }
            // else {
            //     line = new THREE.CatmullRomCurve3([
            //         clique_mapping['node' + linkMesh.userData.source],
            //         clique_mapping['node' + linkMesh.userData.target]
            //     ]);
            // }

            line = new THREE.CatmullRomCurve3([
                clique_mapping['node' + linkMesh.userData.source],
                clique_mapping['node' + linkMesh.userData.target]
            ]);

            linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, Math.sqrt(linkMesh.userData.value) * 0.08));

        })
    }

}

function socialGraphPro(data) {

    window.graphGroup = new THREE.Object3D()

    let nodes = data.nodes;
    let links = data.links;

    let groupData = {}
    let mapping = {}


    let simulation = d3.forceSimulation(nodes, 3)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("center", d3.forceCenter(0, 0, 0))
        .tick(500)

    let group = [
        "2BIO1",
        "2BIO2",
        "2BIO3",
        "PC",
        "PC*",
        "PSI*",
        "MP",
        "MP*1",
        "MP*2"
    ]

    let classColor = {
        "2BIO1": "#9624ce",
        "2BIO2": "#2496ce",
        "2BIO3": "#96ce25",

        "PC": "#cf9623",
        "PC*": "#0fbb78",
        "PSI*": "#ff0F4F",

        "MP": "#ce2395",
        "MP*1": '#25ce24',
        "MP*2": "#2424ce"
    }

    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(2.5, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: classColor[node.group],
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        nodeMesh.name = 'node_' + node.id;

        // extra data attributes
        nodeMesh.userData.class = node.group;
        nodeMesh.userData.id = node.id;
        // nodeMesh.userData.sex = node.sex;

        nodeMesh.needsUpdate = true;

        nodeMesh.position.fromArray([node.x, node.y, node.z])
        // nodeMesh.position.copy(clique_mapping_init['node' + node.id])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (link) => {

        const line = new THREE.CatmullRomCurve3([
            // clique_mapping_init['node' + link.source],
            // clique_mapping_init['node' + link.target]
            new THREE.Vector3(link.source.x, link.source.y, link.source.z),
            new THREE.Vector3(link.target.x, link.target.y, link.target.z)
        ]);

        let lineMaterial = new THREE.MeshStandardMaterial({
            color: link.source.group == link.target.group ? classColor[link.source.group] : '#eee',
            // color:'#96ce25',
            // opacity: link.relation*0.15,
            metalness: 0,
            roughness: 0,
            transparent: true,
            envMapIntensity: 1,
        });

        let lineGeometry = new THREE.TubeBufferGeometry(line, 100, 0.1);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        // link.geometry.computeBoundingBox();

        linkMesh.name = `${link.source.id}-${link.target.id}`;
        linkMesh.needsUpdate = true;

        linkMesh.userData.source = link.source.id;
        linkMesh.userData.target = link.target.id;

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)

    }

    nodes.forEach(node => {
        groupData['node' + node.id] = node.group
        mapping['node' + node.id] = new THREE.Vector3().fromArray([node.x, node.y, node.z])
        createNode(node)
    })

    links.forEach(link => {
        createLink(link)
    })

    scene.add(graphGroup)

    // window.clique_mapping_INIT = {}
    window.clique_mapping_1D = {}
    window.clique_mapping_2D = {}
    window.clique_mapping_3D = {}

    cliqueLayout()

    function cliqueLayout() {

        let commnities = [...Array(9)].map((d, i) => {
            return {
                'id': group[i]
            }
        })

        let simulation = d3.forceSimulation(commnities, 3)
            .force("charge", d3.forceManyBody()
                // .strength(d => -50)
                // .theta(0.7)
                // .distanceMin(0.01) 
                // .distanceMax(1) 
            )
            .force("center", d3.forceCenter(0, 0, 0))
            // .force("collide", d3.forceCollide(2))
            .tick(100)

        for (let i = 0; i < 9; i++) {

            let subnodes = objects.nodes.filter(d => d.userData.class == group[i]).map(d => {
                return {
                    id: d.userData.id,
                    group: d.userData.group
                }
            })
            let sublinks = objects.links.filter(d => groupData['node' + d.userData.source] == group[i] && groupData['node' + d.userData.target] == group[i]).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })


            let simulation = d3.forceSimulation(subnodes, 3)
                .force("charge", d3.forceManyBody()
                    .strength(d => -5)
                    // .theta(0.7)
                    // .distanceMin(0.01) 
                    // .distanceMax(1) 
                )
                .force("link", d3.forceLink(sublinks).id(d => d.id)
                    // .distance(0.5)
                    .strength(d => d.source.group == d.target.group ? 1 : 0.1)
                )
                // .force('x',d3.forceX().strength(d=>0))
                // .force('y',d3.forceY().strength(d=>0))
                // .force('z',d3.forceZ().strength(d=>0))
                .force("center", d3.forceCenter(commnities[i].x, commnities[i].y, commnities[i].z)
                    .strength(0.01))
                .force("collision", d3.forceCollide(5))
                .tick(100)

            subnodes.forEach(d => {

                let nodeMesh = objects.nodes.find(s => s.name == 'node_' + d.id)

                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                // mapping['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                clique_mapping_1D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                clique_mapping_2D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                clique_mapping_3D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))
                // nodeMesh.position.copy(clique_mapping_1D['node' + d.id])

            })
        }

        console.log(JSON.stringify(mapping));
        console.log(JSON.stringify(clique_mapping_1D));
        console.log(JSON.stringify(clique_mapping_2D));
        console.log(JSON.stringify(clique_mapping_3D));

    }


    // bundleByGloble()

    function bundleByGloble() {

        let nodes_data = {}

        objects.nodes.forEach(d => {

            let pos = new THREE.Vector3()
            // d.getWorldPosition(pos)
            nodes_data[d.userData.id] = d.position

        })

        let links_data = objects.links.map((linkMesh, i) => {
            return {
                index: i,
                source: linkMesh.userData.source,
                target: linkMesh.userData.target
            }
        })

        let bundleRes = forceBundling()
            .nodes(nodes_data)
            .edges(links_data)
            .compatibility_threshold(0.7)
            ()

        bundleRes.forEach(d => {
            // console.log(d);
            objects.links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                .1)
            );
        })

    }

    !function () {

        renderer.render(scene, camera);
        stats.update()

        // controls.update()
        requestAnimationFrame(arguments.callee)
    }()


}

function citationGraphPro(data) {

    window.graphGroup = new THREE.Object3D();
    graphGroup.name = 'graphGroup';

    let groupData = {}

    window.clique_mapping_init = data.INIT
    window.clique_mapping_1D = data.L1D
    window.clique_mapping_2D = data.L2D
    window.clique_mapping_3D = data.L3D

    Object.keys(clique_mapping_init).forEach(d => {
        clique_mapping_init[d] =
            new THREE.Vector3(clique_mapping_init[d].x, clique_mapping_init[d].y, clique_mapping_init[d].z)
        // clique_mapping_1D[d] = new THREE.Vector3(clique_mapping_1D[d].x, clique_mapping_1D[d].y, clique_mapping_1D[d].z)
        // clique_mapping_2D[d] = new THREE.Vector3(clique_mapping_2D[d].x, clique_mapping_2D[d].y, clique_mapping_2D[d].z)
        // clique_mapping_3D[d] = new THREE.Vector3(clique_mapping_3D[d].x, clique_mapping_3D[d].y, clique_mapping_3D[d].z)
    })

    let nodes = data.nodes;
    let links = data.links;

    let colors = ["#4e79a7", "#f28e2c", "#ff5759", "#76b702", "#09a14f", "#ed0949", "#0f7aa1", "#ff00a7", "#40f5ff", "#00eeab"]

    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(node.value / 100 + 1, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: colors[node.group % 10],
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            // transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        nodeMesh.needsUpdate = true;
        nodeMesh.name = 'node_' + node.id;

        nodeMesh.userData.group = node.group
        nodeMesh.userData.id = node.id
        // nodeMesh.userData.name = node.name

        // nodeMesh.position.fromArray([node.x, node.y, node.z])
        nodeMesh.position.copy(clique_mapping_init['node' + node.id])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (link) => {

        let start = clique_mapping_init['node' + link.source.id]
        let end = clique_mapping_init['node' + link.target.id]

        const line = new THREE.CatmullRomCurve3([
            // new THREE.Vector3(link.source.x, link.source.y, link.source.z),
            // new THREE.Vector3(link.target.x, link.target.y, link.target.z)
            start,
            end
        ]);


        let lineMaterial = new THREE.MeshStandardMaterial({
            // color: '#ddd',
            color: groupData['node' + link.source.id] == groupData['node' + link.target.id] ? colors[groupData['node' + link.target.id] % 10] : '#666',
            metalness: 0,
            roughness: 0,
            // opacity:link.value / 50 + 0.2,
            // transparent: true,
            envMapIntensity: 1,
        });

        let lineGeometry = new THREE.TubeBufferGeometry(line, 100, link.value / 50 + 0.03);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        linkMesh.name = `${link.source.id}-${link.target.id}`;
        // link.needsUpdate = true;

        linkMesh.userData.source = link.source.id;
        linkMesh.userData.target = link.target.id;
        linkMesh.userData.value = link.value;

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)


        // let lineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(link.source.x, link.source.y, link.source.z),
        //     new THREE.Vector3(link.target.x, link.target.y, link.target.z)
        // ]);

        // let lineMaterial = new THREE.LineBasicMaterial({
        //     color: '#fff',
        //     opacity: 0.5,
        //     transparent: true
        // })

        // lineGeometry.verticesNeedUpdate = true;
        // lineGeometry.dynamic = true;

        // let linkMesh = new THREE.Line(lineGeometry, lineMaterial);
        // linkMesh.name = link.source.id + '-' + link.target.id
        // linkMesh.needsUpdate = true;

        // objects.links.push(linkMesh)
        // graphGroup.add(linkMesh)
    }

    nodes.forEach(d => {

        // mapping['node' + d.id] = new THREE.Vector3(d.x*scale, d.y*scale, d.z*scale)
        groupData['node' + d.id] = d.group
        createNode(d)
    })

    links.forEach(d => createLink(d))

    scene.add(graphGroup)

    !function () {

        renderer.render(scene, camera);
        stats.update()
        objects.labels.forEach(text => {
            text.quaternion.copy(camera.quaternion)
        })
        // controls.update()
        requestAnimationFrame(arguments.callee)
    }()

    // cliqueLayout()

    function cliqueLayout() {

        let commnities = [...Array(53)].map((d, i) => {
            return {
                'id': '' + i
            }
        })

        let simulation = d3.forceSimulation(commnities, 3)
            .force("charge", d3.forceManyBody()
                .strength(d => -10)
                // .theta(0.7)
                // .distanceMin(0.01) 
                // .distanceMax(1) 
            )
            .force("center", d3.forceCenter(0, 0, 0))
            // .force("collide", d3.forceCollide(2))
            .tick(200)

        for (let i = 0; i <= 52; i++) {

            let subnodes = objects.nodes.filter(d => d.userData.group == '' + i).map(d => {
                return {
                    id: d.userData.id,
                    // name: d.userData.name,
                    group: d.userData.group
                }
            })
            let sublinks = objects.links.filter(d => groupData['node' + d.userData.source] == '' + i && groupData['node' + d.userData.target] == '' + i).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })

            let simulation = d3.forceSimulation(subnodes, 3)
                .force("charge", d3.forceManyBody()
                    .strength(d => -5)
                    // .theta(0.7)
                    // .distanceMin(0.01) 
                    // .distanceMax(1) 
                )
                .force("link", d3.forceLink(sublinks).id(d => d.id)
                    // .distance(0.5)
                    // .strength(d => d.source.group == d.target.group ? 1 : 0.1)
                )
                // .force('x', d3.forceX().strength(d => 0))
                // .force('y', d3.forceY().strength(d => 0))
                // .force('z', d3.forceZ().strength(d => 0))
                .force("center", d3.forceCenter(commnities[i].x, commnities[i].y, commnities[i].z))
                // .strength(0.01))
                // .force("collision", d3.forceCollide(5))
                .tick(100)

            subnodes.forEach(d => {

                let nodeMesh = objects.nodes.find(s => s.name == 'node_' + d.id)

                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                clique_mapping_1D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                clique_mapping_2D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                clique_mapping_3D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))


                // nodeMesh.position.copy(mapping['node' + d.name]);

            })
        }

        console.log(JSON.stringify(clique_mapping_1D));
        console.log(JSON.stringify(clique_mapping_2D));
        console.log(JSON.stringify(clique_mapping_3D));


        let nodes_data = {}
        let links_data = []
        let linksL = []


        // objects.links.forEach(linkMesh => {

        //     const line = new THREE.CatmullRomCurve3([
        //         mapping['node' + linkMesh.userData.source],
        //         mapping['node' + linkMesh.userData.target]
        //     ]);

        //     linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, linkMesh.userData.value / 50 + 0.03));

        //     // if (groupData['node' + linkMesh.userData.source] != groupData['node' + linkMesh.userData.target]) {

        //     //     // links_data.push({
        //     //     //     source: linkMesh.userData.source,
        //     //     //     target: linkMesh.userData.target
        //     //     // })

        //     //     linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.05));

        //     //     // linksL.push(linkMesh)
        //     // }
        //     // else {
        //     //     linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2));
        //     // }

        // })

        // Object.keys(mapping).forEach(d => {
        //     nodes_data[d.replace('node', '')] = { x: mapping[d].x, y: mapping[d].y, z: mapping[d].z }
        // })

        // let bundleRes = forceBundling()
        //     .nodes(nodes_data)
        //     .edges(links_data)
        //     .compatibility_threshold(0.5)
        //     ()

        // linksL.forEach((d, i) => {
        //     d.geometry.copy(new THREE.TubeBufferGeometry(
        //         new THREE.CatmullRomCurve3(
        //             bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z))
        //         )
        //         ,100,
        //         .02)
        //         // , false, 'catmullrom', 0.1
        //         );
        // })
    }

}

function citationGraph(data) {
    window.graphGroup = new THREE.Object3D()

    let nodes = data.nodes;
    let links = data.links.map(d => {
        return {
            source: d.source.name,
            target: d.target.name,
            value: d.value
        }
    });

    let groupData = {}
    let mapping = {}

    window.clique_mapping_init = data.INIT
    window.clique_mapping_1D = data.L1D
    window.clique_mapping_2D = data.L2D
    window.clique_mapping_3D = data.L3D

    Object.keys(clique_mapping_init).forEach(d => {
        clique_mapping_init[d] = new THREE.Vector3(clique_mapping_init[d].x, clique_mapping_init[d].y, clique_mapping_init[d].z)
        clique_mapping_1D[d] = new THREE.Vector3(clique_mapping_1D[d].x, clique_mapping_1D[d].y, clique_mapping_1D[d].z)
        clique_mapping_2D[d] = new THREE.Vector3(clique_mapping_2D[d].x, clique_mapping_2D[d].y, clique_mapping_2D[d].z)
        clique_mapping_3D[d] = new THREE.Vector3(clique_mapping_3D[d].x, clique_mapping_3D[d].y, clique_mapping_3D[d].z)
    })

    let colors = ["#4e79a7", "#f28e2c", "#ff5759", "#76b702", "#09a14f", "#ed0949", "#0f7aa1", "#ff00a7", "#40f5ff", "#00eeab"]


    let createNode = (node) => {

        let nodeGeometry = new THREE.SphereGeometry(Math.sqrt(node.value) * 0.5, 25, 25);
        let nodeMaterial = new THREE.MeshStandardMaterial({
            color: colors[node.group % 10],
            metalness: 0,
            roughness: 0,
            opacity: 1,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        nodeMesh.name = 'node_' + node.name;

        // extra data attributes
        nodeMesh.userData.group = node.group;
        nodeMesh.userData.name = node.name;
        // nodeMesh.userData.sex = node.sex;

        if (!['5', '0', '2', '3', '4', '1', '8'].includes(node.group)) {
            nodeMesh.visible = false
        }

        nodeMesh.needsUpdate = true;

        // nodeMesh.position.fromArray([node.x, node.y, node.z])
        nodeMesh.position.copy(clique_mapping_init['node' + node.name])

        graphGroup.add(nodeMesh)

        objects.nodes.push(nodeMesh)

    }

    let createLink = (link) => {

        const line = new THREE.CatmullRomCurve3([
            clique_mapping_init['node' + link.source],
            clique_mapping_init['node' + link.target]
            // new THREE.Vector3(link.source.x, link.source.y, link.source.z),
            // new THREE.Vector3(link.target.x, link.target.y, link.target.z)
        ]);

        let lineMaterial = new THREE.MeshStandardMaterial({
            // color: link.source.group == link.target.group ? classColor[link.source.group] : '#eee',
            color: '#c0c0c0',
            // opacity: link.relation*0.15,
            metalness: 0,
            roughness: 0,
            transparent: true,
            envMapIntensity: 1,
        });

        let lineGeometry = new THREE.TubeBufferGeometry(line, 100, Math.sqrt(link.value) * 0.2);

        lineGeometry.verticesNeedUpdate = true;
        lineGeometry.dynamic = true;

        let linkMesh = new THREE.Mesh(lineGeometry, lineMaterial);

        // link.geometry.computeBoundingBox();

        linkMesh.name = `${link.source}-${link.target}`;
        linkMesh.needsUpdate = true;

        linkMesh.userData.source = link.source;
        linkMesh.userData.target = link.target;
        linkMesh.userData.value = link.value;

        // if(['5','0','2','3','4','1','8'].includes(groupData['node'+link.source])&&['5','0','2','3','4','1','8'].includes(groupData['node'+link.target])){
        //     linkMesh.visible = true
        // }
        // else{
        //     linkMesh.visible = false
        // }

        objects.links.push(linkMesh)
        graphGroup.add(linkMesh)

    }

    nodes.forEach(node => {
        // mapping['node'+node.name] = new THREE.Vector3().fromArray([node.x,node.y,node.z])
        groupData['node' + node.name] = node.group
        createNode(node)
    })

    links.forEach(link => {
        createLink(link)
    })

    scene.add(graphGroup)

    // bundleByGloble()

    function bundleByGloble() {

        let nodes_data = {}

        objects.nodes.forEach(d => {

            let pos = new THREE.Vector3()
            // d.getWorldPosition(pos)
            nodes_data[d.userData.name] = d.position

        })

        let links_data = objects.links.map((linkMesh, i) => {
            return {
                index: i,
                source: linkMesh.userData.source,
                target: linkMesh.userData.target
            }
        })

        let bundleRes = forceBundling()
            .nodes(nodes_data)
            .edges(links_data)
            .compatibility_threshold(0.3)
            ()

        bundleRes.forEach(d => {
            // console.log(d);
            objects.links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                Math.sqrt(objects.links[d[0].index].userData.value) * 0.2)
            );
        })

    }

    // cliqueLayout()

    function cliqueLayout() {

        let commnities = [...Array(63)].map((d, i) => {
            return {
                'id': '' + i
            }
        })

        let simulation = d3.forceSimulation(commnities, 3)
            .force("charge", d3.forceManyBody()
                .strength(d => -10)
                // .theta(0.7)
                // .distanceMin(0.01) 
                // .distanceMax(1) 
            )
            .force("center", d3.forceCenter(0, 0, 0))
            // .force("collide", d3.forceCollide(2))
            .tick(200)

        for (let i = 0; i < 63; i++) {

            let subnodes = objects.nodes.filter(d => d.userData.group == '' + i).map(d => {
                return {
                    id: d.userData.name,
                    // name: d.userData.name,
                    group: d.userData.group
                }
            })
            let sublinks = objects.links.filter(d => groupData['node' + d.userData.source] == '' + i && groupData['node' + d.userData.target] == '' + i).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })

            let simulation = d3.forceSimulation(subnodes, 3)
                .force("charge", d3.forceManyBody()
                    .strength(d => -5)
                    // .theta(0.7)
                    // .distanceMin(0.01) 
                    // .distanceMax(1) 
                )
                .force("link", d3.forceLink(sublinks).id(d => d.id)
                    // .distance(0.5)
                    // .strength(d => d.source.group == d.target.group ? 1 : 0.1)
                )
                // .force('x', d3.forceX().strength(d => 0))
                // .force('y', d3.forceY().strength(d => 0))
                // .force('z', d3.forceZ().strength(d => 0))
                .force("center", d3.forceCenter(commnities[i].x, commnities[i].y, commnities[i].z))
                // .strength(0.01))
                // .force("collision", d3.forceCollide(5))
                .tick(100)

            subnodes.forEach(d => {

                let nodeMesh = objects.nodes.find(s => s.name == 'node_' + d.id)

                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                // mapping['node' + d.name] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))

                clique_mapping_1D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, commnities[i].y, d.z))
                clique_mapping_2D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(commnities[i].x, d.y, d.z))
                clique_mapping_3D['node' + d.id] = nodeMesh.parent.worldToLocal(new THREE.Vector3(d.x, d.y, d.z))


                nodeMesh.position.copy(clique_mapping_3D['node' + d.id]);

            })
        }

        // console.log(JSON.stringify(mapping));
        // console.log(JSON.stringify(clique_mapping_1D));
        // console.log(JSON.stringify(clique_mapping_2D));
        // console.log(JSON.stringify(clique_mapping_3D));

    }


    updateLayout(clique_mapping_1D)

    function updateLayout(clique_mapping) {

        objects.nodes.forEach(nodeMesh => {
            nodeMesh.position.copy(clique_mapping['node' + nodeMesh.userData.name])
        })

        objects.links.forEach(linkMesh => {

            const line = new THREE.CatmullRomCurve3([
                clique_mapping['node' + linkMesh.userData.source],
                clique_mapping['node' + linkMesh.userData.target]
            ]);

            linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, Math.sqrt(linkMesh.userData.value) * 0.2));

        })
    }

    addLabel(clique_mapping_1D)

    function addLabel(clique_mapping) {

        const loader = new THREE.FontLoader();
        loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {

            const matLite = new THREE.MeshBasicMaterial({
                color: '#fff',
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });

            nodes.forEach(node => {

                // if (node.group == 7) {
                const message = node.name;

                const shapes = font.generateShapes(message, 3);

                const geometry = new THREE.ShapeGeometry(shapes);

                const text = new THREE.Mesh(geometry, matLite);

                if (!['5', '0', '2', '3', '4', '1', '8'].includes(node.group)) {
                    text.visible = false
                }

                text.position.copy(clique_mapping['node' + node.name])
                // text.position.fromArray([node.x, node.y, node.z])

                text.position.x += (3 + Math.sqrt(node.value) * 0.5);
                // text.position.y += 1;
                // text.position.z += 5;

                text.needsUpdate = true;

                // text.lookAt(camera.position)

                text.quaternion.copy(camera.quaternion)

                objects.labels.push(text)

                graphGroup.add(text);
                // }

            })

        })
    }

    // objects.nodes.forEach(nodeMesh => {
    //     if (nodeMesh.userData.group != 7)
    //         nodeMesh.visible = false
    // })

    // objects.links.forEach(linkMesh => {
    //     if (!(groupData['node' + linkMesh.userData.source] == 7 && groupData['node' + linkMesh.userData.target] == 7))
    //         linkMesh.visible = false
    // })


    !function () {

        renderer.render(scene, camera);
        stats.update()

        objects.labels.forEach(text => {
            text.quaternion.copy(camera.quaternion)
        })

        // controls.update()
        requestAnimationFrame(arguments.callee)
    }()
}

function forceBundling() {
    var data_nodes = {}, // {'nodeid':{'x':,'y':,'z':},..}
        data_edges = [], // [{'source':'nodeid1', 'target':'nodeid2'},..]
        compatibility_list_for_edge = [],
        subdivision_points_for_edge = [],
        K = 0.3, // global bundling constant controlling edge stiffness
        S_initial = 0.1, // init. distance to move points
        P_initial = 1, // init. subdivision number
        P_rate = 2, // subdivision rate increase
        C = 10, // number of cycles to perform
        I_initial = 90, // init. number of iterations for cycle
        I_rate = 0.333333, // rate at which iteration number decreases i.e. 2/3
        compatibility_threshold = 0.6,
        eps = 1e-6;

    /*** Geometry Helper Methods ***/
    function vector_dot_product(p, q) {
        return p.x * q.x + p.y * q.y + p.z * q.z;
    }

    function edge_as_vector(P) {
        return {
            'x': data_nodes[P.target].x - data_nodes[P.source].x,
            'y': data_nodes[P.target].y - data_nodes[P.source].y,
            'z': data_nodes[P.target].z - data_nodes[P.source].z
        }
    }

    function edge_length(e) {
        // handling nodes that are on the same location, so that K/edge_length != Inf
        if (Math.abs(data_nodes[e.source].x - data_nodes[e.target].x) < eps &&
            Math.abs(data_nodes[e.source].y - data_nodes[e.target].y) < eps &&
            Math.abs(data_nodes[e.source].z - data_nodes[e.target].z) < eps) {
            return eps;
        }

        return Math.sqrt(Math.pow(data_nodes[e.source].x - data_nodes[e.target].x, 2) +
            Math.pow(data_nodes[e.source].y - data_nodes[e.target].y, 2) +
            Math.pow(data_nodes[e.source].z - data_nodes[e.target].z, 2));
    }

    function custom_edge_length(e) {
        return Math.sqrt(
            Math.pow(e.source.x - e.target.x, 2) +
            Math.pow(e.source.y - e.target.y, 2) +
            Math.pow(e.source.z - e.target.z, 2));
    }

    function edge_midpoint(e) {
        var middle_x = (data_nodes[e.source].x + data_nodes[e.target].x) / 2.0;
        var middle_y = (data_nodes[e.source].y + data_nodes[e.target].y) / 2.0;
        var middle_z = (data_nodes[e.source].z + data_nodes[e.target].z) / 2.0;

        return {
            // 'index':e.index,
            'x': middle_x,
            'y': middle_y,
            'z': middle_z
        };
    }

    function compute_divided_edge_length(e_idx) {

        var length = 0;

        for (var i = 1; i < subdivision_points_for_edge[e_idx].length; i++) {
            var segment_length = euclidean_distance(subdivision_points_for_edge[e_idx][i], subdivision_points_for_edge[e_idx][i - 1]);
            length += segment_length;
        }

        return length;
    }

    function euclidean_distance(p, q) {
        return Math.sqrt(
            Math.pow(p.x - q.x, 2) +
            Math.pow(p.y - q.y, 2) +
            Math.pow(p.z - q.z, 2));
    }

    function project_point_on_line(p, Q) {
        // var L = Math.sqrt((Q.target.x - Q.source.x) * (Q.target.x - Q.source.x) +
        //  (Q.target.y - Q.source.y) * (Q.target.y - Q.source.y) +
        //  (Q.target.z - Q.source.z) * (Q.target.z - Q.source.z));

        // var r = (
        //     (Q.source.y - p.y) * (Q.source.y - Q.target.y) -
        //      (Q.source.x - p.x) * (Q.target.x - Q.source.x)
        //      )
        //       / (L * L);

        let vector = [Q.source.x - Q.target.x, Q.source.y - Q.target.y, Q.source.z - Q.target.z]

        let u = (Q.source.x - p.x) * (Q.source.x - Q.target.x) +
            (Q.source.y - p.y) * (Q.target.y - Q.source.y) +
            (Q.source.z - p.z) * (Q.source.z - Q.target.z)

        u = u / (vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2])


        return {
            'x': (Q.source.x + u * (Q.target.x - Q.source.x)),
            'y': (Q.source.y + u * (Q.target.y - Q.source.y)),
            'z': (Q.source.z + u * (Q.target.z - Q.source.z))
        };
    }

    /*** ********************** ***/

    /*** Initialization Methods ***/
    function initialize_edge_subdivisions() {
        for (var i = 0; i < data_edges.length; i++) {
            if (P_initial === 1) {
                subdivision_points_for_edge[i] = []; //0 subdivisions
            } else {
                subdivision_points_for_edge[i] = [];
                subdivision_points_for_edge[i].push(data_nodes[data_edges[i].source]);
                subdivision_points_for_edge[i].push(data_nodes[data_edges[i].target]);
            }
        }
    }

    function initialize_compatibility_lists() {
        for (var i = 0; i < data_edges.length; i++) {
            compatibility_list_for_edge[i] = []; //0 compatible edges.
        }
    }

    function filter_self_loops(edgelist) {
        var filtered_edge_list = [];

        for (var e = 0; e < edgelist.length; e++) {
            if (data_nodes[edgelist[e].source].x != data_nodes[edgelist[e].target].x &&
                data_nodes[edgelist[e].source].y != data_nodes[edgelist[e].target].y &&
                data_nodes[edgelist[e].source].z != data_nodes[edgelist[e].target].z) { //or smaller than eps
                filtered_edge_list.push(edgelist[e]);
            }
        }

        return filtered_edge_list;
    }

    /*** ********************** ***/

    /*** Force Calculation Methods ***/
    function apply_spring_force(e_idx, i, kP) {

        var prev = subdivision_points_for_edge[e_idx][i - 1];
        var next = subdivision_points_for_edge[e_idx][i + 1];
        var crnt = subdivision_points_for_edge[e_idx][i];
        var x = prev.x - crnt.x + next.x - crnt.x;
        var y = prev.y - crnt.y + next.y - crnt.y;
        var z = prev.z - crnt.z + next.z - crnt.z;

        x *= kP;
        y *= kP;
        z *= kP;

        return {
            'index': data_edges[e_idx].index,
            'x': x,
            'y': y,
            'z': z
        };
    }

    function apply_electrostatic_force(e_idx, i) {
        var sum_of_forces = {
            'index': data_edges[e_idx].index,
            'x': 0,
            'y': 0,
            'z': 0
        };
        var compatible_edges_list = compatibility_list_for_edge[e_idx];

        for (var oe = 0; oe < compatible_edges_list.length; oe++) {
            var force = {
                'index': data_edges[e_idx].index,
                'x': subdivision_points_for_edge[compatible_edges_list[oe]][i].x - subdivision_points_for_edge[e_idx][i].x,
                'y': subdivision_points_for_edge[compatible_edges_list[oe]][i].y - subdivision_points_for_edge[e_idx][i].y,
                'z': subdivision_points_for_edge[compatible_edges_list[oe]][i].z - subdivision_points_for_edge[e_idx][i].z
            };

            if ((Math.abs(force.x) > eps) || (Math.abs(force.y) > eps) || (Math.abs(force.z) > eps)) {
                var diff = (1 / Math.pow(custom_edge_length({
                    'source': subdivision_points_for_edge[compatible_edges_list[oe]][i],
                    'target': subdivision_points_for_edge[e_idx][i]
                }), 1));

                sum_of_forces.x += force.x * diff;
                sum_of_forces.y += force.y * diff;
                sum_of_forces.z += force.z * diff;
            }
        }

        return sum_of_forces;
    }

    function apply_resulting_forces_on_subdivision_points(e_idx, P, S) {
        var kP = K / (edge_length(data_edges[e_idx]) * (P + 1)); // kP=K/|P|(number of segments), where |P| is the initial length of edge P.
        // (length * (num of sub division pts - 1))
        var resulting_forces_for_subdivision_points = [{
            'index': data_edges[e_idx].index,
            'x': 0,
            'y': 0,
            'z': 0
        }];

        for (var i = 1; i < P + 1; i++) { // exclude initial end points of the edge 0 and P+1
            var resulting_force = {
                'index': data_edges[e_idx].index,
                'x': 0,
                'y': 0,
                'z': 0
            };

            spring_force = apply_spring_force(e_idx, i, kP);
            electrostatic_force = apply_electrostatic_force(e_idx, i, S);

            resulting_force.x = S * (spring_force.x + electrostatic_force.x);
            resulting_force.y = S * (spring_force.y + electrostatic_force.y);
            resulting_force.z = S * (spring_force.z + electrostatic_force.z);

            resulting_forces_for_subdivision_points.push(resulting_force);
        }

        resulting_forces_for_subdivision_points.push({
            'index': data_edges[e_idx].index,
            'x': 0,
            'y': 0,
            'z': 0
        });

        return resulting_forces_for_subdivision_points;
    }

    /*** ********************** ***/

    /*** Edge Division Calculation Methods ***/
    function update_edge_divisions(P) {
        for (var e_idx = 0; e_idx < data_edges.length; e_idx++) {
            if (P === 1) {
                subdivision_points_for_edge[e_idx].push(data_nodes[data_edges[e_idx].source]); // source
                subdivision_points_for_edge[e_idx].push(edge_midpoint(data_edges[e_idx])); // mid point
                subdivision_points_for_edge[e_idx].push(data_nodes[data_edges[e_idx].target]); // target
            } else {
                var divided_edge_length = compute_divided_edge_length(e_idx);
                var segment_length = divided_edge_length / (P + 1);
                var current_segment_length = segment_length;
                var new_subdivision_points = [];

                var start = {
                    'index': data_edges[e_idx].index,
                    'x': data_nodes[data_edges[e_idx].source].x,
                    'y': data_nodes[data_edges[e_idx].source].y,
                    'z': data_nodes[data_edges[e_idx].source].z
                }

                new_subdivision_points.push(start); //source

                for (var i = 1; i < subdivision_points_for_edge[e_idx].length; i++) {
                    var old_segment_length = euclidean_distance(subdivision_points_for_edge[e_idx][i], subdivision_points_for_edge[e_idx][i - 1]);

                    while (old_segment_length > current_segment_length) {
                        var percent_position = current_segment_length / old_segment_length;
                        var new_subdivision_point_x = subdivision_points_for_edge[e_idx][i - 1].x;
                        var new_subdivision_point_y = subdivision_points_for_edge[e_idx][i - 1].y;
                        var new_subdivision_point_z = subdivision_points_for_edge[e_idx][i - 1].z;

                        new_subdivision_point_x += percent_position * (subdivision_points_for_edge[e_idx][i].x - subdivision_points_for_edge[e_idx][i - 1].x);
                        new_subdivision_point_y += percent_position * (subdivision_points_for_edge[e_idx][i].y - subdivision_points_for_edge[e_idx][i - 1].y);
                        new_subdivision_point_z += percent_position * (subdivision_points_for_edge[e_idx][i].z - subdivision_points_for_edge[e_idx][i - 1].z);
                        new_subdivision_points.push({
                            'index': data_edges[e_idx].index,
                            'x': new_subdivision_point_x,
                            'y': new_subdivision_point_y,
                            'z': new_subdivision_point_z
                        });

                        old_segment_length -= current_segment_length;
                        current_segment_length = segment_length;
                    }
                    current_segment_length -= old_segment_length;
                }

                var end = {
                    'index': data_edges[e_idx].index,
                    'x': data_nodes[data_edges[e_idx].target].x,
                    'y': data_nodes[data_edges[e_idx].target].y,
                    'z': data_nodes[data_edges[e_idx].target].z
                }

                new_subdivision_points.push(end); //target
                subdivision_points_for_edge[e_idx] = new_subdivision_points;
            }
        }
    }

    /*** ********************** ***/

    /*** Edge compatibility measures ***/
    function angle_compatibility(P, Q) {
        return Math.abs(vector_dot_product(edge_as_vector(P), edge_as_vector(Q)) / (edge_length(P) * edge_length(Q)));
    }

    function scale_compatibility(P, Q) {
        var lavg = (edge_length(P) + edge_length(Q)) / 2.0;
        return 2.0 / (lavg / Math.min(edge_length(P), edge_length(Q)) + Math.max(edge_length(P), edge_length(Q)) / lavg);
    }

    function position_compatibility(P, Q) {
        var lavg = (edge_length(P) + edge_length(Q)) / 2.0;
        var midP = {
            'x': (data_nodes[P.source].x + data_nodes[P.target].x) / 2.0,
            'y': (data_nodes[P.source].y + data_nodes[P.target].y) / 2.0,
            'z': (data_nodes[P.source].z + data_nodes[P.target].z) / 2.0
        };
        var midQ = {
            'x': (data_nodes[Q.source].x + data_nodes[Q.target].x) / 2.0,
            'y': (data_nodes[Q.source].y + data_nodes[Q.target].y) / 2.0,
            'z': (data_nodes[Q.source].z + data_nodes[Q.target].z) / 2.0
        };

        return lavg / (lavg + euclidean_distance(midP, midQ));
    }

    function edge_visibility(P, Q) {
        var I0 = project_point_on_line(data_nodes[Q.source], {
            'source': data_nodes[P.source],
            'target': data_nodes[P.target]
        });
        var I1 = project_point_on_line(data_nodes[Q.target], {
            'source': data_nodes[P.source],
            'target': data_nodes[P.target]
        }); //send actual edge points positions
        var midI = {
            'x': (I0.x + I1.x) / 2.0,
            'y': (I0.y + I1.y) / 2.0,
            'z': (I0.z + I1.z) / 2.0
        };
        var midP = {
            'x': (data_nodes[P.source].x + data_nodes[P.target].x) / 2.0,
            'y': (data_nodes[P.source].y + data_nodes[P.target].y) / 2.0,
            'z': (data_nodes[P.source].z + data_nodes[P.target].z) / 2.0
        };

        return Math.max(0, 1 - 2 * euclidean_distance(midP, midI) / euclidean_distance(I0, I1));
    }

    function visibility_compatibility(P, Q) {
        return Math.min(edge_visibility(P, Q), edge_visibility(Q, P));
    }

    function compatibility_score(P, Q) {
        return (
            angle_compatibility(P, Q)
            * position_compatibility(P, Q)
            // * visibility_compatibility(P, Q) 
            // * scale_compatibility(P, Q)
            // (0.3*angle_compatibility(P, Q) + 0.25*scale_compatibility(P, Q) + 0.35*position_compatibility(P, Q)  + 0.1*visibility_compatibility(P, Q))/1
        );
    }

    function are_compatible(P, Q) {
        // return true
        return (compatibility_score(P, Q) >= compatibility_threshold);
    }

    function compute_compatibility_lists() {
        for (var e = 0; e < data_edges.length - 1; e++) {
            for (var oe = e + 1; oe < data_edges.length; oe++) { // don't want any duplicates
                if (are_compatible(data_edges[e], data_edges[oe])) {
                    compatibility_list_for_edge[e].push(oe);
                    compatibility_list_for_edge[oe].push(e);
                }
            }
        }
    }

    /*** ************************ ***/

    /*** Main Bundling Loop Methods ***/
    var forcebundle = function () {
        var S = S_initial;
        var I = I_initial;
        var P = P_initial;

        initialize_edge_subdivisions();
        initialize_compatibility_lists();
        update_edge_divisions(P);
        compute_compatibility_lists();

        for (var cycle = 0; cycle < C; cycle++) {
            for (var iteration = 0; iteration < I; iteration++) {
                var forces = [];
                for (var edge = 0; edge < data_edges.length; edge++) {
                    forces[edge] = apply_resulting_forces_on_subdivision_points(edge, P, S);
                }
                for (var e = 0; e < data_edges.length; e++) {
                    for (var i = 0; i < P + 1; i++) {
                        subdivision_points_for_edge[e][i].x += forces[e][i].x;
                        subdivision_points_for_edge[e][i].y += forces[e][i].y;
                        subdivision_points_for_edge[e][i].z += forces[e][i].z;
                    }
                }
            }
            // prepare for next cycle
            S = S / 2;
            P = P * P_rate;
            I = I_rate * I;

            update_edge_divisions(P);
            //console.log('C' + cycle);
            //console.log('P' + P);
            //console.log('S' + S);
        }
        return subdivision_points_for_edge;
    };
    /*** ************************ ***/

    /*** Getters/Setters Methods ***/
    forcebundle.nodes = function (nl) {
        if (arguments.length === 0) {
            return data_nodes;
        } else {
            data_nodes = nl;
        }

        return forcebundle;
    };

    forcebundle.edges = function (ll) {
        if (arguments.length === 0) {
            return data_edges;
        } else {
            data_edges = filter_self_loops(ll); //remove edges to from to the same point
        }

        return forcebundle;
    };

    forcebundle.bundling_stiffness = function (k) {
        if (arguments.length === 0) {
            return K;
        } else {
            K = k;
        }

        return forcebundle;
    };

    forcebundle.step_size = function (step) {
        if (arguments.length === 0) {
            return S_initial;
        } else {
            S_initial = step;
        }

        return forcebundle;
    };

    forcebundle.cycles = function (c) {
        if (arguments.length === 0) {
            return C;
        } else {
            C = c;
        }

        return forcebundle;
    };

    forcebundle.iterations = function (i) {
        if (arguments.length === 0) {
            return I_initial;
        } else {
            I_initial = i;
        }

        return forcebundle;
    };

    forcebundle.iterations_rate = function (i) {
        if (arguments.length === 0) {
            return I_rate;
        } else {
            I_rate = i;
        }

        return forcebundle;
    };

    forcebundle.subdivision_points_seed = function (p) {
        if (arguments.length == 0) {
            return P;
        } else {
            P = p;
        }

        return forcebundle;
    };

    forcebundle.subdivision_rate = function (r) {
        if (arguments.length === 0) {
            return P_rate;
        } else {
            P_rate = r;
        }

        return forcebundle;
    };

    forcebundle.compatibility_threshold = function (t) {
        if (arguments.length === 0) {
            return compatibility_threshold;
        } else {
            compatibility_threshold = t;
        }

        return forcebundle;
    };

    /*** ************************ ***/

    return forcebundle;
}



