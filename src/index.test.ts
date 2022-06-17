jest.setTimeout(10 * 60 * 1000);

import {execSync} from 'child_process';
import {start, stop} from '.';

it('should start ElasticSearch v8x locally', async () => {
  await start({esVersion: '8.2.2', port: 9230});
  const response = await execSync('curl -s -X GET "localhost:9230/?pretty"');
  stop();

  expect(JSON.parse(response.toString())).toEqual({
    name: 'es-local',
    cluster_name: 'es-local',
    cluster_uuid: expect.any(String),
    version: {
      number: '8.2.2',
      build_flavor: 'default',
      build_type: 'tar',
      build_hash: expect.any(String),
      build_date: expect.any(String),
      build_snapshot: false,
      lucene_version: '9.1.0',
      minimum_index_compatibility_version: '7.0.0',
      minimum_wire_compatibility_version: '7.17.0',
    },
    tagline: 'You Know, for Search',
  });
});
