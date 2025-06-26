/* eslint-disable no-void */
import type { S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import event from '../resources/s3event.json';
import eventTwo from '../resources/s3eventTwo.json';
import { handler } from '../../src/handler/s3Event';
import * as filePush from '../../src/filePush/filePush';
import * as filePull from '../../src/filePull/fromS3';
import * as fileConvert from '../../src/fileConvert/fileConvert';
import logger from '../../src/util/logger';
import { EventLogging } from '../../src/util/EventLogging';

const mockConnect = jest.fn();
const mockFastPut = jest.fn();
const mockEnd = jest.fn();
const mockGetObjectCommand = jest.fn();

jest.mock('ssh2-sftp-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    fastPut: mockFastPut,
    end: mockEnd,
  })),
}));

describe('Test S3 Event Lambda Function', () => {
  const infoLogSpy = jest.spyOn(logger, 'info');

  afterEach(() => {
    jest.clearAllMocks();
    infoLogSpy.mockClear();
    delete process.env.EVL_SFTP_SEND;
    delete process.env.TFL_SFTP_SEND;
  });

  test('should handle EVL file push', async () => {
    jest.spyOn(filePush, 'createConfig').mockImplementationOnce(() => {
      const config = {
        host: 'testHost',
        username: 'testUser',
        retries: 3,
        password: 'testPassword',
      };
      return Promise.resolve(config);
    });

    jest.spyOn(filePull, 'filePull').mockImplementationOnce(() => {
      const fileData = {
        data: Buffer.from('mock file data'),
        filename: 'testFile.csv',
      };
      return Promise.resolve(fileData);
    });

    jest.spyOn(fileConvert, 'configureEvlFile').mockImplementationOnce(() => {
      const filepath = '/tmp/evl/testFile.csv';
      return Promise.resolve(filepath);
    });

    jest.mock('node:fs', () => ({
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
      rmSync: jest.fn(),
    }));

    const eventMock: S3Event = event as S3Event;
    eventMock.Records[0].s3.object.key = 'EVL_1234.csv';

    jest
      .spyOn(filePush, 'filePush')
      .mockImplementationOnce(() => Promise.resolve());

    process.env.EVL_SFTP_SEND = 'true';

    const res: string = await handler(eventMock);

    expect(res).toBe('All records processed successfully.');
    expect(infoLogSpy.mock.calls[0][0]).toBe(
      EventLogging.ENQ_FEED_FILE_PUSH_INIT,
    );
    expect(infoLogSpy.mock.calls[1][0]).toBe(
      EventLogging.ENQ_FEED_FILE_PUSH_SUCCESS,
    );
  });

  test('should return 204', async () => {
    jest.spyOn(filePush, 'createConfig').mockImplementation(() => {
      const config = {
        host: 'testHost',
        username: 'testUser',
        retries: 3,
        password: 'testPassword',
      };
      return Promise.resolve(config);
    });
    mockConnect.mockReturnValue(Promise.resolve(true));
    mockFastPut.mockReturnValue(Promise.resolve('uploaded'));
    mockEnd.mockReturnValue(Promise.resolve(void 0));
    const getObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content'),
    };
    mockClient(S3Client).resolves(getObjectOutput);
    const eventMock: S3Event = event as S3Event;

    const res: string = await handler(eventMock);

    expect(res).toBe('All records processed successfully.');
    expect(infoLogSpy.mock.calls[0][0]).toBe(
      EventLogging.ENQ_FEED_FILE_PUSH_INIT,
    );
  });

  test('should return 204 for TFL', async () => {
    jest.spyOn(filePush, 'createConfig').mockImplementation(() => {
      const config = {
        host: 'testHost',
        username: 'testUser',
        retries: 3,
        password: 'testPassword',
      };
      return Promise.resolve(config);
    });
    mockConnect.mockReturnValue(Promise.resolve(true));
    mockFastPut.mockReturnValue(Promise.resolve('uploaded'));
    mockEnd.mockReturnValue(Promise.resolve(void 0));
    const getObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content'),
    };
    mockClient(S3Client).resolves(getObjectOutput);
    const eventMock: S3Event = event as S3Event;
    eventMock.Records[0].s3.object.key = 'VOSA_1235.csv';
    process.env.TFL_SFTP_SEND = 'true';

    const res: string = await handler(eventMock);

    expect(res).toBe('All records processed successfully.');
  });

  test('should return 204 with multiple s3 events', async () => {
    jest.spyOn(filePush, 'createConfig').mockImplementation(() => {
      const config = {
        host: 'testHost',
        username: 'testUser',
        retries: 3,
        password: 'testPassword',
      };
      return Promise.resolve(config);
    });
    mockConnect.mockReturnValue(Promise.resolve(true));
    mockFastPut.mockReturnValue(Promise.resolve('uploaded'));
    mockEnd.mockReturnValue(Promise.resolve(void 0));
    const getObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content'),
    };
    mockClient(S3Client).resolves(getObjectOutput);
    const eventMock: S3Event = eventTwo as S3Event;

    const res: string = await handler(eventMock);

    expect(res).toBe('All records processed successfully.');
  });

  test('should return error message with multiple s3 events if one breaks', async () => {
    process.env.EVL_SFTP_SEND = 'true';
    jest.spyOn(filePush, 'createConfig').mockImplementation(() => {
      const config = {
        host: 'testHost',
        username: 'testUser',
        retries: 3,
        password: 'testPassword',
      };
      return Promise.reject(config);
    });
    mockConnect.mockReturnValue(Promise.resolve(true));
    mockFastPut.mockReturnValue(Promise.resolve('uploaded'));
    mockEnd.mockReturnValue(Promise.resolve(void 0));
    const getObjectOutput = {
      ContentType: 'text/csv',
      Body: Buffer.from('File content'),
    };
    const getObjectOutputBroken = {
      ContentType: 'text',
      Body: Buffer.from('File content'),
    };
    mockGetObjectCommand.mockResolvedValueOnce(getObjectOutput);
    mockGetObjectCommand.mockResolvedValueOnce(getObjectOutputBroken);
    const eventMock: S3Event = eventTwo as S3Event;

    await expect(handler(eventMock)).rejects.toBe(
      'The file EVL_GVT_20220621.csv errored during processing.',
    );
    expect(infoLogSpy.mock.calls[0][0]).toBe(
      EventLogging.ENQ_FEED_FILE_PUSH_INIT,
    );
    expect(infoLogSpy.mock.calls[6][0]).toBe(
      EventLogging.ENQ_FEED_FILE_PUSH_FAILURE,
    );
  });
});
