import 'dotenv/config';
import type { S3Event, S3EventRecord } from 'aws-lambda';
import logger from '../util/logger';
import { filePull } from '../filePull/fromS3';
import { configureFile } from '../fileConvert/fileConvert';
import { filePush } from '../filePush/filePush';

/**
 * Lambda Handler
 *
 * @param {S3Event} event
 * @param {Context} context
 * @returns {Promise<Record<string, unknown>>}
 */
export const handler = async (
  event: S3Event,
): Promise<Record<string, unknown>> => {
  const record = event.Records[0];
  const evlFile = await filePull(record);
  logger.debug(`File contents ${evlFile.toString()}`);
  const filename = await configureFile(evlFile);
  logger.debug('Wrote out file');
  await filePush(filename);
  logger.debug('Uploaded file to SFTP');
  
  return Promise.resolve({
    statusCode: 200,
    body: `File contents ${evlFile.toString()}`,
  });
};
