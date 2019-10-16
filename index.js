const traverse = require('traverse')

const fs = require('fs-extra')
const path = require('path')

class JsonRefMerger {
  constructor (options = {}) {
    this.constants = {
      JSON_EXTENSIONS: ['json', 'jsonld']
    }
    this.urlFormatter = (_) => {
      return _
    }

    if (options.urlFormatter) {
      this.urlFormatter = options.urlFormatter
    }
  }

  /**
   * @public
   * @param {String} url
   */
  async parseJsonFile (url) {
    const object = await this.getJsonFile(url)
    return this.parseJsonObject(object)
  }

  /**
   * @public
   * @param {Object} object
   */
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

  /**
   * @private
   * @param {String} url
   */
  async getJsonFile (url) {
    const absoluteUrl = path.resolve(url)
    const data = await fs.readFile(absoluteUrl, {encoding: 'utf-8'})
    const json = JSON.parse(data)

    return json
  }

  /**
   * @private
   * @param {String} targetUrl
   * @return {Object} {data: data, type: 'json' OR 'text', url: url, section: array of path keys to get data}
   */
  async getFileInfo (targetUrl) {
    const {url, section} = this.splitUrlIntoParts(targetUrl)
    const absoluteUrl = path.resolve(url)
    const data = await fs.readFile(absoluteUrl, {encoding: 'utf-8'})
    const isJson = this.constants.JSON_EXTENSIONS.includes(url.substr(url.lastIndexOf('.') + 1))
    const type = isJson ? 'json' : 'text'
    return {
      url: url,
      section: section,
      data: data,
      type: type
    }
  }

  /**
   * @private
   * @param {String} targetUrl
   * @return {Object} {url: String, section: Array}
   */
  splitUrlIntoParts (targetUrl) {
    const parts = targetUrl.split('#')
    return {
      url: parts[0],
      section: parts.slice(1)
    }
  }

  /**
   * @private
   * @param {Object} object
   * @param {Array} keys
   * @return {*}
   */
  getObjectDataAtPath (object, keys = []) {
    let cur = object
    keys.forEach(key => {
      cur = cur[key]
    })
    return cur
  }

  /**
   * @private
   * @param {String} url
   * @param {Object} node
   * @param {String} key
   */
  async parseAndSetReference (url, node, key) {
    const fileInfo = await this.getFileInfo(url)
    if (fileInfo.type === 'json') {
      const json = JSON.parse(fileInfo.data)
      const object = await this.parseJsonObject(json)
      node[key] = this.getObjectDataAtPath(object, fileInfo.section)
    } else { // text
      node[key] = fileInfo.data
    }
  }

  /**
   * @private
   * @param {Object} object
   * @return {Boolean}
   */
  isReferenceObject (object) {
    return (!!object && typeof object === 'object' && object.$ref)
  }
}

module.exports = JsonRefMerger
