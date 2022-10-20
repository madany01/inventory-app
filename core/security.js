const csurf = require('csurf')

const conf = require('../conf')

const csrfProtect = csurf({
  cookie: {
    key: conf.CSRF_COOKIE_NAME,
    sameSite: conf.CSRF_COOKIE_TYPE,
    signed: conf.PRODUCTION_ENV,
    secure: conf.PRODUCTION_ENV,
    httpOnly: conf.PRODUCTION_ENV,
    maxAge: conf.CSRF_TOKEN_MAX_AGE,
  },
  value: req => req.headers['x-csrf-token'] ?? (req.body && req.body['csrf-token']),
})

function isAdmin(req, res, next) {
  if (req.body?.password === conf.ADMIN_PASSWORD) req.ctx.isAdmin = true
  next()
}

module.exports = { csrfProtect, isAdmin }
