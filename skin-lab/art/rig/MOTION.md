# 鲸鱼娘运动映射：修订版

| 图层/节点 | 附着边界 | 当前运动 | 本轮处理 |
|---|---|---|---|
| tailL、hairBackCenter、tailR | 头皮宽区域 | 共享三分区场，根部锁定、下部滞后 | 去掉原马尾质点和 scaleY |
| head.momiL/R | 两侧头皮 | 随头刚性运动 | 支点从脸颊中段上移 |
| lower.skirt | 整条腰线 y=820（母版） | 4×4 活动网格加固定腰带区，腰部零位移、下缘渐进变形 | 去掉单点旋转 |
| lower.apron | 同一腰线 | 独立图层，较小变形权重 | 从裙子图层拆出 |
| shoulderL/R、armL/R | 上身肩点 → 骨盆腕点 | 两段定长关节求解，固定肘弯侧 | 去掉独立手部摆放假设 |
| collar.tie、lower.belt | 衣服固定连接 | 随所属身体节点 | 去掉挂摆/伸缩 |
| whaleTail | 骨盆尾根 | 独立限角质点 | 维持首版，无纵向伸缩 |
| 刘海、呆毛、肩部褶边 | 原对应根部 | 原物理结构 | 六个旧物理节点参数保留 |

## 参考坐标与动力学坐标

美术母版使用 1254×1254 参考坐标。导出矩阵把母版转换为各资源的 800×600 坐标，资源中心为 (400,300)。变形场在母版坐标中计算，再通过对应矩阵投影，三张后发图使用同一变形场，避免各自乱摆。

关节求解采用根节点局部坐标；父级矩阵包含旋转、平移和缩放，最终再由原渲染器应用根节点的显示比例。屏幕摄像机缩放不进入动力学。

新二级运动使用秒、固定 1/120 秒子步长；帧间输入速度作为惯性驱动。发区回正刚度为 65/85，邻区耦合 24，速度阻尼 18；裙摆回正 135，速度阻尼 23。这些是鲸鱼娘新增求解器的试验参数，与 JohnSu 原引擎的 `damp`、`massY` 不同。需要通过连续动作继续验收，数值收敛只作为最低条件。

## 当前限制

这不是完整布料/发束碰撞系统。腰线和头皮固定、手腕接触约束是已覆盖的边界；人体碰撞、衣料自碰撞、极端朝向的精细遮挡尚未实现。前发暂时没有单独发梢惯性。脚部仍沿用腿图层，需要后续把鞋子独立出来以进一步改善地面接触。

网格行显式经过头皮 y=330 和腰线 y=820，避免仅在变形公式中设零、实际插值网格却跨过锚线而产生滑动。

### 围裙腰后系带（图层纠正）
`apron-back-ties` 属于 `lower.belt` 的腰部布料，绘制在双臂后方。
它不是袖口、手部装饰，也不跟随 `armR` 的 IK 旋转。
袖口只保留手腕处的灰色窄带；参考图中的浅色上方布结与斜向飘带由腰部图层承担。

### 呆毛下尖端支点
呆毛支点以母版 `(583,181)` 为准，为下端与头部相接的尖点。
鲸鱼模型局部关节为 `x=9.46, y=-109.78`（相对于中性位 head）；导出后该尖点精确落在资源 `(400,300)`。
保留原有呆毛运动公式和物理参数；只重新定位鲸鱼娘关节并重建适配轮廓。
绘制顺序为头圈在后、呆毛在前，呆毛不含白色描边。
可重复执行 `node skin-lab/scripts/refine-ahoge.mjs` 后 `npm --prefix skin-lab run art:export`。

## Front garment detail pass (2026-10-24)
- Rear green diagnostic hair and head/face geometry left unchanged.
- Front garment contours refined in the common 1254 reference coordinate frame: bib, collar/frills, bow, apron scallops/folds, gold bow, sleeve material folds and cuffs.
- Apron back ties remain waist-attached; palms/cuffs/forearms remain independent with original IK and motion parameters.
- Repeatable pass: `node scripts/refine-front-details.mjs` then `npm run art:export` (from skin-lab). Resets only this pass's named front art groups from the saved baseline, preserving other groups; later edits to these same front groups should be ported into this pass before rerunning.
- Neutral zoomed evidence: `screenshots/front-details-final/whale-center-happy-happy-hair-back-crop-340-670-440-400.png`.
- Rig stress tests, build, and neutral pointer/keyboard pixel stability passed. This is a front-detail iteration, not a claim of pixel-identical final artwork.

