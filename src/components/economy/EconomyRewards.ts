/**
 * What the economy PAYS OUT, mirrored from the backend's EconomyRules in the same spirit as
 * SlotSymbols mirrors the reel pool and SPIN_COST mirrors SLOT_COST.
 *
 * THE SERVER IS THE AUTHORITY on every figure here. These constants exist because the UI has to
 * name an amount BEFORE the request that settles it: the shop's claim button says what the daily
 * bonus is worth, and the release dialog quotes the refund for an entry that has not been released
 * yet. Wherever the server does report the settled figure — `creditsAwarded` on a catch and on a
 * release — the response is what gets rendered, so a drift between these mirrors and the rules
 * would surface as a toast disagreeing with the button rather than as a player being misinformed.
 */

/** POST /api/economy/daily grants this, at most once per rolling 24 hours. */
export const DAILY_BONUS = 1000

/** Poké Balls handed to a broke, ball-less trainer by the safety net. */
export const SAFETY_NET_BALL_GRANT = 5

/** Credits paid for releasing an entry. */
export const RELEASE_REFUND = 150

export const RELEASE_REFUND_LEGENDARY = 600

/**
 * The canonical Legendary + Mythical species ids, generations I–IX, grouped by generation exactly
 * as the backend groups them so the two lists diff cleanly. Ultra Beasts are excluded here for the
 * same reason they are excluded there: they are their own classification, not Legendary/Mythical.
 *
 * Static by nature — a species cannot retroactively become legendary — so this mirror does not rot
 * the way a mirrored price or payout could.
 */
const LEGENDARY_POKE_API_IDS: readonly number[] = [
  // Gen I — the legendary birds, Mewtwo and Mew
  144, 145, 146, 150, 151,
  // Gen II — the legendary beasts, the tower duo and Celebi
  243, 244, 245, 249, 250, 251,
  // Gen III — the golems, the eon duo, the weather trio, Jirachi and Deoxys
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen IV — the lake guardians, the creation trio and the Sinnoh mythicals
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen V — Victini, the swords of justice, the forces of nature, the tao trio and friends
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen VI — Xerneas, Yveltal, Zygarde and the Kalos mythicals
  716, 717, 718, 719, 720, 721,
  // Gen VII — Type: Null/Silvally, the tapus, the Cosmog line, Necrozma and the Alola mythicals
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809,
  // Gen VIII — the heroes of many battles, Eternatus, the Kubfu line, the Galar legendaries
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  // Gen IX — the treasures of ruin, the box legendaries, the paradox legendaries and Pecharunt
  1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025,
]

const LEGENDARY_ID_SET: ReadonlySet<number> = new Set(LEGENDARY_POKE_API_IDS)

export function isLegendary(pokeApiId: number): boolean {
  return LEGENDARY_ID_SET.has(pokeApiId)
}

/** The refund the confirm dialog quotes before the release is made — rarity is the only input. */
export function releaseRefund(pokeApiId: number): number {
  return isLegendary(pokeApiId) ? RELEASE_REFUND_LEGENDARY : RELEASE_REFUND
}
