function init() {

    let lastRightHand = null,
        lastLeftHand = null,

        // control graph layout
        init_graphExpanded1D = true,
        clique_graphExpanded1D = false,
        clique_graphExpanded2D = false,
        clique_graphExpanded3D = false,

        // control bundle
        globle_bundle = false,
        clique_bundle = false

    SUPERLINKS = [],
        SUPERNODES = [],
        SUPERSPUERNODES = [],
        GROUPED_NODES = [],
        INTERSECTED_NODE = null;

    const box = new THREE.Box3();

    const packingLine = new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3()
    ]);

    let packingGeometry = new THREE.TubeBufferGeometry(packingLine, 100, 0.1);
    let packingMesh = new THREE.Mesh(packingGeometry)

    packingMesh.needsUpdate = true
    packingMesh.material.visible = false

    scene.add(packingMesh)

    let fingerSphere = new THREE.SphereGeometry(0.05, 10, 10)
    let fingerSphereMesh = new THREE.Mesh(fingerSphere);
    fingerSphereMesh.material.visible = false

    scene.add(fingerSphereMesh)

    //////////BUNDLE//////////////

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

    function bundleByClique(clique) {

        let nodes = objects.nodes.filter(d => d.userData.group == clique);
        let links = objects.links.filter(d => groupData['node' + d.userData.source] == clique && groupData['node' + d.userData.target] == clique)

        let nodes_data = {}

        nodes.forEach(nodeMesh => {
            nodes_data[nodeMesh.userData.id] = {
                x: clique_mapping_init['node' + nodeMesh.userData.id].x,
                y: clique_mapping_init['node' + nodeMesh.userData.id].y,
                z: clique_mapping_init['node' + nodeMesh.userData.id].z
            }
        })

        let links_data = links.map((linkMesh, i) => {
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

        bundleRes.forEach(d => {
            // console.log(d);
            links[d[0].index].geometry.copy(new THREE.TubeBufferGeometry(
                new THREE.CatmullRomCurve3(
                    d.map(s => new THREE.Vector3(s.x, s.y, s.z))
                )
                , 100,
                .1)
            );
        })

        // console.log(bundleRes);

        // links.forEach((d, i) => {
        //     d.geometry.copy(new THREE.TubeBufferGeometry(
        //         new THREE.CatmullRomCurve3(
        //             bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z))
        //         )
        //         , 100,
        //         .1)
        //         // , false, 'catmullrom', 0.1
        //     );
        // })
    }

    function bundleByCustom(rightHand) {

        let indexFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[1].tipPosition)
        let thumbFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[0].tipPosition)

        let mid = new THREE.Vector3().addVectors(indexFingerPosition, thumbFingerPosition).multiplyScalar(0.5);

        objects.nodes.some(element => {

            let pos = new THREE.Vector3()
            element.getWorldPosition(pos)

            if (pos.distanceTo(indexFingerPosition) <= 0.5) {
                element.material.emissive.set('#bd4245');
                INTERSECTED_NODE = element;
                return true;
            }

        });

        // objects.links.forEach(link => {
        //     let start = link.parent.localToWorld(link.geometry.parameters.path.points[0].clone())
        //     let end = link.parent.localToWorld(link.geometry.parameters.path.points[link.geometry.parameters.path.points.length - 1].clone())
        //     let linkMid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        //     if (linkMid.distanceTo(mid) < 2 * link.parent.scale.x) {
        //         link.material.emissive.set('#bd4245');
        //         superLinks.push(link)
        //     }
        // })

        if (INTERSECTED_NODE) {
            let nodes_data = {}

            objects.nodes.forEach(element => {
                // let pos = element.getWorldPosition()
                nodes_data[element.name.replace('node_', '')] = { x: element.position.x, y: element.position.y, z: element.position.z }
            })

            // let links_data = superLinks.map(d => {
            //     return {
            //         source: d.userData.source,
            //         target: d.userData.target
            //     }
            // })

            let links_data = INTERSECTED_NODE.userData.joints.map(d => objects.links[d]).map(d => {
                return {
                    source: d.userData.source,
                    target: d.userData.target
                }
            })

            let bundleRes = forceBundling()  // kernelBundling()
                .nodes(nodes_data)
                .edges(links_data)
                // .step_size(0.2)
                .compatibility_threshold(0.7)()

            INTERSECTED_NODE.userData.joints.forEach((d, i) => {
                // d.material.color.set('#ff8080')
                objects.links[d].copy(new THREE.TubeBufferGeometry(
                    new THREE.CatmullRomCurve3(
                        bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z)))
                    , 100,
                    .01), false, 'catmullrom', 0.5);

            })
        }



    }

    function customBundle(rightHand) {

        let indexFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[1].tipPosition)

        fingerSphereMesh.position.copy(indexFingerPosition)

        objects.links.some(link => {

            let start = new THREE.Vector3()
            let end = new THREE.Vector3()

            objects.nodes.find(d => d.name == 'node_' + link.userData.source).getWorldPosition(start)
            objects.nodes.find(d => d.name == 'node_' + link.userData.target).getWorldPosition(end)

            let direction = end.clone().sub(start).normalize()

            raycaster.set(start, direction)

            let intersections = raycaster.intersectObject(fingerSphereMesh)

            if (intersections.length > 0) {

                link.material.emissive.setHex(0xff0000)

                if (SUPERLINKS.findIndex(d => d.name == link.name) == -1) {
                    link.userData.bundled = !link.userData.bundled
                    SUPERLINKS.push(link)
                }

                return true;
            }
        })

        if (SUPERLINKS.length) {

            if (SUPERLINKS.length == 1) {

            }
            else {
                let nodes_data = {}

                objects.nodes.forEach(element => {
                    nodes_data[element.name.replace('node_', '')] = { x: element.position.x, y: element.position.y, z: element.position.z }
                })

                let links_data = SUPERLINKS.map(d => {
                    return {
                        source: d.userData.source,
                        target: d.userData.target
                    }
                })

                let bundleRes = forceBundling()
                    .nodes(nodes_data)
                    .edges(links_data)
                    ()

                SUPERLINKS.forEach((d, i) => {

                    if (!d.userData.bundled) {

                        let start = bundleRes[i][0];
                        let end = bundleRes[i][bundleRes[i].length - 1]
                        d.geometry.copy(new THREE.TubeBufferGeometry(
                            new THREE.CatmullRomCurve3([
                                new THREE.Vector3(start.x, start.y, start.z),
                                new THREE.Vector3(end.x, end.y, end.z)
                            ])
                            , 10,
                            .01), false, 'catmullrom', 0.5);

                        // let index = SUPERLINKS.findIndex(s=>s.name == d.name)

                        // if(index != -1){
                        //     d.material.emissive.setHex(0x000000)
                        //     SUPERLINKS.splice(index,1)    
                        // }

                    }
                    else {
                        d.geometry.copy(new THREE.TubeBufferGeometry(
                            new THREE.CatmullRomCurve3(
                                bundleRes[i].map(s => new THREE.Vector3(s.x, s.y, s.z)))
                            , 10,
                            .01), false, 'catmullrom', 0.5);
                    }

                })
            }
        }

    }
    ////////////////////////////


    /////////GROUP / UNGROUP////////////// 

    function groupBycustom(midHands) {
        SUPERNODES.forEach(node => {

            let pos = new THREE.Vector3()

            node.getWorldPosition(pos)

            // if (pos.distanceTo(midHands) < 0.1*scale) {

            let t = getPointInBetweenByPerc(pos, midHands, 0.9)

            node.position.copy(node.parent.worldToLocal(t))

            node.userData.joints.forEach(i => {

                let linkMesh = objects.links[i]

                let start = new THREE.Vector3()
                let end = new THREE.Vector3()

                scene.getObjectByName('node_' + linkMesh.userData.source).getWorldPosition(start)
                scene.getObjectByName('node_' + linkMesh.userData.target).getWorldPosition(end)

                const line = new THREE.CatmullRomCurve3([
                    node.parent.worldToLocal(start),
                    node.parent.worldToLocal(end)
                ]);

                linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2));
            })
            // }
        })

        if (SUPERNODES.length > 1 && !scene.getObjectByName(SUPERNODES.map(d => d.name).join('-'))) {

            let nodeGeometry = new THREE.SphereGeometry(SUPERNODES.length * 1.5, 25, 25);
            let nodeMaterial = new THREE.MeshStandardMaterial({
                color: '#a042ff',
                metalness: 0,
                roughness: 0,
                // opacity: 0.6,
                // depthWrite: false,
                flatShading: true,
                transparent: true,
                envMapIntensity: 1,
            });

            let superNode = new THREE.Mesh(nodeGeometry, nodeMaterial);

            superNode.name = SUPERNODES.map(d => d.name).join('-');

            superNode.needsUpdate = true;

            superNode.position.copy(graphGroup.worldToLocal(midHands))

            SUPERSPUERNODES.push(superNode)
            graphGroup.add(superNode)
        }
        else {
            scene.getObjectByName(SUPERNODES.map(d => d.name).join('-'))
                .position.copy(graphGroup.worldToLocal(midHands))
        }
    }

    function cancleGroupBycustom(midHands) {

        SUPERSPUERNODES.some((element, i) => {

            let pos = new THREE.Vector3()
            element.getWorldPosition(pos)

            if (pos.distanceTo(midHands) < 1) {

                // element.material.emissive.setHex(0x888888);

                // console.log(element.name.split('-'));

                element.name.split('-').forEach(node => {

                    let nodeMesh = scene.getObjectByName(node)
                    // console.log(nodeMesh);

                    nodeMesh.position.copy(nodeMesh.parent.worldToLocal(nodeMesh.userData.lastPosition.clone()))

                    nodeMesh.userData.joints.forEach(j => {

                        let linkMesh = objects.links[j]
                        let start = new THREE.Vector3()
                        let end = new THREE.Vector3()

                        scene.getObjectByName('node_' + linkMesh.userData.source).getWorldPosition(start)
                        scene.getObjectByName('node_' + linkMesh.userData.target).getWorldPosition(end)

                        const line = new THREE.CatmullRomCurve3([
                            linkMesh.worldToLocal(start),
                            linkMesh.worldToLocal(end)
                        ]);

                        linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2))

                    })
                })

                graphGroup.remove(element)

                SUPERSPUERNODES.splice(i, 1)

                return true

            }
        })
    }

    function groupedByClique(clique) {

        let classNumber = {
            0: "2BIO2",
            1: "2BIO3",
            2: "2BIO1",
            3: "PC",
            4: "MP*1",
            5: "MP",
            6: "MP*2"
        }

        let cliqueMesh = objects.nodes.filter(d => d.userData.class == classNumber[clique]);

        cliqueMesh.forEach(nodeMesh => {

            mapping['node' + nodeMesh.userData.id] = nodeMesh.parent.worldToLocal(
                new THREE.Vector3(commnities[clique].x, commnities[clique].y, commnities[clique].z))

            nodeMesh.position.copy(mapping['node' + nodeMesh.userData.id]);

            nodeMesh.userData.joints.forEach(j => {

                let linkMesh = objects.links[j]

                const line = new THREE.CatmullRomCurve3([
                    mapping['node' + linkMesh.userData.source],
                    mapping['node' + linkMesh.userData.target]
                ]);

                linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.05));

            })
        })


        let cliqueGeometry = new THREE.SphereGeometry(cliqueMesh.length * 0.1, 25, 25);
        let cliqueMaterial = new THREE.MeshStandardMaterial({
            color: classColor[classNumber[clique]],
            metalness: 0,
            roughness: 0,
            opacity: 0.6,
            // depthWrite: false,
            flatShading: true,
            transparent: true,
            envMapIntensity: 1,
        });

        let superNode = new THREE.Mesh(cliqueGeometry, cliqueMaterial);

        superNode.name = 'clique_' + clique;

        superNode.position.copy(graphGroup.worldToLocal(
            new THREE.Vector3(commnities[clique].x, commnities[clique].y, commnities[clique].z)))

        graphGroup.add(superNode)

    }

    function cancleGroupByClique(clique) {

    }
    ////////////////////////////

    ///////////HIGHLIGHT//////////
    function highlightNode(rightHand) {

        let indexFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[1].tipPosition)

        if (!INTERSECTED_NODE) {

            objects.nodes.some(element => {

                let pos = new THREE.Vector3()
                element.getWorldPosition(pos)

                if (pos.distanceTo(indexFingerPosition) <= 0.1) {

                    INTERSECTED_NODE = element;
                    return true;
                }

            });
        }

        if (INTERSECTED_NODE) {

            INTERSECTED_NODE.material.emissive.setHex(0xff0000);

            // let text = scene.getObjectByName('text_'+INTERSECTED_NODE.userData.name)

            // text.visible = true

            // text.quaternion.copy(camera.quaternion)

            INTERSECTED_NODE.userData.joints.forEach(d => {

                objects.links[d].material.emissive.setHex(0xff0000);

            })
        }
    }

    function highlightLink() {
    }

    function resetHighlight() {

        if (INTERSECTED_NODE) {
            INTERSECTED_NODE.material.emissive.setHex(0x000000);

            // let text = scene.getObjectByName('text_'+INTERSECTED_NODE.userData.name)

            // text.visible = false

            INTERSECTED_NODE.userData.joints.forEach(d => {

                objects.links[d].material.emissive.setHex(0x000000);

            })

            INTERSECTED_NODE = null
        }
    }

    /////////////////////////////

    ////////////TRANSLATE////////

    function pinchToTranslate(rightHand) {

        let indexFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[1].tipPosition)
        let thumbFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[0].tipPosition)

        let mid = new THREE.Vector3().addVectors(indexFingerPosition, thumbFingerPosition).multiplyScalar(0.5);

        if (!INTERSECTED_NODE) {
            objects.nodes.some(element => {

                let pos = new THREE.Vector3()
                element.getWorldPosition(pos)

                if (pos.distanceTo(mid) <= 0.11) {

                    INTERSECTED_NODE = element;

                    return true;
                }

            });
        }

        if (INTERSECTED_NODE) {

            INTERSECTED_NODE.material.emissive.setHex(0x888888);

            INTERSECTED_NODE.position.copy(INTERSECTED_NODE.parent.worldToLocal(mid));

            INTERSECTED_NODE.userData.joints.forEach(d => {

                let link = objects.links[d]

                link.material.emissive.setHex(0x888888);

                if (link.userData.source == INTERSECTED_NODE.name.replace('node_', '')) {
                    link.geometry.parameters.path.points[0] = mid;
                    link.geometry.copy(new THREE.TubeBufferGeometry(link.geometry.parameters.path, 10, Math.sqrt(link.userData.value) * 0.08))
                }

                if (link.userData.target == INTERSECTED_NODE.name.replace('node_', '')) {
                    link.geometry.parameters.path.points[link.geometry.parameters.path.points.length - 1] = mid;
                    link.geometry.copy(new THREE.TubeBufferGeometry(link.geometry.parameters.path, 10, Math.sqrt(link.userData.value) * 0.08))
                }

            })

        }


    }

    function resetTranslate() {

        if (INTERSECTED_NODE) {
            INTERSECTED_NODE.material.emissive.setHex(0x000000);

            INTERSECTED_NODE.userData.joints.forEach(d => {

                objects.links[d].material.emissive.setHex(0x00000);

            })

            INTERSECTED_NODE = null
        }
    }

    /////////////////////////////

    //////////UPDATE LAYOUT/////
    function updateLayout(clique_mapping) {

        objects.nodes.forEach(nodeMesh => {
            nodeMesh.position.copy(clique_mapping['node' + nodeMesh.userData.id])
        })

        objects.links.forEach(linkMesh => {

            const line = new THREE.CatmullRomCurve3([
                clique_mapping['node' + linkMesh.userData.source],
                clique_mapping['node' + linkMesh.userData.target]
            ]);

            linkMesh.geometry.copy(new THREE.TubeBufferGeometry(line, 50, 0.2));

        })
    }
    ///////////////////////////


    function resetSUPERLINKS() {

        // if (SUPERLINKS.length) {
        //     SUPERLINKS.forEach(d => {
        //         d.material.emissive.setHex(0x000000)
        //     })
        //     SUPERLINKS = []
        // }
    }

    /////////////OTHER//////////
    function getPointInBetweenByPerc(pointA, pointB, percentage) {

        var dir = pointB.clone().sub(pointA);
        var len = dir.length();
        dir = dir.normalize().multiplyScalar(len * percentage);
        return pointA.clone().add(dir);

    }
    ////////////////////////////


    function updatePosition() {
        objects.nodes.forEach(node => {
            let pos = new THREE.Vector3()
            node.getWorldPosition(pos)
            node.userData.lastPosition = pos
        })
    }

    // function updateMCEffect() {

    //     if (SUPERNODES.length) {

    //         let scale = graphGroup.scale.x || 1

    //         SUPERNODES.forEach(element => {

    //             let position = element.getWorldPosition().clone()

    //             let subtract = 50 * scale, strength = 0.1 * scale;

    //             let ballx = 0.5 + position.x / (10 * scale * 2);
    //             let bally = 0.5 + position.y / (10 * scale * 2);
    //             let ballz = 0.5 + position.z / (10 * scale * 2);

    //             // MCEffect.addBall(ballx, bally, ballz, strength, subtract, new THREE.Color(0xff0000));

    //             MCEffect.addBall(ballx, bally, ballz, strength, subtract);

    //         })
    //     }

    // }

    // function pinchToGroup(rightHand) {

    //     let indexFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[1].tipPosition)
    //     let thumbFingerPosition = new THREE.Vector3().fromArray(rightHand.fingers[0].tipPosition)

    //     let mid = new THREE.Vector3().addVectors(indexFingerPosition, thumbFingerPosition).multiplyScalar(0.5);

    //     objects.nodes.some(element => {
    //         let pos = new THREE.Vector3()
    //         element.getWorldPosition(pos)
    //         if (pos.distanceTo(mid) <= 0.1) {
    //             // element.material.emissive.setHex(0x888888);
    //             if (GROUPED_NODES.findIndex(d => d.name == element.name) == -1) {
    //                 GROUPED_NODES.push(element)
    //             }
    //             return true;
    //         }
    //     });
    //     updateMCEffect()
    // }

    controller.on('frame', (frame) => {

        if (!frame.valid)
            return;

        let hands = frame.hands,
            handsCount = frame.hands.length,
            leftHand = null,
            rightHand = null;

        if (!handsCount) {

            lastRightHand = null;
            lastLeftHand = null;

        }
        else if (handsCount == 1) {

            if (hands[0].type == 'left') {
                leftHand = hands[0];
            }
            else {
                rightHand = hands[0];
            }

        }
        else if (handsCount == 2) {

            hands[0].type == 'left' ?
                (leftHand = hands[0], rightHand = hands[1]) :
                (leftHand = hands[1], rightHand = hands[0]);

        }

        if (rightHand && leftHand) {

            // translate [OK]
            if (leftHand.pinchStrength >= 0.9 && rightHand.pinchStrength >= 0.9
                // && leftHand.fingers[0].extended && rightHand.fingers[0].extended
                && !leftHand.fingers[1].extended && !rightHand.fingers[1].extended
                && !leftHand.fingers[2].extended && !rightHand.fingers[2].extended
                && !leftHand.fingers[3].extended && !rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                // && leftHand.palmVelocity[0] * rightHand.palmVelocity[0] > 0

            ) {

                // let leftHandPosition = new THREE.Vector3().fromArray(leftHand.palmPosition)
                // let rightHandPosition = new THREE.Vector3().fromArray(rightHand.palmPosition)
                // let midHands = new THREE.Vector3().addVectors(leftHandPosition, rightHandPosition).multiplyScalar(0.5);
                // let distance = graphGroup.position.distanceTo(midHands)

                let moveSpeed = 0.0006

                if (Math.abs(rightHand.palmVelocity[0]) > 5 || Math.abs(rightHand.palmVelocity[1]) > 5 || Math.abs(rightHand.palmVelocity[2]) > 5) {

                    console.log('graph translate');

                    graphGroup.position.x += rightHand.palmVelocity[0] * moveSpeed * (graphGroup.scale.x | 1);
                    graphGroup.position.y += rightHand.palmVelocity[1] * moveSpeed * (graphGroup.scale.x | 1);
                    graphGroup.position.z += rightHand.palmVelocity[2] * moveSpeed * (graphGroup.scale.x | 1);
                    updatePosition()

                }
                // else if (Math.abs(leftHand.palmVelocity[0]) > 5 || Math.abs(leftHand.palmVelocity[1]) > 5 || Math.abs(leftHand.palmVelocity[2]) > 5) {

                //     console.log('graph translate');

                //     graphGroup.position.x += leftHand.palmVelocity[0] * moveSpeed * (graphGroup.scale.x | 1);
                //     graphGroup.position.y += leftHand.palmVelocity[1] * moveSpeed * (graphGroup.scale.x | 1);
                //     graphGroup.position.z += leftHand.palmVelocity[2] * moveSpeed * (graphGroup.scale.x | 1);
                //     updatePosition()
                // }

            }

            // rotate [OK]
            // if (leftHand.grabStrength >= 0.95 && rightHand.grabStrength >= 0.95
            //     && leftHand.palmNormal[2]*rightHand.palmNormal[2] < 0
            //     // && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
            //     // leftHand.palmVelocity[1]*rightHand.palmVelocity[1]<0 
            //     //     // hands relative position
            // ) {

            //     if (Math.abs(rightHand.palmVelocity[0]) > 5 || Math.abs(rightHand.palmVelocity[1]) > 5 || Math.abs(rightHand.palmVelocity[2]) > 5) {

            //         console.log('graph rotatation');

            //         graphGroup.rotation.x += rightHand.palmVelocity[1] * 0.0002;
            //         graphGroup.rotation.y += rightHand.palmVelocity[2] * 0.0002;
            //         // graphGroup.rotation.z += rightHand.palmVelocity[0] * 0.0001;
            //         updatePosition()
            //     }

            //     // console.log(leftHand.palmNormal);
            //     // console.log(rightHand.palmNormal);
            // }

            // scale [OK]
            if (leftHand.pinchStrength >= 0.9 && rightHand.pinchStrength >= 0.9
                // && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
                // && !leftHand.fingers[1].extended && !rightHand.fingers[1].extended
                && leftHand.fingers[2].extended && rightHand.fingers[2].extended
                && leftHand.fingers[3].extended && rightHand.fingers[3].extended
                && leftHand.fingers[4].extended && rightHand.fingers[4].extended
                // && leftHand.palmVelocity[0] * rightHand.palmVelocity[0] < 0
            ) {
                // console.log('graph zooming');

                let leftHandPosition = new THREE.Vector3().fromArray(leftHand.palmPosition)
                let rightHandPosition = new THREE.Vector3().fromArray(rightHand.palmPosition)

                let distanceHands = leftHandPosition.distanceTo(rightHandPosition)

                // console.log(leftHand.palmVelocity[0]);

                let midHands = new THREE.Vector3().addVectors(leftHandPosition, rightHandPosition).multiplyScalar(0.5);
                if (leftHand.palmVelocity[0] > 5 && rightHand.palmVelocity[0] < -5) {
                    console.log('zooming +');
                    // console.log(rightHand.palmVelocity[0]);

                    //test
                    // let scale = graphGroup.scale.x + rightHand.palmVelocity[0] * 0.0001;

                    //social
                    let scale = graphGroup.scale.x + rightHand.palmVelocity[0] * 0.002;
                    // let scale = graphGroup.scale.x + 0.0001;

                    //brain
                    // let scale = graphGroup.scale.clone().toArray()[0] + rightHand.palmVelocity[0] * 0.004;

                    //     // citation
                    //     let scale = graphGroup.scale.clone().toArray()[0] + rightHand.palmVelocity[0] * 0.004;

                    if (scale > 0) {


                        graphGroup.scale.set(scale, scale, scale);
                        // graphGroup.position.copy(midHands)
                        graphGroup.updateWorldMatrix()
                        updatePosition()

                    }
                    // else{
                    //     scale*= 0.5
                    //     graphGroup.scale.set(scale, scale, scale);
                    //     // graphGroup.position.copy(midHands)
                    //     graphGroup.updateWorldMatrix()
                    //     updatePosition()
                    // }
                }
                else if (leftHand.palmVelocity[0] < -5 && rightHand.palmVelocity[0] > 5) {
                    console.log('zooming -');

                    //social
                    // console.log(rightHand.palmVelocity[0]);
                    let scale = graphGroup.scale.x + rightHand.palmVelocity[0] * 0.002;
                    // let scale = graphGroup.scale.x + 0.0001;


                    //     //brain
                    //     let scale = graphGroup.scale.clone().toArray()[0] + rightHand.palmVelocity[0] * 0.004;

                    //     //brain
                    //     let scale = graphGroup.scale.clone().toArray()[0] + rightHand.palmVelocity[0] * 0.004;

                    if (scale > 0) {

                        graphGroup.scale.set(scale, scale, scale);
                        // graphGroup.position.copy(midHands)
                        graphGroup.updateWorldMatrix()
                        updatePosition()

                    }
                    // else{
                    //     scale*= 0.5
                    //     graphGroup.scale.set(scale, scale, scale);
                    //     // graphGroup.position.copy(midHands)
                    //     graphGroup.updateWorldMatrix()
                    //     updatePosition()
                    // }
                }
            }

            // fly
            if (leftHand.fingers[0].extended && rightHand.fingers[0].extended
                && !leftHand.fingers[1].extended && !rightHand.fingers[1].extended
                && !leftHand.fingers[2].extended && !rightHand.fingers[2].extended
                && !leftHand.fingers[3].extended && !rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                && leftHand.palmNormal[1] > 0 && rightHand.palmNormal[1] > 0
            ) {
                console.log('in');

                // let leftHandPosition = new THREE.Vector3().fromArray(leftHand.palmPosition)
                // let rightHandPosition = new THREE.Vector3().fromArray(rightHand.palmPosition)

                // let midHands = new THREE.Vector3().addVectors(leftHandPosition, rightHandPosition).multiplyScalar(0.5);

                // graphGroup.position.lerp(midHands, 0.05)

                // updatePosition()

            }
            else if (leftHand.fingers[0].extended && rightHand.fingers[0].extended
                && !leftHand.fingers[1].extended && !rightHand.fingers[1].extended
                && !leftHand.fingers[2].extended && !rightHand.fingers[2].extended
                && !leftHand.fingers[3].extended && !rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                && leftHand.palmNormal[1] < 0 && rightHand.palmNormal[1] < 0
                && 0
            ) {
                console.log('out');
                // graphGroup.position.lerp(new THREE.Vector3(100, 20, 100), 0.05)
                // updatePosition()

            }

            //////////////////////////////////////////////////////
            /////              Dimension Blend Layout         ////
            //////////////////////////////////////////////////////
            // // transform layout -- init
            else if (!init_graphExpanded1D && 0
                // && Distanec jduge 
            ) {
                console.log('init');

                init_graphExpanded1D = true;
                clique_graphExpanded1D = false;
                clique_graphExpanded2D = false;
                clique_graphExpanded3D = false;

                //brain
                // scene.getObjectByName('brain-model').visible = true;

                updateLayout(clique_mapping_init)

            }
            // // transform layout -- clique 1D
            if (!clique_graphExpanded1D
                && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
                && leftHand.fingers[1].extended && rightHand.fingers[1].extended
                && !leftHand.fingers[2].extended && !rightHand.fingers[2].extended
                && !leftHand.fingers[3].extended && !rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                && leftHand.palmVelocity[0] < -20 && rightHand.palmVelocity[0] > 20
            ) {
                console.log('1D Layout');

                let scale = graphGroup.scale.x | 1

                let center = new THREE.Vector3()
                new THREE.Box3().setFromObject(graphGroup).getCenter(center)

                Object.keys(clique_mapping_1D).forEach(d => {
                    clique_mapping_1D[d] = new THREE.Vector3(
                        clique_mapping_1D[d].x * scale,
                        clique_mapping_1D[d].y * scale,
                        clique_mapping_1D[d].z * scale)
                })

                graphGroup.position.copy(center)

                init_graphExpanded1D = false;
                clique_graphExpanded1D = true;
                clique_graphExpanded2D = false;
                clique_graphExpanded3D = false;



                //brain
                // scene.getObjectByName('brain-model').visible = false;

                updateLayout(clique_mapping_1D)
                // bundleByGloble()
                objects.labels.forEach(text=>{
                    text.position.copy(clique_mapping_1D['node'+text.name.replace('text_','')])
                    // text.quaternion.copy(camera.quaternion)
                })
            }
            // // transform layout -- clique 2D
            else if (!clique_graphExpanded2D
                && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
                && leftHand.fingers[1].extended && rightHand.fingers[1].extended
                && leftHand.fingers[2].extended && rightHand.fingers[2].extended
                && !leftHand.fingers[3].extended && !rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                && leftHand.palmVelocity[0] < -20 && rightHand.palmVelocity[0] > 20
            ) {
                console.log('2D Layout');

                let scale = graphGroup.scale.x | 1

                let center = new THREE.Vector3()
                new THREE.Box3().setFromObject(graphGroup).getCenter(center)

                Object.keys(clique_mapping_2D).forEach(d => {
                    clique_mapping_2D[d] = new THREE.Vector3(
                        clique_mapping_2D[d].x * scale,
                        clique_mapping_2D[d].y * scale,
                        clique_mapping_2D[d].z * scale)
                })

                graphGroup.position.copy(center)

                init_graphExpanded1D = false;
                clique_graphExpanded1D = false;
                clique_graphExpanded2D = true;
                clique_graphExpanded3D = false;

                //brain
                // scene.getObjectByName('brain-model').visible = false;



                updateLayout(clique_mapping_2D)
                // bundleByGloble()
                objects.labels.forEach(text=>{
                    text.position.copy(clique_mapping_2D['node'+text.name.replace('text_','')])
                    // text.quaternion.copy(camera.quaternion)
                })

            }
            // // transform layout -- clique 3D
            else if (!clique_graphExpanded3D
                && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
                && leftHand.fingers[1].extended && rightHand.fingers[1].extended
                && leftHand.fingers[2].extended && rightHand.fingers[2].extended
                && leftHand.fingers[3].extended && rightHand.fingers[3].extended
                && !leftHand.fingers[4].extended && !rightHand.fingers[4].extended
                && leftHand.palmVelocity[0] < -20 && rightHand.palmVelocity[0] > 20
            ) {
                console.log('3D Layout');


                let scale = graphGroup.scale.x | 1

                let center = new THREE.Vector3()
                new THREE.Box3().setFromObject(graphGroup).getCenter(center)

                Object.keys(clique_mapping_3D).forEach(d => {
                    clique_mapping_3D[d] = new THREE.Vector3(
                        clique_mapping_3D[d].x * scale,
                        clique_mapping_3D[d].y * scale,
                        clique_mapping_3D[d].z * scale)
                })

                graphGroup.position.copy(center)

                init_graphExpanded1D = false;
                clique_graphExpanded1D = false;
                clique_graphExpanded2D = false;
                clique_graphExpanded3D = true;

                //brain
                // scene.getObjectByName('brain-model').visible = false;


                updateLayout(clique_mapping_3D)
                // bundleByGloble()
                objects.labels.forEach(text=>{
                    text.position.copy(clique_mapping_3D['node'+text.name.replace('text_','')])
                    // text.quaternion.copy(camera.quaternion)
                })
            }
            //////////////////////////////////////////////////

            //////////////////////////////////////////////////
            /////////// group / ungroup///////////////////////
            //////////////////////////////////////////////////

            //////////////   custom   ////////////////////////
            else if (leftHand.grabStrength <= 0.2 && rightHand.grabStrength <= 0.2) {

                let angle = new THREE.Vector3().fromArray(leftHand.palmNormal).angleTo(new THREE.Vector3().fromArray(rightHand.palmNormal));

                let leftHandPosition = new THREE.Vector3().fromArray(leftHand.palmPosition)
                let rightHandPosition = new THREE.Vector3().fromArray(rightHand.palmPosition)

                let midHands = new THREE.Vector3().addVectors(leftHandPosition, rightHandPosition).multiplyScalar(0.5);

                if (angle >= 2.2 && angle <= 3.2) {

                    let scale = graphGroup.scale.x | 1

                    let distanceHands = leftHandPosition.distanceTo(rightHandPosition)

                    const packingLine = new THREE.CatmullRomCurve3([
                        leftHandPosition,
                        rightHandPosition
                    ]);

                    packingMesh.geometry.copy(new THREE.TubeBufferGeometry(packingLine, 100, 0.05 * scale))

                    box.setFromObject(packingMesh);

                    objects.nodes.forEach(node => {

                        let pos = new THREE.Vector3()
                        node.getWorldPosition(pos)

                        if (box.containsPoint(pos)) {
                            if (SUPERNODES.findIndex(d => d.name == node.name) == -1) {
                                SUPERNODES.push(node)
                            }
                            node.material.emissive.setHex(0x888888);
                        }
                    })

                    if (1
                        && leftHand.palmVelocity[0] < -50 && rightHand.palmVelocity[0] > 50
                    ) {
                        console.log('ungroup');
                        // cancleGroupBycustom(midHands)

                    }
                    else if (1
                        && leftHand.palmVelocity[0] > 50 && rightHand.palmVelocity[0] < -50
                    ) {
                        console.log('group');
                        // groupBycustom(midHands)
                    }
                }
                else {

                    SUPERNODES.forEach(node => {
                        node.material.emissive.setHex(0x000000);
                    })
                    SUPERNODES = []
                }
            }
            //////////////   based clique   //////////////////
            else if (0) {
                //groupedByClique(3)
            }
            //////////////////////////////////////////////////

            //////////////////////////////////////////////////
            //////////////   Bundle / Unbundle ///////////////
            //////////////////////////////////////////////////

            ///////// globle Bundle / Unbundle /////////////
            else if (!globle_bundle&&leftHand.grabStrength >= 0.98 && rightHand.grabStrength >= 0.98 
                && leftHand.palmNormal[2]*rightHand.palmNormal[2] > 0
                && leftHand.fingers[0].extended && rightHand.fingers[0].extended
                // && leftHand.palmNormal[1] < 0 && rightHand.palmNormal[1] < 0
                ) {
                console.log('globle Bundle');
                bundleByGloble()
                globle_bundle = true
            }
            /////////// clique Bundle / Unbundle /////////////
            // else if (!clique_bundle&&leftHand.grabStrength >= 1 && rightHand.grabStrength >= 1
            //     // && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
            //     // && leftHand.palmNormal[1] < 0 && rightHand.palmNormal[1] < 0
            //     ) {
            //     console.log('clique Bundle');
            //     bundleByClique(3)
            //     clique_bundle = true
            // }

            /////////// custom Bundle / Unbundle /////////////
            else if (rightHand.grabStrength >= 0.98&&0
                // && !leftHand.fingers[0].extended && !rightHand.fingers[0].extended
                // && leftHand.palmNormal[1] < 0 && rightHand.palmNormal[1] < 0
            ) {
                console.log('custom Bundle');
                // bundleByCustom(rightHand)
                // clique_bundle = true
            }
            //////////////////////////////////////////////////

        }
        else if (rightHand && !leftHand) {

            // highlight node and neighbors
            if (rightHand.fingers[1].extended == true && rightHand.fingers.filter(d => !d.extended).length == 4) {
                highlightNode(rightHand)
            }
            else {
                resetHighlight()
            }

            // move node and joint
            if (rightHand.pinchStrength >= 0.9 && rightHand.fingers[1].extended == false) {
                pinchToTranslate(rightHand)
            }
            else if (INTERSECTED_NODE && rightHand.pinchStrength <= 0.5) {
                resetTranslate()
            }

            // custom to bundle
            if (
                rightHand.fingers[1].extended == true && rightHand.fingers[2].extended == true
                && rightHand.fingers.filter(d => d.extended).length < 3
            ) {
                customBundle(rightHand)
            }
            else {
                resetSUPERLINKS()
            }

        }
        else if (!rightHand && leftHand && 0) {
        }


        objects.labels.forEach(text=>{
            text.quaternion.copy(camera.quaternion)
        })

        renderer.render(scene, camera);

    })


}

init()