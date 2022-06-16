import md5 from 'md5';
import tar from 'tar';
import * as fs from 'fs';
import * as zlib from 'zlib';
import logger from '../util/logger';

export const configureFile = async (bufferInput: Buffer) => {
  const recordInfoHeader = 'HEADER LINE: ';
  const description = 'EVL GVT TRANSFER FILE ';
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  const dateFileCreation = new Date()
    .toLocaleString('en-GB', options)
    .replace(/,/, '');
  const recordInfoTrailer = 'TRAILER LINE: ';
  const vrmsExtracted = 'RECORDS.';
  const textFilenamePrefix = 'crc32_';
  const archiveNamePrefix = 'EVL_GVT_';
  const formattedDate = new Date()
    .toLocaleDateString('en-GB')
    .split('/')
    .reverse()
    .join('');
  const zipCsvFilename = archiveNamePrefix + formattedDate + '.csv.gz';
  const textFilename = textFilenamePrefix + formattedDate + '.txt';
  const archiveName = archiveNamePrefix + formattedDate + '.tar.gz';

  try {
    const data = bufferInput.toString().split('\n');

    if (data.length == 1 && data[0] === '') {
      throw new Error('No data provided');
    }

    const numberOfRecords = data.length.toString();
    const headerLine =
      recordInfoHeader + description + dateFileCreation + ', , ';
    const trailerLine =
      recordInfoTrailer + numberOfRecords + ' ' + vrmsExtracted + ', , ';

    data.splice(0, 0, headerLine);
    data.splice(data.length, 0, trailerLine);
    logger.debug('Spliced data into the csv file');

    const zipData = zlib.gzipSync(data.join('\n'));
    fs.writeFileSync(zipCsvFilename, zipData);
    logger.debug('Written zipped csv file');

    const md5sum = md5(zipData);
    fs.writeFileSync(textFilename, md5sum);
    logger.debug('Written txt checksum file');

    await tar.c({ gzip: true, file: archiveName }, [
      textFilename,
      zipCsvFilename,
    ]);
    logger.debug('Written tar file');
    return archiveName;
  } catch (err) {
    logger.debug(err);
    logger.debug('Failed in file converting');
    throw err;
  }
};
