import getDebug from 'debug';
import {execSync} from 'child_process';
import {promisify} from 'util';
import download from 'download-tarball';
import {access, constants} from 'fs';
import cwd from 'cwd';

const debug = getDebug('elasticsearch-local');
const FILEPATH_PREFIX = `${cwd()}/node_modules/.cache/@shelf/elasticsearch-local`;

interface StartESOptions {
  // Choose ES proper version at https://www.elastic.co/downloads/past-releases#elasticsearch
  esVersion: string;
  clusterName?: string;
  nodeName?: string;
  port?: number;
  indexes?: ESIndex[];
}

interface ESIndex {
  name: string;
  // Body, which will be sent ot create index, see https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#indices-create-index
  body: object;
}

export async function start(options: StartESOptions): Promise<void> {
  const {
    esVersion,
    clusterName = 'es-local',
    nodeName = 'es-local',
    port = 9200,
    indexes = []
  } = options;
  const esURL = `http://localhost:${port}/`;
  const isAfter7Version = esVersion[0] === '7';
  const after7VersionSuffix = '-linux-x86_64';
  const filenameSuffix = isAfter7Version ? after7VersionSuffix : '';
  const esDownLoadURLPrefix = `https://artifacts.elastic.co/downloads/elasticsearch`;
  const esDownloadURL = `${esDownLoadURLPrefix}/elasticsearch-${esVersion}${filenameSuffix}.tar.gz`;
  const esBinaryFilepath = `${FILEPATH_PREFIX}/elasticsearch-${esVersion}/bin/elasticsearch`;

  if (!esVersion) {
    throw new Error('Please provide ElasticSearch version to start it locally');
  }

  if (!(await isExistingFile(esBinaryFilepath))) {
    await download({url: esDownloadURL, dir: FILEPATH_PREFIX});
    debug('Downloaded ES');
  } else {
    debug('ES already downloaded');
  }

  debug('Starting ES');

  await execSync(
    `${esBinaryFilepath} -d -p ${FILEPATH_PREFIX}/elasticsearch-${esVersion}/es-pid -Ecluster.name=${clusterName} -Enode.name=${nodeName} -Ehttp.port=${port}`
  );
  debug('ES is running');

  await Promise.all(
    indexes.map(async ({name, body}) => {
      const result = execSync(
        `curl -X PUT "${esURL}${name}" -H 'Content-Type: application/json' -s -d '${JSON.stringify(
          body
        )}'`
      );

      const error = getESError(result);

      if (error) {
        throw new Error(`Failed to create index: ${error.reason}`);
      }
    })
  );
  debug(`Created ${indexes.length} indexes`);

  process.env.ES_URL = esURL;
  process.env.ES_VERSION = esVersion;
  process.env.ES_INDEXES_NAMES = JSON.stringify(indexes.map(({name}) => name));
}

export async function stop(): Promise<void> {
  const indexes = JSON.parse(process.env.ES_INDEXES_NAMES).join(',');
  const esURL = process.env.ES_URL;
  const esVersion = process.env.ES_VERSION;

  if (indexes) {
    const result = await execSync(`curl -XDELETE ${esURL}${indexes} -s`);

    const error = getESError(result);

    if (error) {
      throw new Error(`Failed to remove index: ${error.reason}`);
    }

    debug('Removed all indexes');
  }

  await execSync(`pkill -F ${FILEPATH_PREFIX}/elasticsearch-${esVersion}/es-pid`);
  debug('ES has been stopped');
}

async function isExistingFile(filepath: string): Promise<boolean> {
  const fsAccessPromisified = promisify(access);

  try {
    await fsAccessPromisified(filepath, constants.F_OK);

    return true;
  } catch (e) {
    return false;
  }
}

interface ESError {
  reason: string;
}

function getESError(esResponse: Buffer): ESError | undefined {
  return JSON.parse(esResponse.toString()).error;
}
