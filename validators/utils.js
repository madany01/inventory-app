const { validationResult } = require('express-validator')

function formateValidationErrors(errors) {
  return errors
    .array()
    .map(error => [error.param, error])
    .reduce((acc, [param, e]) => {
      if (!acc[param]) acc[param] = []
      acc[param].push(e)
      return acc
    }, {})
}

function summarize(fieldsNames) {
  return (req, res, next) => {
    const errors = validationResult(req)

    const valid = errors.isEmpty()
    const fieldsErrors = formateValidationErrors(errors)
    const fieldsValues = Object.fromEntries(
      fieldsNames.map(fieldName => [fieldName, req.body[fieldName]])
    )

    req.ctx.fields = { valid, errors: fieldsErrors, values: fieldsValues }

    next()
  }
}

module.exports = { summarize }
