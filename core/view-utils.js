const formateNumber = (() => {
  const numberFormatter = Intl.NumberFormat('en', { notation: 'compact' }).format

  return n => numberFormatter(n)
})()

function starsAsList(stars) {
  const filled = Math.trunc(stars)
  const half = Number(stars - Math.trunc(stars) >= 0.5)
  const empty = 5 - (filled + half)

  const list = []
  for (let i = 0; i < filled; i += 1) list.push('full')
  if (half) list.push('half')
  for (let i = 0; i < empty; i += 1) list.push('empty')

  return list
}

function oneOf(locals, keysNames, field, fallback) {
  // eslint-disable-next-line no-restricted-syntax
  for (const keyName of keysNames) {
    if (keyName in locals && locals[keyName][field] !== undefined)
      return locals[keyName][field]
  }
  return fallback
}

module.exports = {
  formateNumber,
  starsAsList,
  oneOf,
}
