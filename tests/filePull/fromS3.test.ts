/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectOutput, S3Client } from '@aws-sdk/client-s3';
import { filePull } from '../../src/filePull/fromS3';
import event from '../resources/s3event.json';

describe('Test pull file from S3', () => {
  test('should return file content', async () => {
    const getObjectOutput: GetObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content') as any,
    };
    mockClient(S3Client).resolves(getObjectOutput);

    const eventMock: S3Event = event as S3Event;
    const evlFileData = await filePull(eventMock.Records[0]);

    const expectedEvlFileData = {
      data: getObjectOutput.Body,
      filename: 'EVL_GVT_20220621.csv',
    };

    expect(evlFileData).toStrictEqual(expectedEvlFileData);
  });
});
