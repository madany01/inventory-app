require('dotenv').config()

const APP_NAME = 'inventory-app'
const PORT = process.env.PORT || 3000

const PRODUCTION_ENV = process.env.NODE_ENV === 'production'
const DEVELOPMENT_ENV = !PRODUCTION_ENV

const { MONGODB_URL = 'mongodb://localhost:27017/inventory_db' } = process.env
const MONGODB_OPTS = { useUnifiedTopology: true, useNewUrlParser: true }

const { COOKIE_SIGN_KEY } = process.env

const SESSION_DB_NAME = 'sessions'
const SESSION_COOKIE_NAME = `${PRODUCTION_ENV ? '__Host-' : ''}sessionid`
const SESSION_COOKIE_TYPE = 'lax'
const SESSION_COOKIE_MAX_AGE = 8 * 60 * 60 * 1000 // 8 hours

const CSRF_COOKIE_NAME = `${PRODUCTION_ENV ? '__Host-' : ''}csrf`
const CSRF_COOKIE_TYPE = 'lax'
const CSRF_TOKEN_MAX_AGE = 8 * 60 * 60 * 1000 // 8 hours

const HOME_URL = '/'

const FLASH_MSG_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
}

module.exports = {
  APP_NAME,
  PORT,

  PRODUCTION_ENV,
  DEVELOPMENT_ENV,

  MONGODB_URL,
  MONGODB_OPTS,

  COOKIE_SIGN_KEY,

  SESSION_DB_NAME,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_TYPE,
  SESSION_COOKIE_MAX_AGE,

  CSRF_COOKIE_NAME,
  CSRF_COOKIE_TYPE,
  CSRF_TOKEN_MAX_AGE,

  HOME_URL,

  FLASH_MSG_TYPE,
}
