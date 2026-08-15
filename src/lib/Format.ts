// Display formatting helpers for PokeAPI-shaped data. Locale-facing strings (units, labels)
// stay in i18n — these only massage raw values into interpolation-ready pieces.

/** PokeAPI slugs are lowercase and hyphen-separated ("mr-mime", "lightning-rod") — swap hyphens
 * for spaces and let CSS `capitalize` handle per-word casing at render time. */
export function humanizeSlug(slug: string): string {
  return slug.replaceAll('-', ' ')
}

/** Title-cased display name for contexts CSS can't reach (e.g. document.title). */
export function toDisplayName(slug: string): string {
  return humanizeSlug(slug).replace(/(^|\s)\w/g, (match) => match.toUpperCase())
}

/** Pokedex entry number, zero-padded the way the games render it (#025). */
export function formatPokedexNumber(pokeApiId: number): string {
  return `#${String(pokeApiId).padStart(3, '0')}`
}

/** PokeAPI weight is hectograms and height is decimeters — both are value/10 with one decimal. */
export function formatTenths(value: number): string {
  return (value / 10).toFixed(1)
}
