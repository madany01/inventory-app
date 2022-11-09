const express = require('express')

const conf = require('../conf')
const { csrfProtect, getObjectOr404Middleware, isAdmin } = require('../core')
const { Category, Extension } = require('../models')
const { categoryValidator } = require('../validators')

const router = express.Router()

router.use(csrfProtect)
router.use(isAdmin)

router.get('/', async (req, res) => {
  const categories = await Category.find()
  res.render('category/list', { categories })
})

router.get('/create', (req, res) => {
  res.render('category/form')
})

router.post('/create', categoryValidator, async (req, res) => {
  const { fields } = req.ctx

  if (!fields.valid)
    return res.render('category/form', {
      fields: fields.values,
      errors: fields.errors,
    })

  const category = await Category.create({ name: fields.values.name })

  req.flash(conf.FLASH_MSG_TYPE.SUCCESS, 'category created')
  res.redirect(`/categories/${category._id}`)
})

router.get(
  '/:id',
  getObjectOr404Middleware({ model: Category, obj: 'category' }),
  async (req, res) => {
    const { category } = req.ctx

    const extensions = await Extension.where('category')
      .equals(category)
      .populate('category')

    res.render('category/detail', { category, extensions })
  }
)

router.get(
  '/:id/update',
  getObjectOr404Middleware({ model: Category, obj: 'category' }),
  async (req, res) => {
    const { category } = req.ctx
    res.render('category/form', { category, mode: 'update' })
  }
)

router.post(
  '/:id/update',
  getObjectOr404Middleware({ model: Category, obj: 'category' }),
  categoryValidator,

  async (req, res) => {
    const { category, fields, isAdmin } = req.ctx

    if (!fields.valid || !isAdmin) {
      return res.render('category/form', {
        mode: 'update',
        category,
        fields: fields.values,
        errors: {
          ...fields.errors,
          ...(!isAdmin && { password: [{ msg: 'invalid admin password' }] }),
        },
      })
    }

    category.name = fields.values.name
    await category.save()

    req.flash(conf.FLASH_MSG_TYPE.SUCCESS, 'category update')
    res.redirect(`/categories/${category._id}`)
  }
)

router.get(
  '/:id/delete',
  getObjectOr404Middleware({ model: Category, obj: 'category' }),
  (req, res) => {
    const { category } = req.ctx
    res.render('category/delete', { category })
  }
)

router.post(
  '/:id/delete',
  getObjectOr404Middleware({ model: Category, obj: 'category' }),
  async (req, res) => {
    const { category, isAdmin } = req.ctx

    if (!isAdmin)
      return res.render('category/delete', {
        category,
        errors: { password: [{ msg: 'invalid admin password' }] },
      })

    await category.delete()
    await Extension.deleteMany({ category })
    req.flash(conf.FLASH_MSG_TYPE.SUCCESS, 'category deleted')
    res.redirect('/categories')
  }
)

module.exports = router
