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
  esVersion: '8.2.2',
  port: 9000, // optional
  clusterName: 'test', // optional
  nodeName: 'test', // optional
  indexes: [
    {
      name: 'your-index',
      // create index with options - https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#indices-create-api-request-body
      body: {
        settings: {
          number_of_shards: '1',
          number_of_replicas: '1'
        },
        aliases: {
          'some-acc-id': {}
        },
        mappings: {
          "properties": {
            "field1" : {"type" : "text"}
        }
      }
    }
  ] // optional
});
```

### 2. Stop Elasticsearch

```js
import {stop} from '@shelf/elasticsearch-local';

stop();
```

## Publish

```sh
$ git checkout master
$ yarn version
$ yarn publish
$ git push origin master --tags
```

## License

MIT © [Shelf](https://shelf.io)
