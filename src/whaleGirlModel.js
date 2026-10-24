import {createWhaleModel} from '../skin-lab/src/model.js';
const config=createWhaleModel();
// LIVE neutral landmarks on the shared 800×600 stage:
// Miku scalp crown=178, foot sole=473 (hair ornaments/ahoge excluded).
// Previous whale sole=473, scalp=204: enlarge about 9.7% around its soles.
// Presentation transform only; authored geometry and physics remain unchanged.
// Align whale's head horizontally with Miku's head (offset by +18.36px to align the head landmark across skins)
const scale=(314/433)*(295/269),root=config.model;
root.x=396.5-(397.5-root.x)*scale+18.36;
root.y=473-(553-root.y)*scale;
root.scaleX*=scale;root.scaleY*=scale;
export default config;
