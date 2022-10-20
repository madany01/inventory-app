// eslint-disable-next-line import/order
const conf = require('./conf')

const path = require('path')

const log = require('debug')(`${conf.APP_NAME}:server`)
const express = require('express')
const httpError = require('http-errors')
const morgan = require('morgan')
const expressLayouts = require('express-ejs-layouts')

const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')

const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')

const { homeRoute, categoryRoute, extensionRoute } = require('./routes')
const { csrfProtect, sessionPopper, viewUtils } = require('./core')

// ______________________________ app ______________________________

const app = express()

//  ______________________________ req.ctx ______________________________

app.use((req, res, next) => {
  if (!req.ctx) req.ctx = Object.create(null)
  return next()
})

// ______________________________ templates ______________________________

app.set('views', path.join(__dirname, 'views'))
if (conf.DEVELOPMENT_ENV) app.disable('view cache')

app.use(expressLayouts)
app.set('layout', './layouts/base')
app.set('view engine', 'ejs')

// app.set('view engine', 'hbs')
// app.engine(
//   'hbs',
//   hbsEngine({
//     layoutsDir: `${__dirname}/views/layouts`,
//     extname: 'hbs',
//     defaultLayout: 'base',
//     partialsDir: `${__dirname}/views/partials/`,
//   })
// )

app.use((req, res, next) => {
  res.locals.ejsutils = viewUtils
  res.locals._conf = {
    MAX_UPLOAD_FILE_SIZE: conf.MAX_UPLOAD_FILE_SIZE,
  }
  next()
})
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

// ______________________________ read form body ______________________________

app.use(express.urlencoded({ extended: false }))

// ______________________________ cookie ______________________________

app.use(cookieParser(conf.COOKIE_SIGN_KEY))

// ______________________________ flash ______________________________

app.use(flash())

app.use((req, res, next) => {
  const getFlashMsgs = () => {
    if (!req.session.flash) return null

    const messages = {}

    Object.entries(req.flash()).forEach(([type, msgs]) => {
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

// ______________________________ res.csrf ______________________________

app.use((req, res, next) => {
  let csrf = null

  res.locals.getCSRF = () => {
    if (!csrf) csrf = req.csrfToken()
    return csrf
  }
  next()
})

// ______________________________ routes ______________________________
app.use('/', homeRoute)
app.use('/categories', categoryRoute)
app.use('/extensions', extensionRoute)

// ______________________________ csrf protect ______________________________

app.use(csrfProtect)

// ______________________________ serve public/uploads ______________________________

app.use('/static', express.static('public'))
app.use(conf.UPLOADS_URL, express.static('uploads'))

// ______________________________ errors ______________________________
app.use((req, res, next) => next(httpError(404)))

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (conf.DEVELOPMENT_ENV) {
    return res.status(err.status || 500).render('error', { serverError: err })
  }

  if (httpError.isHttpError(err))
    return res.status(err.status).render('error', {
      serverError: {
        status: err.status,
        message: httpError(err.status).message,
      },
    })

  res.status(500).render('error', { serverError: { status: 500, messages: '5 0 0' } })
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
