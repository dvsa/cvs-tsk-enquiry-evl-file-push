import type { S3Event } from 'aws-lambda';
import { handler } from '../../src/handler/s3Event';
import event from '../resources/s3event.json';

describe('Test S3 Event Lambda Function', () => {
  test('should return 200 with a success message', async () => {
    const eventMock: S3Event = event as S3Event;

    const res: Record<string, unknown> = await handler(eventMock);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual('Triggered with s3-lambda-testing-7654');
  });
});
