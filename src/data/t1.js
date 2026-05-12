export const SCHERA_ICONS = {
  msp: '/img/icon_msp',
  lw:  '/img/icon_lw',
  cns: '/img/icon_cns',
  pp:  '/img/icon_pp',
};

export const T1_IMAGES = {
  board_pos:   '/img/board_pos',
  rou_gear:    '/img/rou_gear',
  seir_gear:   '/img/seir_gear',
  lecliss_gear:'/img/lecliss_gear',
  schera_gear: '/img/schera_gear',
  sylvia_gear: '/img/sylvia_gear',
  icon_msp:    '/img/icon_msp',
  icon_lw:     '/img/icon_lw',
  icon_cns:    '/img/icon_cns',
  icon_pp:     '/img/icon_pp',
};

export const T1_DATA = {
  unitOrder: [
    { pos:1, name:'Rou' },
    { pos:2, name:'Seir' },
    { pos:3, name:'Lecliss' },
    { pos:4, name:'Scheherazade' },
    { pos:5, name:'Sylvia' },
  ],
  bonds: {
    'Rou': {
      costume: 'Red Riding Hood',
      stats: ['HP: +62.40%', 'DEF: +13.40%'],
      notes: 'Buffs whole team with Energy Guard scaling off Rou HP. Build HP to at least 21,000. Needs 50% Crit Rate minimum.',
    },
    'Seir': {
      costume: 'B-Rank Idol',
      stats: ['HP: +62.40%', 'Magic Resist: +13.40%'],
      notes: 'Grants SP on hit and 40-85% DMG reduction. Skill Potential 3 adds Energy Guard = 100% max HP. Needs 29,000 HP and 105% Magic Resist.',
    },
    'Lecliss': {
      costume: 'Android Queen',
      stats: ['HP: +62.40%', 'DEF: +13.40%'],
      notes: 'Counter build. Energy Guard 65% max HP for 4 turns. Counter deals 15% max HP Physical DMG per hit. Needs 33,000 HP and 90% DEF.',
    },
    'Scheherazade': {
      costume: 'Magic Professor',
      stats: ['Magic ATK: +80', 'Magic Resist: +5.00%', 'Water DMG: +30.00%'],
      notes: 'Full dispel uptime across 4 costumes with 5-turn cooldown. Wants 50% Critical Rate. Build MATK + CDMG.',
    },
    'Sylvia': {
      costume: 'Bikini Agent',
      stats: ['ATK: +80', 'Crit Rate: +4.60%', 'Crit DMG: +47.20%'],
      notes: 'Extends all buff durations by 2 turns. Synergises with Sword Queen ATK buff. Wants 50% Critical Rate and lots of ATK% subs.',
    },
  },
  rotation: {
    'Rou': [
      { name:"It's Snack Time!", costume:'Red Riding Hood', sp:'SP 3', cd:'CD 5', tile:'FRONT', desc:'Crit Rate +30%, Crit DMG +150% for 4 turns. Creates Energy Guard equal to 50% of max HP for 4 turns for all allies.' },
      { name:'Half Moon Kick', costume:'White Cat', sp:'SP 2', cd:'CD 3', tile:'FRONT', desc:'75% evasion chance for 2 turns. Knockback 3 tiles — collision deals 100% max HP DMG. DoT 75% ATK per turn for 6 turns.' },
      { name:"Let's Play Hide and Seek!", costume:"Nature's Claw", sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'75% evasion for 2 turns. 5-hit Physical DMG equal to 7% max HP each hit. DEF shred 20% at SP2.' },
      { name:'Terra Burst', costume:'Stray Cat', sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'Crit Rate +30% for 1 turn. Physical DMG 500% ATK in wide AOE.' },
      { name:"Let's Play Hide and Seek!", costume:"Nature's Claw", sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'75% evasion for 2 turns. 5-hit Physical DMG equal to 7% max HP each hit. DEF shred 20% at SP2.' },
    ],
    'Seir': [
      { name:'Protective Instinct', costume:"Demon's Daughter", sp:'SP 3', cd:'CD 5', tile:'SELF', desc:'Heal 15% max HP on hit for 4 turns. DMG reduction 40-85%. Taunt for 4 turns at SP3.' },
      { name:'He is Bullying Me!', costume:'B-Rank Idol', sp:'SP 2', cd:'CD 5', tile:'SELF', desc:'Acquire 2 SP when attacked for 2 turns. DMG reduction 40-85%. Energy Guard 100% max HP at SP3.' },
      { name:'Protective Instinct', costume:"Demon's Daughter", sp:'SP 3', cd:'CD 5', tile:'SELF', desc:'Heal 15% max HP on hit for 4 turns. DMG reduction 40-85%. Taunt for 4 turns at SP3.' },
      { name:'He is Bullying Me!', costume:'B-Rank Idol', sp:'SP 2', cd:'CD 5', tile:'SELF', desc:'Acquire 2 SP when attacked for 2 turns. DMG reduction 40-85%. Energy Guard 100% max HP at SP3.' },
      { name:'Protective Instinct', costume:"Demon's Daughter", sp:'SP 3', cd:'CD 5', tile:'SELF', desc:'Heal 15% max HP on hit for 4 turns. DMG reduction 40-85%. Taunt for 4 turns at SP3.' },
    ],
    'Lecliss': [
      { name:'Curse Replica', costume:'Killer Doll', sp:'SP 1', cd:'CD 5', tile:'SELF', desc:'Taunt for 2 turns. Decrease incoming DMG by 85% for 2 turns.' },
      { name:'Auto Defense Mode', costume:'Android Queen', sp:'SP 4', cd:'CD 5', tile:'SELF', desc:'Counter target for 15% max HP Physical DMG when attacked for 4 turns. Energy Guard 65% max HP for 4 turns.' },
      { name:'Curse Replica', costume:'Killer Doll', sp:'SP 1', cd:'CD 5', tile:'SELF', desc:'Taunt for 2 turns. Decrease incoming DMG by 85% for 2 turns.' },
      { name:'Auto Defense Mode', costume:'Android Queen', sp:'SP 4', cd:'CD 5', tile:'SELF', desc:'Counter target for 15% max HP Physical DMG when attacked for 4 turns. Energy Guard 65% max HP for 4 turns.' },
      { name:'Curse Replica', costume:'Killer Doll', sp:'SP 1', cd:'CD 5', tile:'SELF', desc:'Taunt for 2 turns. Decrease incoming DMG by 85% for 2 turns.' },
    ],
    'Scheherazade': [
      { name:'Sapphire Boomerang', costume:'Code Name S',        icon:'cns', sp:'SP 4', cd:'CD 5', tile:'FRONT', desc:'3-hit Magic DMG 95% MATK each. Remove target Buff Effect. Apply Silence for 2 turns.' },
      { name:'Aqua Break',         costume:'Lapis Witch',         icon:'lw',  sp:'SP 4', cd:'CD 5', tile:'FRONT', desc:'3-hit Magic DMG 90% MATK each. Remove target Buff Effect.' },
      { name:'Aqua Silence',       costume:'Magic School Professor',icon:'msp',sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'3x3 AOE Magic DMG. Remove target Buff Effect. 15% M.RES shred at SP1.' },
      { name:'Sapphire Boomerang', costume:'Code Name S',        icon:'cns', sp:'SP 4', cd:'CD 5', tile:'FRONT', desc:'3-hit Magic DMG 95% MATK each. Remove target Buff Effect. Apply Silence for 2 turns.' },
      { name:'Aqua Break',         costume:'Lapis Witch',         icon:'lw',  sp:'SP 4', cd:'CD 5', tile:'FRONT', desc:'3-hit Magic DMG 90% MATK each. Remove target Buff Effect.' },
    ],
    'Sylvia': [
      { name:'Continuous Blossom Flying Sword', costume:'Sword Queen',   sp:'SP 1', cd:'CD 5', tile:'FRONT', desc:'ATK +100% self buff for 2 turns (+225% at +5). 4-hit Physical DMG 25% ATK. Sets up combo for Bikini Blaster.' },
      { name:'Bikini Blaster',                  costume:'Bikini Agent',   sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'Extend all buff durations by 2 turns. Physical DMG 400% ATK.' },
      { name:'The Punisher',                    costume:'Desert Flower',  sp:'SP 4', cd:'CD 5', tile:'SELF',  desc:'Counter target for 400% ATK Physical DMG when attacked for 4 turns. 50% DMG reduction for 4 turns.' },
      { name:'Continuous Blossom Flying Sword', costume:'Sword Queen',   sp:'SP 1', cd:'CD 5', tile:'FRONT', desc:'ATK +100% self buff for 2 turns (+225% at +5). 4-hit Physical DMG 25% ATK.' },
      { name:'Bikini Blaster',                  costume:'Bikini Agent',   sp:'SP 5', cd:'CD 5', tile:'FRONT', desc:'Extend all buff durations by 2 turns. Physical DMG 400% ATK.' },
    ],
  },
};

export const T1_IMAGE_KEYS = [
  'board_pos',
  'rou_gear','seir_gear','lecliss_gear','schera_gear','sylvia_gear',
  'icon_msp','icon_lw','icon_cns','icon_pp',
  ...['rou','seir','lecliss','schera','sylvia'].flatMap(c =>
    [1,2,3,4,5].map(i => `tile_${c}_${i}`)
  ),
];
