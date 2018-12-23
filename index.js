const traverse = require('traverse')

const fs = require('fs-extra')
const path = require('path')

class JsonRefMerger {
  constructor (options = {}) {
    this.urlFormatter = (_) => {
      return _
    }

    if (options.urlFormatter) {
      this.urlFormatter = options.urlFormatter
    }
  }

  async parseJsonFile (url) {
    const object = await this.getJsonFile(url)
    return this.parseJsonObject(object)
  }

  async parseJsonObject (object) {
    const promises = []
    const self = this
    traverse(object).forEach(function (value) {
      if (self.isReferenceObject(value)) {
        const key = this.key
        const parent = this.parent.node
        const url = self.urlFormatter(value.$ref)
        const promise = self.parseAndSetReference(url, parent, key)
        promises.push(promise)
      }
    })

    await Promise.all(promises)
    return object
  }

  async getJsonFile (url) {
    const absoluteUrl = path.resolve(url)
    const data = await fs.readFile(absoluteUrl)
    const json = JSON.parse(data)

    return json
  }

  async parseAndSetReference (url, node, key) {
    const object = await this.parseJsonFile(url)
    node[key] = object
  }

  isReferenceObject (object) {
    return (!!object && typeof object === 'object' && object.$ref)
  }
}

module.exports = JsonRefMerger
