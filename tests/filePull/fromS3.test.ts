/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectOutput, S3Client } from '@aws-sdk/client-s3';
import { filePull } from '../../src/filePull/fromS3';
import event from '../resources/s3event.json';
import logger from '../../src/util/logger';

describe('Test pull file from S3', () => {
  const errorLogSpy = jest.spyOn(logger, 'error');
  const debugLogSpy = jest.spyOn(logger, 'debug');

  test('should return file content', async () => {
    const getObjectOutput: GetObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content') as any,
    };
    mockClient(S3Client).resolvesOnce(getObjectOutput);

    const eventMock: S3Event = event as S3Event;
    const evlFileData = await filePull(eventMock.Records[0]);

    const expectedEvlFileData = {
      data: getObjectOutput.Body,
      filename: 'EVL_GVT_20220621.csv',
    };

    expect(evlFileData).toStrictEqual(expectedEvlFileData);
  });

  test('should catch, log and re-throw error', async () => {
    const mockError = new Error('Error pulling file from S3');
    mockClient(S3Client).rejectsOnce(mockError);

    const eventMock: S3Event = event as S3Event;

    await expect(filePull(eventMock.Records[0])).rejects.toThrow(mockError);

    expect(errorLogSpy.mock.calls[0][0]).toBe('');
    expect(errorLogSpy.mock.calls[1][0]).toBe('');
  });

  test('should clean response for logging', async () => {
    const getObjectOutput: GetObjectOutput = {
      AcceptRanges: 'bytes',
      LastModified: '2024-06-10T12:34:56.000Z',
      ContentLength: 12345,
      ETag: 'abc123def456',
      ContentType: 'application/pdf',
      Metadata: {
        customKey: 'customValue',
      },
      Body: Buffer.from('Mock file content'),
      $response: {
        httpResponse: {
          statusCode: 200,
          headers: {
            'content-type': 'application/pdf',
          },
        },
        requestId: 'EXAMPLE123456789',
      },
    } as unknown as GetObjectOutput;

    mockClient(S3Client).resolvesOnce(getObjectOutput);

    const eventMock: S3Event = event as S3Event;
    const evlFileData = await filePull(eventMock.Records[0]);

    const expectedEvlFileData = {
      data: Buffer.from('Mock file content'),
      filename: 'EVL_GVT_20220621.csv',
    };

    const expectedObject = {
      AcceptRanges: 'bytes',
      LastModified: '2024-06-10T12:34:56.000Z',
      ContentLength: 12345,
      ETag: 'abc123def456',
      ContentType: 'application/pdf',
      Metadata: { customKey: 'customValue' },
      Body: { redacted: true },
    };

    expect(evlFileData).toStrictEqual(expectedEvlFileData);
    expect(debugLogSpy).toHaveBeenCalledWith(`s3Object: ${JSON.stringify(expectedObject)}`);
  });
});
