const createError = require('http-errors')

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

async function getObjectOr404(model, id) {
  try {
    return await model.findById(id).orFail()
  } catch {
    throw createError(404)
  }
}

function getObjectOr404Middleware({ model, param = 'id', obj: objName = 'obj' }) {
  return async (req, res, next) => {
    const obj = await getObjectOr404(model, req.params[param])

    req.ctx[objName] = obj
    next()
  }
}

function promisify(fn, multi = false) {
  const wrappedFnName = `${fn.name}Promisified`
  const fnWrapped = {
    async [wrappedFnName](...args) {
      return new Promise((resolve, reject) => {
        const cb = (e, ...results) => {
          if (e) return reject(e)
          resolve(multi ? results : results[0])
        }

        fn.call(this, ...args, cb)
      })
    },
  }

  return fnWrapped[wrappedFnName]
}

module.exports = { sessionPopper, getObjectOr404, getObjectOr404Middleware, promisify }
