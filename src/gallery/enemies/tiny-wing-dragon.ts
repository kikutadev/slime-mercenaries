import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'tiny-wing-dragon',order:382,entityKind:'enemy',name:'こつばさ竜',
  classification:'Melee / Dragon Crater',
  role:'頭に対して翼が小さすぎるヒナ竜。三回の空振り羽ばたきから一度だけ浮き、短距離の体当たりへつなぐ。',
  modelKind:'tiny-wing-dragon',asset:'assets/enemies/tiny-wing-dragon.glb',accent:'#7486aa',productionScale:.34,
  enemyBehaviorId:'dragon-tiny-wing-dive',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Tiny-Wing Dive',
  implementationStatus:'implemented',
  notes:'Tall giant-headed hatchling; the two tiny wing plates must read as intentionally underpowered.'
} satisfies SlimeGalleryDefinition;