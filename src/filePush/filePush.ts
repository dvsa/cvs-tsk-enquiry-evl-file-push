import Client from 'ssh2-sftp-client';
import logger from '../util/logger';
import path from 'path';
import { getSecret } from '../util/getSecret';

export interface Config {
  host: string;
  username: string;
  retries: number;
  password?: string;
  privateKey?: string;
}

export const createConfig = async (eventType: string) => {
  let secretString: string;

  if (eventType === 'evl') {
    secretString = await getSecret(process.env.EVL_SFTP_CONFIG);
  } else if (eventType === 'tfl') {
    secretString = await getSecret(process.env.TFL_SFTP_CONFIG);
  } else {
    logger.error('', 'Unable to determine event type, please try again');
  }

  try {
    return JSON.parse(secretString) as Config;
  } catch (e) {
    logger.error('', e);
    throw e;
  }
};

export const filePush = async (filepath: string, eventType: string) => {
  const config = await createConfig(eventType);
  logger.info('Created config from secrets');
  logger.info(config);
  logger.info(config.host);
  const sftp = new Client();
  const sftpPath =
    eventType === 'evl' ? process.env.EVL_SFTP_PATH : process.env.TFL_SFTP_PATH;
  const remoteFileLocation = (sftpPath ?? '') + path.basename(filepath);

  try {
    await sftp.connect(config);
    logger.info('Spliced data into the csv file');
    await sftp.fastPut(filepath, remoteFileLocation);
    logger.info('Successfully uploaded to SFTP');
  } catch (err) {
    logger.error('', err);
    throw err;
  } finally {
    await sftp.end();
  }
};
