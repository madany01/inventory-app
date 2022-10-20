/* eslint-disable func-names */

const mongoose = require('mongoose')
const conf = require('../conf')

const { Schema } = mongoose

const DEFAULT_IMG_URL = `/static/imgs/blank-extension.png`

const extensionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  downloads: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
  },
})

extensionSchema.virtual('url').get(function () {
  return `/extensions/${this._id}`
})

extensionSchema.virtual('imgUrl').get(function () {
  if (!this.fileName) return DEFAULT_IMG_URL

  return `${conf.UPLOADS_URL}/${this.fileName}`
})

const Category = mongoose.model('Extension', extensionSchema)

module.exports = Category
