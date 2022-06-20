import Client from 'ssh2-sftp-client';
import logger from '../util/logger';

export interface Config {
  host: string;
  username: string;
  retries: number;
  password?: string;
  privateKey?: string;
}

export const createConfig = () => {
  const config: Config = {
    host: process.env.SFTP_Address,
    username: process.env.SFTP_User,
    retries: 3,
  };

  if (process.env.SFTP_PrivateKey && process.env.SFTP_PrivateKey != '') {
    config.privateKey = process.env.SFTP_PrivateKey;
  } else if (process.env.SFTP_Password && process.env.SFTP_Password != '') {
    config.password = process.env.SFTP_Password;
  } else {
    logger.error(
      'No password or private key found, please check the env variables',
    );
    throw new Error(
      'No password or private key found, please check the env variables',
    );
  }

  return config;
};

export const filePush = async (filename: string) => {
  const config = createConfig();
  const sftp = new Client();
  const remoteFileLocation = process.env.SFTP_Path + filename;

  await sftp
    .connect(config)
    .then(() => sftp.fastPut(filename, remoteFileLocation))
    .then(() => {
      logger.info('Successfully uploaded to SFTP');
      return sftp.end();
    })
    .catch((err) => {
      logger.error('', err);
      throw err;
    });
};