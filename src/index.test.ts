import {execSync} from 'child_process';
import {start, stop} from '.';

it('should start ElasticSearch v7.3.0 locally', async () => {
  jest.setTimeout(10000);

  await start({esVersion: '7.3.0', port: 9000});

  const response = await execSync('curl -s -X GET "localhost:9000/?pretty"');

  expect(JSON.parse(response.toString())).toEqual({
    name: 'es-local',
    cluster_name: 'es-local',
    cluster_uuid: expect.any(String),
    version: {
      number: '7.3.0',
      build_flavor: 'default',
      build_type: 'tar',
      build_hash: expect.any(String),
      build_date: expect.any(String),
      build_snapshot: false,
      lucene_version: '8.1.0',
      minimum_wire_compatibility_version: '6.8.0',
      minimum_index_compatibility_version: '6.0.0-beta1'
    },
    tagline: 'You Know, for Search'
  });

  await stop();
});

it('should start ElasticSearch v6.8.2 locally', async () => {
  await start({esVersion: '6.8.2', port: 9100});

  const response = await execSync('curl -s -X GET "localhost:9100/?pretty"');

  expect(JSON.parse(response.toString())).toEqual({
    name: 'es-local',
    cluster_name: 'es-local',
    cluster_uuid: expect.any(String),
    version: {
      number: '6.8.2',
      build_flavor: 'default',
      build_type: 'tar',
      build_hash: expect.any(String),
      build_date: expect.any(String),
      build_snapshot: false,
      lucene_version: '7.7.0',
      minimum_wire_compatibility_version: '5.6.0',
      minimum_index_compatibility_version: '5.0.0'
    },
    tagline: 'You Know, for Search'
  });

  await stop();
});

it('should start ElasticSearch v5.6.16 locally', async () => {
  await start({esVersion: '5.6.16', port: 9200});

  const response = await execSync('curl -s -X GET "localhost:9200/?pretty"');

  expect(JSON.parse(response.toString())).toEqual({
    name: 'es-local',
    cluster_name: 'es-local',
    cluster_uuid: expect.any(String),
    version: {
      number: '5.6.16',
      build_hash: expect.any(String),
      build_date: expect.any(String),
      build_snapshot: false,
      lucene_version: '6.6.1'
    },
    tagline: 'You Know, for Search'
  });

  await stop();
});
