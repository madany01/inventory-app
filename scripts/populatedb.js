const path = require('path')
const fs = require('fs/promises')
const yaml = require('yaml')

const mongoose = require('mongoose')

const { Category, Extension } = require('../models')
const conf = require('../conf')

const categoriesDoc = {}
const extensionsDoc = {}

async function deleteCategories() {
  console.log('deleting old categories ..')
  await Category.deleteMany({})
}

async function deleteExtensions() {
  console.log('deleting old extensions ..')
  await Extension.deleteMany({})
}

async function populateCategory(categoriesData) {
  console.log('creating new categories ..')
  const categories = await Category.create(categoriesData)
  categories.forEach(cat => (categoriesDoc[cat.name] = cat))
}

async function populateExtensions(extensionsData) {
  console.log('creating new extensions ..')

  const extensions = await Extension.create(
    extensionsData.map(ex => ({
      ...ex,
      category: categoriesDoc[ex.category],
    }))
  )

  extensions.map(ex => (extensionsDoc[ex.name] = ex))
}

async function deleteUploads() {
  const uploadsDir = conf.UPLOADS_FS_PATH
  const fileNames = await fs.readdir(uploadsDir)
  await Promise.all(
    fileNames.map(fileName => fs.unlink(path.join(uploadsDir, fileName)))
  )
}

async function copyImgsToUploadDir() {
  const uploadsDir = conf.UPLOADS_FS_PATH

  const imgsDir = path.join(__dirname, './images')

  const fileNames = await fs.readdir(imgsDir)

  await Promise.all(
    fileNames.map(f => fs.copyFile(path.join(imgsDir, f), path.join(uploadsDir, f)))
  )
}

async function main() {
  console.time('⌛ executionTime')

  const [data] = await Promise.all([
    yaml.parse((await fs.readFile(path.join(__dirname, './data.yaml'))).toString()),
    mongoose.connect(conf.MONGODB_URL, conf.MONGODB_OPTS),
    deleteUploads(),
    deleteExtensions(),
    deleteCategories(),
  ])

  await populateCategory(data.categories)

  await Promise.all([populateExtensions(data.extensions), copyImgsToUploadDir()])

  console.log('------ categories ------')
  Object.values(categoriesDoc).forEach(console.log)

  console.log('------ extensions ------')
  Object.values(extensionsDoc).forEach(console.log)

  await mongoose.connection.close()

  console.timeEnd('⌛ executionTime')
}

main()
