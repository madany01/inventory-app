/* eslint-disable func-names */
const mongoose = require('mongoose')

const { Schema } = mongoose

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
  },
})

categorySchema.virtual('url').get(function () {
  return `/categories/${this._id}`
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category
