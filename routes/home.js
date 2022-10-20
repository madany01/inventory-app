const express = require('express')

const { Category, Extension } = require('../models')

const router = express.Router()

router.get('/', async (req, res) => {
  const categories = await Category.find()
  const extensions = await Extension.find().populate('category')
  res.render('index', { categories, extensions })
})

module.exports = router
