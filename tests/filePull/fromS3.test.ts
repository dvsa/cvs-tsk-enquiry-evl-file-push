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

  test('should return error if body not a Buffer', async () => {
    const getObjectOutput: GetObjectOutput = {
      ContentType: 'text/csv',
      ETag: 'c4c7b60167b533a5eae07b5ce38d7368',
      Body: 'File content' as any,
    };
    mockClient(S3Client).resolves(getObjectOutput);

    const eventMock: S3Event = event as S3Event;

    await expect(async () => {
      await filePull(eventMock.Records[0]);
    }).rejects.toThrow(
      'Body of object with ETag c4c7b60167b533a5eae07b5ce38d7368 is not a Buffer.',
    );
  });
});
