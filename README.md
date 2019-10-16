# Description

Library for merging JSON files by looking at reference inside JSON data.
In order to reference another JSON file, add an object with a single key "$ref" pointing to the url of the JSON file.

## Usage

```javascript
const JsonRefMerger = require('json-ref-merger')
const merger = new JsonRefMerger({
    urlFormatter: (url) => {return url}
}
merger.parseJsonFile('my-json.json').then(console.log)
```

## Data

See ./example/files for example data.