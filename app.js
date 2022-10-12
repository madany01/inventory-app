// eslint-disable-next-line import/order
const conf = require('./conf')

const path = require('path')

const log = require('debug')(`${conf.APP_NAME}:server`)
const express = require('express')
const morgan = require('morgan')
const expressLayouts = require('express-ejs-layouts')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const session = require('express-session')
const flash = require('connect-flash')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')

const { sessionPopper } = require('./utils')

// ______________________________ app ______________________________

const app = express()

//  ______________________________ req.ctx ______________________________

app.use((req, res, next) => {
  if (!req.ctx) req.ctx = Object.create(null)
  return next()
})

// ______________________________ templates ______________________________

app.set('views', path.join(__dirname, 'views'))

app.use(expressLayouts)
app.set('layout', './layouts/base')
app.set('view engine', 'ejs')
if (conf.DEVELOPMENT_ENV) app.disable('view cache')

// ______________________________ logging ______________________________

app.use(morgan('dev'))

// ______________________________ session ______________________________

app.use(
  session({
    secret: conf.COOKIE_SIGN_KEY,
    saveUninitialized: false,
    resave: false,
    name: conf.SESSION_COOKIE_NAME,
    store: MongoStore.create({
      mongoUrl: conf.MONGODB_URL,
      mongoOptions: conf.MONGODB_OPTS,
      collectionName: conf.SESSION_DB_NAME,
    }),
    cookie: {
      maxAge: conf.SESSION_COOKIE_MAX_AGE,
      sameSite: conf.SESSION_COOKIE_TYPE,
      signed: conf.PRODUCTION_ENV,
      secure: conf.PRODUCTION_ENV,
      httpOnly: conf.PRODUCTION_ENV,
    },
  })
)

app.use((req, res, next) => {
  Object.getPrototypeOf(req.session).pop = sessionPopper(req)
  return next()
})

// ______________________________ read forms body ______________________________

app.use(express.urlencoded({ extended: false }))

// ______________________________ cookie ______________________________

app.use(cookieParser(conf.COOKIE_SIGN_KEY))

// ______________________________ flash ______________________________

app.use(flash())

app.use((req, res, next) => {
  const getFlashMsgs = () => {
    if (!req.session.flash) return null

    const messages = {}

    Object.values(conf.FLASH_MSG_TYPE).forEach(type => {
      const msgs = req.flash(type)

      if (msgs.length) messages[type] = msgs
    })

    return Object.keys(messages).length ? messages : null
  }

  let messages = null

  res.locals.hasMessages = () => {
    messages = getFlashMsgs()
    return Boolean(messages)
  }

  res.locals.getMessages = () => {
    messages = messages ?? getFlashMsgs()
    return messages
  }

  return next()
})

// ______________________________ csrf ______________________________

app.use(
  csrf({
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
)

app.use((req, res, next) => {
  let csrf = null

  res.locals.getCSRF = () => {
    if (!csrf) csrf = req.csrfToken()
    return csrf
  }
  next()
})

// ______________________________ serve public ______________________________

app.use('/static', express.static('public'))

// ______________________________ routes ______________________________

app.get('/', (req, res) => {
  res.render('index')
})

// ______________________________ errors ______________________________

app.use((err, req, res, next) => {
  res.locals.serverError = conf.DEVELOPMENT_ENV ? err : { message: err.message }

  if (res.headersSent) return next(err)

  res.status(err.status || 500).render('error')
})

// ______________________________  ______________________________

mongoose
  .connect(conf.MONGODB_URL, conf.MONGODB_OPTS)
  .then(() => log(`connection to mongodb established`))
  .catch(e => {
    console.error('failed to connect to mongodb:')
    console.error(e)
    process.exit(1)
  })

app.listen(conf.PORT, () => {
  log(`⭐ Listening on http://localhost:${conf.PORT}/`)
})
