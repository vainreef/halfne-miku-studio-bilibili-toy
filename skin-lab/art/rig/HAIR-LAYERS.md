# Rear hair physics — layered revision

This is a motion-oriented grouping inferred from the flat reference, not a claim about the illustrator's original layers. Highlights/shadows stay with their material surface and are not extra strands.

| Display node | Art section | Root in source | Motion |
|---|---|---|---|
| hairBackCenter | central dark curtain | 540,330 | heavy, small response |
| hairOuterL | left outer long curls | 318,360 | long, delayed tip |
| hairOuterR | right outer long curls | 819,355 | long, slightly softer |
| hairInnerL | left inner short curl | 333,550 | shorter, quicker settling |
| hairInnerR | right inner short curl | 797,550 | shorter, quicker settling |
| hairScalp | scalp / hair behind ear | head attachment | rigid |
| hairFlyL | left thin flyaways | 310,340 | light secondary response |
| hairFlyR | right thin flyaways | 900,390 | light secondary response |

Thus: 8 rear art layers; 5 hanging masses, 2 flyaway groups, 1 fixed scalp. A group can contain multiple visible curve tips; these are not eight individual anatomical hairs.

All rear layers draw behind clothing. Front face-framing locks are NOT rear hair: original head.momiL/R joints remain addressable virtual joints; frontLockL/R render proxies use their full world matrices and draw ABOVE forearms. The complete temple contours draw in head.bangs; dynamic front-curl textures feather their hidden upper roots (source y=490..610). Proxies draw after arms, with no opaque upper slabs covering the forehead. Do not lift the entire head above the curls to hide incomplete contours. Front locks also receive a smaller, stiffer two-joint bend.

Each moving section has pinned roots and two free spring joints, integrated at 120 Hz. Acceleration drives inertia; tip stiffness is lower, so upper and lower joints do not swing as a rigid board. Weak outer-to-center coupling retains the continuous loose-hair character without enforcing one shared displacement. C1 interpolation removes the middle-joint crease. Existing hidden overlap surfaces and vector gradients are preserved.

## Verification
- `npm --prefix skin-lab run art:export`: exports individual mother-SVG groups with normalized pivots.
- `npm --prefix skin-lab run rig:validate`: roots pinned, finite bounded response, independent section displacement, turn/stop convergence, repeatability, front-lock-over-arm ordering, classic source hash unchanged.
- `npm --prefix skin-lab run verify`: nine poses, image loading, debug grids, pause.
- `node skin-lab/scripts/verify-neutral.mjs`: initial-pose pointer/key immunity.
- `node skin-lab/scripts/record-motion.mjs`: browser video and measured FPS.

The old `rebuild-rear-hair.mjs` reconstructs the former merged artwork. Do not run it on the current layered master. `split-rear-hair.mjs` is the one-time migration from that merged version. Edit the eight current master groups and run art:export for normal iteration.

Evidence: screenshots/hair-layer-after (neutral arm closeup), screenshots/layered-hair-neutral (full neutral comparison), screenshots/layered-hair-motion (explicit simulation), screenshots/rig-v2/video/whale-turn-stop.webm.
