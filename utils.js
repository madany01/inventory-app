function sessionPopper(req, session = 'session') {
  return (key, throwIfNotExists = false) => {
    if (throwIfNotExists && !(key in req[session]))
      throw new Error(`session doesn't have the key '${key}'`)

    const value = req[session][key]

    // eslint-disable-next-line no-param-reassign
    delete req[session][key]

    return value
  }
}

module.exports = { sessionPopper }
