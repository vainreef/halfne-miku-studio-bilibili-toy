// GENERATED: independent original motion factory; images omitted.
// DO NOT COPY THIS LINE
import {
    getAbsolutePos,
    getConfig,
    physicsRotation,
    physicsScaleY,
    linkedRotation,
    linkedScaleY
} from "../../../src/Engine/modelUtils.js";

// COPY AREA START
const W = 800;
const H = 600;

const mikuConfig = () => ({
    background: {
        "bg1": "",
        "bg2": "",
        "bg3": "",
        "bg4": "",
        "bg5": "",
        "bg6": "",
        "bg7": ""
    },
    defaultKeyMapping: [['EyeHappy', '1'], ['EyeJaded', '2'], ['EyeO_O', '3'], ['Eye*_*', '4'], ['Eye@_@', '5'], ['EyeSideGlance', '6'], ['EyeEheh', '7'], ['EyePumped', '8'], ['EyeBlink', 'x'], ['MouthAA', 'a'], ['MouthEE', 'd'], ['MouthOO', 'w'], ['MouthEH', 's'], ['MouthOH', 'e'], ['MouthTeeth', 'q'], ['MouthHappy', 'F1'], ['MouthNeutral', 'F2'], ['MouthCat', 'F3'], ['MouthAngry', 'F4'], ['MouthPout', 'F5'], ['MouthDrool', 'F6'], ['MouthDuck', 'F7'], ['MouthTongue', 'F8'],],
    parseControl: (_control = {}) => {
        let control = {
            mouseX: W / 2, mouseY: H / 2, mouthType: "happy", mouth: 1, eyeType: "happy", eyeOpen: 'o', keyInput: [],
            ..._control,
        };

        const {mouseX, mouseY, keyInput} = control;

        control.x = Math.atan((mouseX - W / 2) / W * 4) / Math.PI * 2;
        control.y = Math.atan((mouseY - H / 2) / H * 4) / Math.PI * 2;
        const right = control.x;	// -1 = left
        const fwd = control.y; 	// -1 = back

        const side_ang = right * Math.PI / 2;
        const fwd_ang = fwd * Math.PI / 2;

        const side_sin = Math.sin(side_ang);
        const side_cos = Math.cos(side_ang);
        const fwd_sin = Math.sin(fwd_ang);
        const fwd_cos = Math.cos(fwd_ang);
        const lean = 1 - (.5 - fwd_sin * .5) * side_cos;

        control.mouth = 1;
        control.eyeOpen = 'o';
        control.mouthType = control.mouthType || 'happy';
        keyInput.forEach(o => {
            switch (o) {
                case 'EyeHappy':
                    control.eyeType = 'happy';
                    break;
                case 'EyeJaded':
                    control.eyeType = 'jaded';
                    break;
                case 'EyeO_O':
                    control.eyeType = 'oo';
                    break;
                case 'Eye*_*':
                    control.eyeType = 'xx';
                    break;
                case 'Eye@_@':
                    control.eyeType = 'aa';
                    break;
                case 'EyeSideGlance':
                    control.eyeType = 'sideglance';
                    break;
                case 'EyeEheh':
                    control.eyeType = 'eheh';
                    break;
                case 'EyePumped':
                    control.eyeType = 'pumped';
                    break;
                case 'EyeBlink':
                    control.eyeOpen = 'c';
                    break;
                case 'MouthAA':
                    control.mouth = 2;
                    break;
                case 'MouthEE':
                    control.mouth = 3;
                    break;
                case 'MouthOO':
                    control.mouth = 4;
                    break;
                case 'MouthEH':
                    control.mouth = 5;
                    break;
                case 'MouthOH':
                    control.mouth = 6;
                    break;
                case 'MouthTeeth':
                    control.mouth = 7;
                    break;
                case 'MouthHappy':
                    control.mouthType = 'happy';
                    break;
                case 'MouthNeutral':
                    control.mouthType = 'neutral';
                    break;
                case 'MouthCat':
                    control.mouthType = 'cat';
                    break;
                case 'MouthAngry':
                    control.mouthType = 'angry';
                    break;
                case 'MouthPout':
                    control.mouthType = 'pout';
                    break;
                case 'MouthDrool':
                    control.mouthType = 'drool';
                    break;
                case 'MouthDuck':
                    control.mouthType = 'duck';
                    break;
                case 'MouthTongue':
                    control.mouthType = 'tongue';
                    break;
            }
        });

        control = {...control, right, fwd, side_ang, fwd_ang, side_sin, side_cos, fwd_sin, fwd_cos, lean};
        //console.log(control);
        return control;
    },
    model: {
        id: 'root', x: 383.45, y: 466.65, scaleY: 1.25, scaleX: 1.25, components: [{
            id: 'clipBR',
            width: 800,
            height: 600,
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getAbsolutePos(config, 'head.clipBR')?.x,
            y: (control, config) => getAbsolutePos(config, 'head.clipBR')?.y,
            rotation: (control, config) => getAbsolutePos(config, 'head.clipBR')?.rotation,
            resource: "",
        }, {
            id: 'tailL',
            x: (control, config) => getAbsolutePos(config, 'head.tailL')?.x,
            y: (control, config) => getAbsolutePos(config, 'head.tailL')?.y,
            resourceCenterX: 400,
            resourceCenterY: 300,
            gravityX: 0,
            gravityY: 0.005,
            massX: 0,
            massY: 128,
            damp: 0.002,
            rotation: physicsRotation('tailL'),
            scaleY: physicsScaleY('tailL'),
            resource: "",
        }, {
            id: 'tailR',
            x: (control, config) => getAbsolutePos(config, 'head.tailR')?.x,
            y: (control, config) => getAbsolutePos(config, 'head.tailR')?.y,
            width: 800,
            height: 600,
            resourceCenterX: 400,
            resourceCenterY: 300,
            gravityX: 0,
            gravityY: 0.005,
            massX: 0,
            massY: 128,
            damp: 0.002,
            rotation: physicsRotation('tailR'),
            scaleY: physicsScaleY('tailR'),
            resource: "",
        }, {
            id: 'feetL', x: -11.20, y: -45.05 + 40, virtual: true,
        }, {
            id: 'feetR', x: 16.40, y: -45.10 + 40, virtual: true,
        }, {
            id: 'legL',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getAbsolutePos(config, 'lower.markL')?.x,
            y: (control, config) => getAbsolutePos(config, 'lower.markL')?.y,
            rotation: linkedRotation('lower.markL', 'feetL'),
            scaleY: linkedScaleY('lower.markL', 'feetL'),
            resource: ""
        }, {
            id: 'legR',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getAbsolutePos(config, 'lower.markR')?.x,
            y: (control, config) => getAbsolutePos(config, 'lower.markR')?.y,

            rotation: linkedRotation('lower.markR', 'feetR'),
            scaleY: linkedScaleY('lower.markR', 'feetR'),
            resource: "",
        }, {
            id: 'lower',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: ({side_sin}) => 0.5 + side_sin * 10,
            y: ({lean}) => -67.45 + 4 * lean,
            components: [{
                id: 'markL', x: -0.5 - 11.20, y: 67.45 - 45.05, virtual: true,
            }, {
                id: 'markR', x: -0.5 + 16.40, y: 67.45 - 45.1, virtual: true,
            }, {
                id: 'skirt',
                x: 0,
                y: 0,
                resourceCenterX: 400,
                resourceCenterY: 300,
                gravityX: 0,
                gravityY: 0.002,
                massX: 0,
                massY: 20,
                damp: 0.005,
                rotation: physicsRotation('lower.skirt'),
                scaleY: physicsScaleY('lower.skirt'),
                resource: ""
            }, {
                id: 'belt',
                x: 20,
                y: 10.65,
                resourceCenterX: 400,
                resourceCenterY: 300,
                gravityX: 0.001,
                gravityY: 0.004,
                massX: 0,
                massY: 8,
                damp: 0.005,
                rotation: physicsRotation('lower.belt'),
                scaleY: physicsScaleY('lower.belt'),
                resource: "",
            },]
        }, {
            id: 'upper',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: ({side_sin}) => side_sin * 5,
            y: ({lean}) => -71 + 4 * lean,
            rotation: ({side_sin}) => -side_sin * 15,
            resource: "",
            components: [{
                id: 'shirtL',
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -8.65,
                y: -11.35,
                gravityX: -0.002,
                gravityY: 0.004,
                massX: 0,
                massY: 16,
                damp: 0.005,
                rotation: physicsRotation('upper.shirtL'),
                scaleY: physicsScaleY('upper.shirtL'),
                resource: "",
            }, {
                id: 'shirtR',
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: 6.6,
                y: -7.2,
                gravityX: 0.002,
                gravityY: 0.004,
                massX: 0,
                massY: 16,
                damp: 0.005,
                rotation: physicsRotation('upper.shirtR'),
                scaleY: physicsScaleY('upper.shirtR'),
                resource: "",
            },]
        }, {
            id: 'shoulderL',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getAbsolutePos(config, 'uppercollar.collar.markL')?.x,
            y: (control, config) => getAbsolutePos(config, 'uppercollar.collar.markL')?.y,
            rotation: linkedRotation('uppercollar.collar.markL', 'armL'),
            scaleY: linkedScaleY('uppercollar.collar.markL', 'armL'),
            resource: "",
        }, {
            id: 'shoulderR',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getAbsolutePos(config, 'uppercollar.collar.markR')?.x,
            y: (control, config) => getAbsolutePos(config, 'uppercollar.collar.markR')?.y,

            rotation: linkedRotation('uppercollar.collar.markR', 'armR'),
            scaleY: linkedScaleY('uppercollar.collar.markR', 'armR'),
            resource: "",
        }, {
            id: 'uppercollar',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: (control, config) => getConfig(config, 'upper')?.x,
            y: (control, config) => getConfig(config, 'upper')?.y,
            rotation: (control, config) => getConfig(config, 'upper')?.rotation,
            components: [{
                id: 'collar',
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -0.25,
                y: -106.45 + 71,
                rotation: ({side_sin}) => side_sin * 15,
                components: [{
                    id: 'markL', x: 0.25 - 11.3 - 1, y: 106.45 - 106.95, virtual: true,
                }, {
                    id: 'markR', x: 0.25 + 13.7 + 1, y: 106.45 - 106.95, virtual: true,
                }, {
                    id: 'neck',
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 1.7 + 0.25,
                    y: -112.85 + 106.45,
                    rotation: ({side_sin}) => side_sin * 15,
                    resource: "",
                }, {
                    id: 'tie',
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: -1.9,
                    y: 9.2,
                    gravityX: 0,
                    gravityY: 0.002,
                    massX: 0,
                    massY: 32,
                    rotation: physicsRotation('uppercollar.collar.tie'),
                    scaleY: physicsScaleY('uppercollar.collar.tie'),
                    resource: "",
                }, {
                    id: 'collar',
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 0,
                    y: 0,
                    resource: "",
                }]
            },]
        }, {
            id: 'head',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: ({side_sin}) => 1 + side_sin * 4,
            y: ({lean}) => -125 + 10 * (lean),
            rotation: ({side_sin}) => side_sin * 30,
            components: [{
                id: 'tailL', x: -44.95 - 1.7, y: -197 + 125.05, virtual: true,
            }, {
                id: 'tailR', x: 70.1 - 1.7, y: -205.75 + 125.05, virtual: true,
            }, {
                id: 'phoneL',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -43,
                y: -26.85,
                resource: "",
            }, {
                id: 'clipBL',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -47.05,
                y: -86.05,
                resource: "",
            }, {
                id: 'clipFL',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -48.4,
                y: -83.4,
                resource: "",
            }, {
                id: 'momiL',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -45.85,
                y: -35.5,
                gravityX: 0.0005,
                gravityY: 0.008,
                massX: 0,
                massY: 64,
                rotation: physicsRotation('head.momiL'),
                scaleY: physicsScaleY('head.momiL'),
                resource: "",
            }, {
                id: 'mic',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -46.85,
                y: -4,
                resource: "",
            }, {
                id: 'base',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -57.35,
                y: -110.85,
                resource: "",
            }, {
                id: 'face', x: -5.65, y: -22.9, components: [{
                    id: 'eyes',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 0.5,
                    y: -6.9,
                    resource: (control) => {
                        const mouthData = {
                            "aac": "",
                            "aao": "",
                            "ehehc": "",
                            "eheho": "",
                            "happyc": "",
                            "happyo": "",
                            "jadedc": "",
                            "jadedo": "",
                            "ooc": "",
                            "ooo": "",
                            "pumpedc": "",
                            "pumpedo": "",
                            "sideglancec": "",
                            "sideglanceo": "",
                            "xxc": "",
                            "xxo": ""
                        }
                        return mouthData[control.eyeType + control.eyeOpen] || mouthData.happyo;
                    }
                }, {
                    id: 'facered',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 0.7,
                    y: 12.8,
                    resource: "",
                }, {
                    id: 'mouth',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 0.2,
                    y: 18.75,
                    resource: (control) => {
                        const mouthData = {
                            "angry1": "",
                            "angry2": "",
                            "angry3": "",
                            "angry4": "",
                            "angry5": "",
                            "angry6": "",
                            "angry7": "",
                            "cat1": "",
                            "cat2": "",
                            "cat3": "",
                            "cat4": "",
                            "cat5": "",
                            "cat6": "",
                            "cat7": "",
                            "drool1": "",
                            "drool2": "",
                            "drool3": "",
                            "drool4": "",
                            "drool5": "",
                            "drool6": "",
                            "drool7": "",
                            "duck1": "",
                            "duck2": "",
                            "duck3": "",
                            "duck4": "",
                            "duck5": "",
                            "duck6": "",
                            "duck7": "",
                            "happy1": "",
                            "happy2": "",
                            "happy3": "",
                            "happy4": "",
                            "happy5": "",
                            "happy6": "",
                            "happy7": "",
                            "neutral1": "",
                            "neutral2": "",
                            "neutral3": "",
                            "neutral4": "",
                            "neutral5": "",
                            "neutral6": "",
                            "neutral7": "",
                            "pout1": "",
                            "pout2": "",
                            "pout3": "",
                            "pout4": "",
                            "pout5": "",
                            "pout6": "",
                            "pout7": "",
                            "tongue1": "",
                            "tongue2": "",
                            "tongue3": "",
                            "tongue4": "",
                            "tongue5": "",
                            "tongue6": "",
                            "tongue7": ""
                        }
                        return mouthData[control.mouthType + control.mouth] || mouthData.happy1;
                    }
                }]
            }, {
                id: 'clipBR', x: 67.8 + 1.4, y: -74.95 - 2.6, virtual: true
            }, {
                id: 'clipFR',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: 67.8,
                y: -74.95,
                resource: "",
            }, {
                id: "ahoge",
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -19.3,
                y: -103.45,
                gravityX: -0.012,
                gravityY: -0.012,
                massX: 0,
                massY: -32,
                rotation: physicsRotation('head.ahoge', 180),
                scaleY: physicsScaleY('head.ahoge'),
                resource: "",
            }, {
                id: 'phoneR',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: 57.5,
                y: -28.9,
                resource: "",
            }, {
                id: 'momiR',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: 44.55,
                y: -36.5,
                gravityX: -0.001,
                gravityY: 0.008,
                massX: 0,
                massY: 64,
                rotation: physicsRotation('head.momiR'),
                scaleY: physicsScaleY('head.momiR'),
                resource: "",
            }, {
                id: 'bangs',
                width: 800,
                height: 600,
                resourceCenterX: 400,
                resourceCenterY: 300,
                x: -4.7,
                y: -96.4,
                components: [{
                    id: 'L',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: -13.55,
                    y: -1.3,
                    gravityX: 0,
                    gravityY: 0.064,
                    damp: 0.015,
                    massX: 0,
                    massY: 128,
                    rotationMin: -7,
                    rotationMax: 7,
                    rotation: physicsRotation('head.bangs.L'),
                    scaleY: physicsScaleY('head.bangs.L'),
                    resource: "",
                }, {
                    id: 'M',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 7.5,
                    y: -1.7,
                    gravityX: 0,
                    gravityY: 0.064,
                    damp: 0.015,
                    massX: 0,
                    massY: 100,
                    rotation: physicsRotation('head.bangs.M'),
                    scaleY: physicsScaleY('head.bangs.M'),
                    resource: "",
                }, {
                    id: 'R',
                    width: 800,
                    height: 600,
                    resourceCenterX: 400,
                    resourceCenterY: 300,
                    x: 34.35,
                    y: 0,
                    gravityX: 0,
                    gravityY: 0.064,
                    damp: 0.015,
                    massX: 0,
                    massY: 128,
                    rotationMin: -7,
                    rotationMax: 7,
                    rotation: physicsRotation('head.bangs.R'),
                    scaleY: physicsScaleY('head.bangs.R'),
                    resource: "",
                },]
            }
                // {
                //     id:'mark',
                //     x:-100,
                //     y:-100,
                //     rotation:90,
                // }
            ]
        }, {
            id: 'armL',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: ({side_ang}) => -17.35 + (Math.sin(side_ang - .5) + .75) * 5,
            y: ({side_cos}) => -88.75 - (0 - side_cos) * 10,
            resource: ""
        }, {
            id: 'armR',
            resourceCenterX: 400,
            resourceCenterY: 300,
            x: ({side_ang}) => 14.15 + (Math.sin(side_ang + .5) - .75) * 5,
            y: ({side_cos}) => -89.75 - (0 - side_cos) * 10,
            resource: ""
        },]
    }
})

mikuConfig();
// COPY AREA END


// DO NOT COPY THIS LINE
export default mikuConfig;
