import 'dotenv/config';
import type { S3Event, S3EventRecord } from 'aws-lambda';
import logger from '../util/logger';
import { filePull } from '../filePull/fromS3';

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
  const bucketName = event.Records[0].s3.bucket.name;
  const record: S3EventRecord = event.Records[0];
  const evlFile: Buffer = await filePull(record);

  logger.debug(`File contents ${evlFile.toString()}`);

  return Promise.resolve({
    statusCode: 200,
    body: `Triggered with ${bucketName}`,
  });
};
