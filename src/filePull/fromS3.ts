/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-syntax */
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import { Stream } from 'stream';
import { IncomingMessage } from 'http';
import logger from '../util/logger';

const s3Client = new S3Client(
  (process.env.IS_LOCAL || process.env.IS_OFFLINE) && {
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER',
    },
    endpoint: 'http://localhost:4569',
  },
);

export const filePull = async (record: S3EventRecord) => {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const s3Object: GetObjectCommandOutput = await s3Client.send(
      new GetObjectCommand(params),
    );

    const chunks: Buffer[] = [];
    for await (const chunk of Stream.Readable.from(
      s3Object.Body as IncomingMessage,
    )) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    logger.debug(`s3Object: ${JSON.stringify(cleanForLogging(s3Object))}`);

    logger.info(`${key} pulled successfully.`);

    return {
      data: buffer,
      filename: key,
    };
  } catch (err) {
    logger.error('', err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    logger.error('', message);

    throw err;
  }
};

const cleanForLogging = (input) => {
  const retVal = { ...input };
  retVal.Body = { redacted: true };
  if (retVal.$response) {
    delete retVal.$response;
  }
  return retVal;
};
