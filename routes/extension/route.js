const path = require('path')
const { unlink } = require('fs/promises')
const express = require('express')

const { getObjectOr404Middleware, isAdmin, csrfProtect } = require('../../core')
const conf = require('../../conf')
const { Extension, Category } = require('../../models')
const extensionValidator = require('../../validators/extension')
const { deleteReqFileIfError, imageUploader } = require('./uploader')

const router = express.Router()

router.get('/', async (req, res) => {
  const extensions = await Extension.find().populate('category')
  res.render('extension/list', { extensions })
})

router
  .route('/create')
  .get([
    csrfProtect,
    async (req, res) => {
      const categories = await Category.find()
      res.render('extension/form', { categories })
    },
  ])
  .post([
    imageUploader('image'),
    csrfProtect,
    extensionValidator,
    async (req, res) => {
      const categories = await Category.find()
      const {
        file,
        ctx: { fields },
      } = req

      if (!fields.valid || !file.valid) {
        await file.delete()

        return res.render('extension/form', {
          categories,
          fields: fields.values,
          errors: {
            ...fields.errors,
            ...(file.errors && { image: file.errors.map(e => ({ msg: e.message })) }),
          },
        })
      }

      const extension = await Extension.create({
        ...fields.values,
        fileName: file.fileName,
      })

      res.redirect(extension.url)
    },
    deleteReqFileIfError,
  ])

router.get(
  '/:id',
  getObjectOr404Middleware({ model: Extension, obj: 'extension' }),
  async (req, res) => {
    const { extension } = req.ctx
    await extension.populate('category')
    res.render('extension/detail', { extension })
  }
)

router
  .route('/:id/update')
  .get([
    getObjectOr404Middleware({ model: Extension, obj: 'extension' }),
    csrfProtect,
    async (req, res) => {
      const { extension } = req.ctx
      const categories = await Category.find()
      res.render('extension/form', { mode: 'update', extension, categories })
    },
  ])
  .post([
    getObjectOr404Middleware({ model: Extension, obj: 'extension' }),
    imageUploader('image'),
    csrfProtect,
    extensionValidator,
    isAdmin,
    async (req, res) => {
      const {
        file,
        ctx: { extension, fields, isAdmin },
      } = req

      if (!file.valid || !fields.valid || !isAdmin) {
        await file.delete()
        const categories = await Category.find()

        return res.render('extension/form', {
          mode: 'update',
          extension,
          categories,
          fields: fields.values,
          errors: {
            ...fields.errors,
            ...(!file.valid && { image: file.errors.map(e => ({ msg: e.message })) }),
            ...(!isAdmin && { password: [{ msg: 'invalid admin password' }] }),
          },
        })
      }

      Object.entries(fields.values).forEach(([name, val]) => (extension[name] = val))
      if (file.exists) {
        if (extension.fileName)
          await unlink(path.join(conf.UPLOADS_FS_PATH, extension.fileName))

        extension.fileName = file.fileName
      }

      await extension.save()

      req.flash(conf.FLASH_MSG_TYPE.INFO, 'extension updated')
      res.redirect(extension.url)
    },
    deleteReqFileIfError,
  ])

router
  .route('/:id/delete')
  .get([
    getObjectOr404Middleware({ model: Extension, obj: 'extension' }),
    csrfProtect,
    async (req, res) => {
      const { extension } = req.ctx
      res.render('extension/delete', { extension })
    },
  ])
  .post([
    csrfProtect,
    getObjectOr404Middleware({ model: Extension, obj: 'extension' }),
    isAdmin,
    async (req, res) => {
      const { extension, isAdmin } = req.ctx

      if (!isAdmin)
        return res.render('extension/delete', {
          extension,
          errors: { password: [{ msg: 'invalid admin password' }] },
        })

      await extension.delete()

      if (extension.fileName)
        await unlink(path.join(conf.UPLOADS_FS_PATH, extension.fileName))

      req.flash(conf.FLASH_MSG_TYPE.SUCCESS, 'extension deleted')
      res.redirect('/extensions')
    },
  ])

module.exports = router
