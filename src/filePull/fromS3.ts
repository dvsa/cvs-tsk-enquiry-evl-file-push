import {
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import logger from '../util/logger';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  },
  endpoint:
    process.env.IS_LOCAL || process.env.IS_OFFLINE
      ? 'http://localhost:4569'
      : undefined,
});

export const filePull = async (record: S3EventRecord) => {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const response: GetObjectCommandOutput = await s3Client.send(command);

    logger.debug(`s3Object: ${JSON.stringify(response, null, 2)}`);
    if (!Buffer.isBuffer(response.Body)) {
      throw new Error(
        `Body of object with ETag ${response.ETag} is not a Buffer.`,
      );
    }

    logger.info(`${key} pulled successfully.`);

    return {
      data: response.Body,
      filename: key,
    };
  } catch (err) {
    logger.error('', err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    logger.error('', message);

    throw err;
  }
};
