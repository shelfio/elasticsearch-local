import getDebug from 'debug';
import {execSync} from 'child_process';
import {promisify} from 'util';
import {platform} from 'os';
import execa from 'execa';
import yaml from 'js-yaml';
// @ts-ignore
import download from 'download-tarball';
import {access, constants, readFileSync, writeFileSync} from 'fs';
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
  body: Record<string, unknown>;
}

export async function start(options: StartESOptions): Promise<void> {
  const {
    esVersion,
    clusterName = 'es-local',
    nodeName = 'es-local',
    port = 9200,
    indexes = [],
  } = options;

  const esURL = `http://localhost:${port}/`;
  const isAfter7Version = getVersionFromString(esVersion) >= 7;

  if (isAfter7Version) {
    process.env.ES_JAVA_HOME = process.env.JAVA_HOME || '/usr'; // set up random path if correct not exist in file system to run bundled java
  }

  const filenameSuffix = isAfter7Version ? getVersionSuffix() : '';
  const esDownLoadURLPrefix = `https://artifacts.elastic.co/downloads/elasticsearch`;
  const esDownloadURL = `${esDownLoadURLPrefix}/elasticsearch-${esVersion}${filenameSuffix}.tar.gz`;
  const esBinaryFilepath = `${FILEPATH_PREFIX}/elasticsearch-${esVersion}/bin/elasticsearch`;
  const ymlConfigPath = `${FILEPATH_PREFIX}/elasticsearch-${esVersion}/config/elasticsearch.yml`;

  if (!esVersion) {
    throw new Error('Please provide ElasticSearch version to start it locally');
  }

  const versionAlreadyDownloaded = await isExistingFile(esBinaryFilepath);

  if (!versionAlreadyDownloaded) {
    await download({url: esDownloadURL, dir: FILEPATH_PREFIX});
    debug('Downloaded ES');
  } else {
    debug('ES already downloaded');
  }

  upsertYAMLConfig(ymlConfigPath);
  debug('Starting ES', esBinaryFilepath);

  const spawnedProcess = execa(
    esBinaryFilepath,
    [
      `-d`,
      `-p`,
      `${FILEPATH_PREFIX}/elasticsearch-${esVersion}/es-pid`,
      `-Ecluster.name=${clusterName}`,
      `-Enode.name=${nodeName}`,
      `-Ehttp.port=${port}`,
    ],
    {all: true}
  );
  spawnedProcess.all?.on('data', data => {
    debug(data.toString());
  });

  await spawnedProcess;
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
        if (error.type === 'resource_already_exists_exception') {
          debug(`Index ${name} already exists.`);
        } else {
          throw new Error(`Failed to create index: ${error.reason}`);
        }
      }
    })
  );
  debug(`Created ${indexes.length} indexes`);

  process.env.ES_URL = esURL;
  process.env.ES_VERSION = esVersion;
  process.env.ES_INDEXES_NAMES = JSON.stringify(indexes.map(({name}) => name));
}

export async function stop(): Promise<void> {
  const indexes = JSON.parse(process.env.ES_INDEXES_NAMES!).join(',');
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
  try {
    execSync(`pkill -F ${FILEPATH_PREFIX}/elasticsearch-${esVersion}/es-pid`);
  } catch (e) {
    debug(`Could not stop ES, killing all elasticsearch system wide`);
    execSync(`pkill -f Elasticsearch`);
  }
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
  type: string;
}

function getESError(esResponse: Buffer): ESError | undefined {
  return JSON.parse(esResponse.toString()).error;
}

function getVersionFromString(version: string): number {
  if (typeof version !== 'string') {
    throw new Error('Version should be type of a string');
  }

  let majorVersion = ``;

  for (const v of version) {
    if (isNaN(Number(v))) {
      return Number(majorVersion);
    }

    majorVersion += v;
  }

  return 7;
}

function getVersionSuffix() {
  switch (platform()) {
    case 'darwin': {
      return '-darwin-x86_64';
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on OS X or Linux');
    }
    default: {
      return '-linux-x86_64';
    }
  }
}

function upsertYAMLConfig(ymlConfigPath: string): void {
  const parsedYaml = yaml.load(readFileSync(ymlConfigPath).toString()) as Record<string, unknown>;

  writeFileSync(
    ymlConfigPath,
    yaml.dump({
      ...parsedYaml,
      xpack: {
        ml: {
          enabled: false,
        },
        monitoring: {
          collection: {
            enabled: false,
          },
        },
        watcher: {
          enabled: false,
        },
      },
      discovery: {
        type: 'single-node',
      },
    })
  );
}
