const mockS3 = {
  getObject: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockConnect = jest.fn();
const mockFastPut = jest.fn();
const mockEnd = jest.fn();

jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mockS3) };
});

jest.mock('ssh2-sftp-client', () => {
  return { 
    __esModule: true,
    default: jest.fn().mockImplementation(() =>{
      return { 
        connect: mockConnect,
        fastPut: mockFastPut,
        end: mockEnd,
      };
    }),
  };
});

import event from '../resources/s3event.json';
import type { S3Event } from 'aws-lambda';
import { GetObjectOutput } from 'aws-sdk/clients/s3';
import { handler } from '../../src/handler/s3Event';

describe('Test S3 Event Lambda Function', () => {
  test('should return 200 with the file content', async () => {
    mockConnect.mockReturnValue(Promise.resolve(true));
    mockFastPut.mockReturnValue(Promise.resolve('uploaded'));
    mockEnd.mockReturnValue(Promise.resolve(void 0));
    const getObjectOutput: GetObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content'),
    };
    mockS3.promise.mockResolvedValueOnce(getObjectOutput);
    const eventMock: S3Event = event as S3Event;

    const res: Record<string, unknown> = await handler(eventMock);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual('File contents File content');
  });
});
