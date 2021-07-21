!function initLeap() {

    let controller = new Leap.Controller({
        // optimizeHMD: true,
        // frameEventName: 'animationFrame'
        // frameEventName: "deviceFrame"
    });
    
    window.controller = controller;

    controller.use('handHold')
        .use('transform', {
            effectiveParent: camera,
            vr: true
        })
        .use('handEntry')
        .use('screenPosition')
        .use('riggedHand', {
            parent: scene,
            renderer: renderer,
            scale: 0.25,
            // positionScale: getParam('positionScale'),
            // helper: true,
            // offset: new THREE.Vector3(0, -10, 0),
            // materialOptions: {
            //     wireframe: getParam('wireframe')
            // },
            // dotsMode: getParam('dots'),
            // stats: stats,
            camera: camera,
            // boneLabels: function(boneMesh, leapHand) {
            //     if (boneMesh.name.indexOf('Finger_03') === 0) {
            //         return leapHand.pinchStrength;
            //     }
            // },
            boneColors: function (boneMesh, leapHand) {

                if ((boneMesh.name.indexOf('Finger_0') === 0) || (boneMesh.name.indexOf('Finger_1') === 0)) {
                    return {
                        hue: 0.6,
                        saturation: leapHand.pinchStrength * 0.5
                    };
                }
            }
        })
        .connect();
        
}()