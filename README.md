# elasticsearch-local [![CircleCI](https://circleci.com/gh/shelfio/elasticsearch-local/tree/master.svg?style=svg)](https://circleci.com/gh/shelfio/elasticsearch-local/tree/master) ![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg) [![npm (scoped)](https://img.shields.io/npm/v/@shelf/elasticsearch-local.svg)](https://www.npmjs.com/package/@shelf/elasticsearch-local)

> Run any version of ElasticSearch locally

## Usage

### 0. Install

```
$ yarn add @shelf/elasticsearch-local --dev
```

### 1. Start Elasticsearch

```js
import {start} from '@shelf/elasticsearch-local';

await start({
  esVersion: '7.3.0',
  port: 9000, // optional
  clusterName: 'test', // optional
  nodeName: 'test', // optional
  indexes: ['one', 'two'] // optional
});
```

### 2. Stop Elasticsearch

```js
import {stop} from '@shelf/elasticsearch-local';

await stop();
```

## License

MIT © [Shelf](https://shelf.io)
