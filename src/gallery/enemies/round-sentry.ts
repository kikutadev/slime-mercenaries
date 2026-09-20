import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'round-sentry',order:371,entityKind:'enemy',name:'ころ兵',
  classification:'Melee / Moonlit Castle',
  role:'大きな丸helmetと短いtoy spear。槍を引いて完全に止まり、一拍後だけ鋭く突く。',
  modelKind:'round-sentry',asset:'assets/enemies/round-sentry.glb',accent:'#777f9f',productionScale:.38,
  enemyBehaviorId:'castle-spear-thrust',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Stop-Thrust',
  implementationStatus:'implemented',
  notes:'Top-heavy toy sentry: helmet first, tiny body second, one detached short spear.'
} satisfies SlimeGalleryDefinition;