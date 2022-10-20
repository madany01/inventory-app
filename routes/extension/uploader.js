// eslint-disable-next-line max-classes-per-file
const fs = require('fs/promises')
const multer = require('multer')

const conf = require('../../conf')

const getFileType = (() => {
  let ftmod = null

  import('file-type').then(mod => (ftmod = mod))

  return async file => {
    if (!ftmod) await null
    const result = await ftmod.fileTypeFromFile(file)

    return (
      result || {
        ext: null,
        mime: null,
      }
    )
  }
})()

const { MulterError } = multer

class NotAllowedFileMimeType extends MulterError {
  name = 'NotAllowedFileMimeType'
  // eslint-disable-next-line prettier/prettier
  message = `Not supported file type, the only allowed types are (${conf.ALLOWED_IMG_MIME_TYPES.join(', ')})`
}

const fileFilter = async (req, file, cb) => {
  if (conf.ALLOWED_IMG_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true)
  }

  cb(new NotAllowedFileMimeType())
}

const upload = multer({
  fileFilter,
  limits: { fileSize: conf.MAX_UPLOAD_FILE_SIZE },
  dest: conf.UPLOADS_FS_PATH,
})

class ReqFile {
  #submitted
  #exists
  #errors = []
  destination
  fileName
  path
  size
  buffer
  encoding
  mimetype
  fieldName
  originalname

  constructor({ file, err }) {
    this.#submitted = Boolean(file) || Boolean(err)
    this.#exists = Boolean(file) && !err

    if (err) {
      this.#errors.push(err)
      return
    }

    if (!file) return

    this.fieldName = file.fieldname
    this.fileName = file.filename
    ;[
      'originalname',
      'encoding',
      'mimetype',
      'size',
      'destination',
      'path',
      'buffer',
    ].forEach(attr => (this[attr] = file[attr]))
  }

  get valid() {
    return this.#errors.length === 0
  }

  get errors() {
    return [...this.#errors]
  }

  get exists() {
    return this.#exists
  }

  async setExtension(ext) {
    const newPath = `${this.path}.${ext}`

    await fs.rename(this.path, newPath)

    this.fileName = `${this.fileName}.${ext}`
    this.path = newPath
  }

  async delete() {
    if (!this.exists) return false

    await fs.unlink(this.path)
    this.path = null
    this.#exists = false

    return true
  }

  async invalidate(err, opt = { andDelete: true }) {
    this.#errors.push(err)
    if (!opt.andDelete) return

    return this.delete()
  }
}

const imageUploader = imgFieldName => {
  return (req, res, next) => {
    upload.single(imgFieldName)(req, res, async err => {
      req.file = new ReqFile({ file: req.file, err })

      if (req.file.exists) {
        const mimetype = await getFileType(req.file.path)

        if (!conf.ALLOWED_IMG_MIME_TYPES.includes(mimetype.mime))
          req.file.invalidate(new NotAllowedFileMimeType())
        else {
          req.file.mimetype = mimetype.mime
          await req.file.setExtension(mimetype.ext)
        }
      }

      return next(!(err instanceof MulterError) ? err : undefined)
    })
  }
}

async function deleteReqFileIfError(err, req, res, next) {
  if (req.file.exists) await req.file.delete()
  next(err)
}

module.exports = { imageUploader, UploadError: MulterError, deleteReqFileIfError }
