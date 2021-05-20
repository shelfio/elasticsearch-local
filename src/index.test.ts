import {execSync} from 'child_process';
import {start, stop} from '.';

it('should start ElasticSearch v7.6.0 locally', async () => {
  jest.setTimeout(80000);

  await start({esVersion: '7.6.0', port: 9000});
  const response = await execSync('curl -s -X GET "localhost:9000/?pretty"');

  expect(JSON.parse(response.toString())).toEqual({
    name: 'es-local',
    cluster_name: 'es-local',
    cluster_uuid: expect.any(String),
    version: {
      number: '7.6.0',
      build_flavor: 'default',
      build_type: 'tar',
      build_hash: expect.any(String),
      build_date: expect.any(String),
      build_snapshot: false,
      lucene_version: '8.4.0',
      minimum_wire_compatibility_version: '6.8.0',
      minimum_index_compatibility_version: '6.0.0-beta1',
    },
    tagline: 'You Know, for Search',
  });

  await stop();
});
