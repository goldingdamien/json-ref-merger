const fs = require('fs-extra')

const JsonRefMerger = require('../index.js')
const merger = new JsonRefMerger({
  urlFormatter: formatReferenceUrl
})

test()

function formatReferenceUrl (url) {
  return './files/' + url.substr(2)
}

async function test () {
  const data = await merger.parseJsonFile('./files/json1.json')
  await fs.writeFile('./dist/output.json', JSON.stringify(data))
  console.log('complete')
}