### Neck/collar refinement
- Follow front garment pass with `node scripts/refine-neck-details.mjs` before art export.
- Neck exposed contour traced separately from the collar, with hidden overlap under the chin; right collar extends horizontally toward the shoulder frill, not a rounded hanging lobe.
- Neck and collar retain original separate nodes and motion parameters. Green rear hair remains unchanged.
- Neutral detail evidence: `screenshots/neck-detail-final/whale-center-happy-happy-hair-back-crop-450-660-210-140.png`.

### Unified rear curtain
- `hairBackCenter` now draws all rear hair (one SVG/one deforming mesh). Six obsolete display nodes remain virtual markers only. Total live meshes reduced from five to three.
- Scalp remains fixed above source y330; under-locks and outer curls share the existing continuous hair displacement field. Solver spring/damping constants unchanged.
- Final 4-second local headless motion measurement: 60.18 FPS, p95 16.8ms, 0 long tasks. Small under-locks use continuous gradients without extra blur passes.
- Nine-direction browser checks, neutral pixel invariance, and rig stress tests passed. Current foreground art unchanged by the merge.

## Garment constraints (2026-10-24, physics-only pass)

- Removed inherited Miku sleeve-pendulums from `upper.shirtL/R` (old massY16, damp.005, physicsScaleY). These are sewn bib frills, not hanging sleeves. Collar and neck local rotation fixed at zero; all white chest fabric follows the upper torso rigidly. No independent stretch/sway remains.
- Chest bow pivot is its pin at source (540,723). It retains a separate bounded, damped angular degree of freedom; no white cloth inherits that angular motion.
- Skirt: pinned whole waist through source y835, three columns (left/center/right), two free lateral joints per column. Neighbor coupling preserves continuity; tip is softer than upper row. Vertical inertial lift is bounded. This is a deforming cloth field, not a triangle turning about one apex.
- Apron: same pinned waist, independent six-joint spring state, lower amplitude and delayed response relative to skirt. Mesh has explicit 820/835 rows so interpolation also preserves the sewn seam.
- Skirt gold bow split out of the old waist ribbon resource into `lower.skirtBow`. Knot at source (694,935). Knot position samples the actual skirt mesh triangles, then an independent bounded angle is added about that knot. Pale apron back straps remain in lower.belt and do not follow the gold bow rotation.
- Head lace reordered behind both front curls and bangs, with ahoge still in front of lace. No silhouette/color retouching.
- Existing head/hair/whale-tail solver constants and classic model kept intact. Source art changes only separate the existing gold bow path into its own node.
- Tests: 540-frame motion/settling repeatability with fixed chest rotations/scales, pinned apron waist, both bows and both fabric states excited; 1500-frame base rig stress, nine browser directions, neutral input immunity, build. Motion maxima: skirt18.69/apron11.84 source px; chest/side bow2.33/1.47 degrees; all converge after stopping.
- Local 4-second runtime sample:60.23 FPS, p95 16.7ms,0 long tasks.
- Motion video: `screenshots/rig-v2/video/whale-turn-stop.webm`; initial neutral comparison: `screenshots/garment-physics-neutral/whale-center-happy-happy.png`.
- Historical front-detail generator currently predates `skirt-side-bow`; do not rerun it blindly, as it would put the gold bow back into the waist-ribbon art. Exporting current master with `npm run art:export` is supported.

### Original-versus-whale smoothness audit
See `CLASSIC-CLOTH-COMPARISON.md` and `cloth-smooth-ab.json` for original bone parameters, approximations, same-input A/B evidence and measurements.
- Replaced velocity-target cloth dragging with filtered base-acceleration forcing.
- Skirt/apron independently excited with modest contact coupling; removed double low-pass following.
- Lowered near-critical garment damping to bounded underdamped response; both bows likewise use inertial excitation.
- Shared-tangent Hermite interpolation in vertical and horizontal axes; denser longitudinal mesh samples. Waist row and waist tangent pinned; sewn side bow still samples exact mesh triangles.
- Dynamic same-input classic comparison is available at `/physics-compare.html`, with display-only size normalization. Motion repeats every9 seconds including a settling interval. Original source/core untouched.
- Local performance60.12FPS, p9516.7ms; static neutral unchanged; 540-frame settling/stress and nine-direction browser tests passed.
