export const T1_DATA = {
  name: 'Sylvia Double Taunt',
  type: 'ATK',
  warning: 'Do Not Use unless going for Rank 1 — last hour only',
  characters: [
    {
      name: 'Rou',
      costume: 'Red Riding Hood',
      bondStats: 'HP +62.40%, DEF +13.40%',
      gearKey: 'rou_gear',
      tilePrefix: 'tile_rou',
    },
    {
      name: 'Seir',
      costume: 'B-Rank Idol',
      bondStats: 'HP +62.40%, Magic Resist +13.40%',
      gearKey: 'seir_gear',
      tilePrefix: 'tile_seir',
    },
    {
      name: 'Lecliss',
      costume: 'Android Queen',
      bondStats: 'HP +62.40%, DEF +13.40%',
      gearKey: 'lecliss_gear',
      tilePrefix: 'tile_lecliss',
    },
    {
      name: 'Scheherazade',
      costume: 'Magic Professor',
      bondStats: 'Magic ATK +80, Magic Resist +5.00%, Water DMG +30.00%',
      gearKey: 'schera_gear',
      tilePrefix: 'tile_schera',
    },
    {
      name: 'Sylvia',
      costume: 'Bikini Agent',
      bondStats: 'ATK +80, Crit Rate +4.60%, Crit DMG +47.20%',
      gearKey: 'sylvia_gear',
      tilePrefix: 'tile_sylvia',
    },
  ],
  rotation: [
    {
      character: 'Rou',
      skills: [
        { abbr: 'PS', sp: 0, cd: 0, tile: 'SELF',  desc: 'Passive — Increases own HP. Activates taunt when HP is above threshold.' },
        { abbr: 'S1', sp: 2, cd: 2, tile: 'FRONT', desc: 'Creates a shield proportional to max HP. Taunts enemies for 1 turn.' },
        { abbr: 'S2', sp: 3, cd: 3, tile: 'FRONT', desc: 'AoE DEF shred on front row. Increases own DEF for 2 turns.' },
        { abbr: 'S3', sp: 4, cd: 4, tile: 'SELF',  desc: 'Massive HP recovery + grant barrier to adjacent allies.' },
        { abbr: 'ULT', sp: 5, cd: 5, tile: 'ALL',  desc: 'Ultimate — Full row taunt. Grants invincibility for 1 hit. Recovers 30% HP.' },
      ],
    },
    {
      character: 'Seir',
      skills: [
        { abbr: 'PS', sp: 0, cd: 0, tile: 'SELF',  desc: 'Passive — Restores HP to lowest-HP ally each turn.' },
        { abbr: 'S1', sp: 2, cd: 2, tile: 'SELF',  desc: 'Heals self and adjacent allies. Removes 1 debuff from each.' },
        { abbr: 'S2', sp: 3, cd: 3, tile: 'ALL',   desc: 'Grants Magic Resist barrier to all allies for 2 turns.' },
        { abbr: 'S3', sp: 4, cd: 4, tile: 'FRONT', desc: 'Single target magic attack. Reduces target Magic Resist.' },
        { abbr: 'ULT', sp: 5, cd: 5, tile: 'ALL',  desc: 'Ultimate — Full team HP recovery + Magic Resist buff for 3 turns.' },
      ],
    },
    {
      character: 'Lecliss',
      skills: [
        { abbr: 'PS', sp: 0, cd: 0, tile: 'SELF',  desc: 'Passive — Reflects a portion of received damage back to attacker.' },
        { abbr: 'S1', sp: 2, cd: 2, tile: 'FRONT', desc: 'Grants DEF buff to self and adjacent. Creates a shield tile.' },
        { abbr: 'S2', sp: 3, cd: 3, tile: 'FRONT', desc: 'Counter stance — deals damage back on next hit, reduced damage taken.' },
        { abbr: 'S3', sp: 4, cd: 4, tile: 'SELF',  desc: 'Activates overdrive mode — DEF +40%, immune to CC for 2 turns.' },
        { abbr: 'ULT', sp: 5, cd: 5, tile: 'ALL',  desc: 'Ultimate — Deals AoE damage based on own DEF. Applies armor break.' },
      ],
    },
    {
      character: 'Scheherazade',
      skills: [
        { abbr: 'MSP', sp: 0, cd: 0, tile: 'SELF',  desc: 'Magic Professor — Passive. Boosts Water DMG by 15% for all allies.', iconKey: 'icon_msp' },
        { abbr: 'LW',  sp: 2, cd: 2, tile: 'FRONT', desc: 'Lapis Witch — Water magic bolt. Reduces target Magic Resist by 20% for 2 turns.', iconKey: 'icon_lw' },
        { abbr: 'CNS', sp: 3, cd: 3, tile: 'ALL',   desc: 'Code Name S — AoE Water damage to all enemies. Applies Wet status (reduces Fire Resist).', iconKey: 'icon_cns' },
        { abbr: 'PP',  sp: 4, cd: 4, tile: 'FRONT', desc: 'Purple Prince — Focused Water burst. 300% Magic ATK. Ignores 30% of target DEF.', iconKey: 'icon_pp' },
        { abbr: 'ULT', sp: 5, cd: 5, tile: 'ALL',   desc: 'Ultimate — Massive AoE Water DMG. 450% Magic ATK to all enemies. Resets Water DMG stacks.', iconKey: null },
      ],
    },
    {
      character: 'Sylvia',
      skills: [
        { abbr: 'PS', sp: 0, cd: 0, tile: 'SELF',  desc: 'Passive — Each attack has 30% chance to apply Crit DMG stack (up to 5).' },
        { abbr: 'S1', sp: 2, cd: 2, tile: 'FRONT', desc: 'Quick Strike — ATK +20% self for 2 turns. Single target hit, low CD.' },
        { abbr: 'S2', sp: 3, cd: 3, tile: 'FRONT', desc: 'Dual Taunt — Applies taunt to self and one ally. Boosts Crit Rate for 2 turns.' },
        { abbr: 'S3', sp: 4, cd: 4, tile: 'ALL',   desc: 'Chain Attack — Hits random enemies 3 times. Each hit applies Crit DMG buff stack.' },
        { abbr: 'ULT', sp: 5, cd: 5, tile: 'ALL',  desc: 'Ultimate — Unleashes all Crit DMG stacks in one burst. 500% ATK + 50% per stack.' },
      ],
    },
  ],
};

export const SCHERA_ICON_KEYS = ['icon_msp', 'icon_lw', 'icon_cns', 'icon_pp'];

export const T1_IMAGE_KEYS = [
  'board_pos',
  'rou_gear', 'seir_gear', 'lecliss_gear', 'schera_gear', 'sylvia_gear',
  'icon_msp', 'icon_lw', 'icon_cns', 'icon_pp',
  ...Array.from({ length: 5 }, (_, i) => `tile_rou_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `tile_seir_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `tile_lecliss_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `tile_schera_${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `tile_sylvia_${i + 1}`),
];
