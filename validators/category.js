const { body } = require('express-validator')

const { summarize } = require('./utils')

const categoryValidator = [
  body('name')
    .escape()
    .trim()
    .isLength({ min: 3 })
    .withMessage('category name must be at least 3 characters long'),
  summarize(['name']),
]

module.exports = categoryValidator
