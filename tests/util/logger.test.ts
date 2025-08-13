/* eslint-disable import/first */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EOL } from 'os';

process.env.LOG_LEVEL = 'debug';
import logger from '../../src/util/logger';

describe('logger functions', () => {
  it('GIVEN a logger WHEN an info is logged THEN the console message is correct.', () => {
    // @ts-expect-error
    const consoleSpy = jest.spyOn(console._stdout, 'write');
    logger.info('I am an info message!');
    expect(consoleSpy).toHaveBeenCalledWith(
      `info: I am an info message!${EOL}`,
    );
  });

  it('GIVEN a logger WHEN a debug is logged THEN the console message is correct.', () => {
    // @ts-expect-error
    const consoleSpy = jest.spyOn(console._stdout, 'write');
    logger.debug('I am a debug message!');
    expect(consoleSpy).toHaveBeenCalledWith(
      `debug: I am a debug message!${EOL}`,
    );
  });

  it('GIVEN a logger WHEN an error is logged THEN the console message is correct.', () => {
    // @ts-expect-error
    const consoleSpy = jest.spyOn(console._stdout, 'write');
    const error = new Error('AN ERROR');
    logger.error('', error);
    expect(consoleSpy).toHaveBeenLastCalledWith(`error: ${error.stack}${EOL}`);
  });
});
