> 本文件记录首版映射。运动拓扑已修订，请先读 [MOTION.md](MOTION.md) 和 ../../STATUS.md；“原物理全部保留”不再代表当前鲸鱼娘实现。

# 部件与运动映射

母版坐标：1254 × 1254。模型坐标 = `(参考坐标 - [540,1220]) × 0.22`。

| 节点 | 母版图层 | 资源数 | 运动来源 |
|---|---|---:|---|
| `whaleTail` | `whale-tail` | 1 | 新增腰部虚拟锚点 + 独立质点，只旋转 |
| `tailL` | `hair-back-left` | 1 | 原约束质点 |
| `tailR` | `hair-back-right` | 1 | 原约束质点 |
| `legL` | `leg-left` | 1 | 原父级联动 / 几何定位 |
| `legR` | `leg-right` | 1 | 原父级联动 / 几何定位 |
| `lower.skirt` | `skirt-apron` | 1 | 原约束质点 |
| `lower.belt` | `waist-ribbon` | 1 | 原约束质点 |
| `upper` | `bodice` | 1 | 原父级联动 / 几何定位 |
| `upper.shirtL` | `bodice-frill-left` | 1 | 原约束质点 |
| `upper.shirtR` | `bodice-frill-right` | 1 | 原约束质点 |
| `shoulderL` | `sleeve-left` | 1 | 原父级联动 / 几何定位 |
| `shoulderR` | `sleeve-right` | 1 | 原父级联动 / 几何定位 |
| `uppercollar.collar.neck` | `neck` | 1 | 原父级联动 / 几何定位 |
| `uppercollar.collar.collar` | `collar` | 1 | 原父级联动 / 几何定位 |
| `uppercollar.collar.tie` | `chest-bow` | 1 | 原约束质点 |
| `head.phoneL` | `head-fin-left` | 1 | 原父级联动 / 几何定位 |
| `head.phoneR` | `head-fin-right` | 1 | 原父级联动 / 几何定位 |
| `head.clipBL` | `hair-loop-left` | 1 | 原父级联动 / 几何定位 |
| `head.base` | `head-base` | 1 | 原父级联动 / 几何定位 |
| `head.face.eyes` | `eyes-happyo` 等 | 16 | 原 parseControl 表情协议 |
| `head.face.facered` | `blush` | 1 | 原父级联动 / 几何定位 |
| `head.face.mouth` | `mouth-happy1` 等 | 56 | 原 parseControl 表情协议 |
| `head.momiL` | `side-lock-left` | 1 | 原约束质点 |
| `head.momiR` | `side-lock-right` | 1 | 原约束质点 |
| `head.bangs.L` | `bangs-left` | 1 | 原约束质点 |
| `head.bangs.M` | `bangs-center` | 1 | 原约束质点 |
| `head.bangs.R` | `bangs-right` | 1 | 原约束质点 |
| `head.ahoge` | `ahoge` | 1 | 原约束质点 |
| `head.headDress` | `maid-headdress` | 1 | 原父级联动 / 几何定位 |
| `head.clipFR` | `blue-hair-bow` | 1 | 原父级联动 / 几何定位 |
| `armL` | `forearm-left` | 1 | 原父级联动 / 几何定位 |
| `armR` | `forearm-right` | 1 | 原父级联动 / 几何定位 |

虚拟定位仍使用 `head.tailL/R`、`lower.markL/R` 等既有路径；鲸尾使用新增 `lower.whaleTailRoot`，根级后层绘制。

导出矩阵包含静态父级旋转和缩放的逆变换，完整数值见同目录 JSON。
