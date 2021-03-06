/* eslint-disable security/detect-non-literal-fs-filename */
import * as fs from 'fs';
import type { S3Event, S3EventRecord } from 'aws-lambda';
import { configureFile } from '../fileConvert/fileConvert';
import { filePull } from '../filePull/fromS3';
import { filePush } from '../filePush/filePush';
import { randomUUID } from 'crypto';
import logger from '../util/logger';

const handleEvent = async (record: S3EventRecord) => {
  const workingDir = `/tmp/${randomUUID()}/`;
  try {
    fs.mkdirSync(workingDir);
    const evlFileData = await filePull(record);
    const filepath = await configureFile(
      workingDir,
      evlFileData.data,
      evlFileData.filename,
    );
    await filePush(filepath);
  } finally {
    fs.rmSync(workingDir, { recursive: true, force: true });
  }
};

/**
 * Lambda Handler
 *
 * @param {S3Event} event
 * @returns {Promise<string>}
 */
export const handler = async (event: S3Event): Promise<string> => {
  logger.debug(`event: ${JSON.stringify(event, null, 2)}`);

  for (const record of event.Records) {
    try {
      await handleEvent(record);
    } catch (err) {
      logger.error('', err);
      return Promise.reject(
        `The file ${record.s3.object.key} errored during processing.`,
      );
    }
  }

  return Promise.resolve('All records processed successfully.');
};
