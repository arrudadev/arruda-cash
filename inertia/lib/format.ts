const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/**
 * Formats an integer amount of cents as a BRL currency string.
 */
export function formatBRL(cents: number) {
  return currencyFormatter.format(cents / 100)
}
