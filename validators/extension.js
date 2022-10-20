const { body } = require('express-validator')

const { Category } = require('../models')
const { summarize } = require('./utils')

const extensionValidator = [
  body('name').escape().trim().notEmpty().withMessage('name field is required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('category field is required')
    .bail()
    .custom(async categoryId => {
      const category = await Category.findById(categoryId)
      if (!category) throw new Error('invalid category')
    })
    .withMessage('invalid category selection'),
  body('stars')
    .trim()
    .notEmpty()
    .withMessage('stars field is required')
    .bail()
    .isFloat({ min: 0, max: 5 })
    .withMessage('stars must be between 0.0 and 5.0')
    .toFloat(),
  body('downloads')
    .trim()
    .notEmpty()
    .withMessage('downloads field is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('downloads field must be non negative')
    .toInt(),
  body('description')
    .escape()
    .trim()
    .notEmpty()
    .withMessage('description fields is required'),
  summarize(['name', 'category', 'stars', 'downloads', 'description']),
]

module.exports = extensionValidator
