import md5 from 'md5';
import * as tar from 'tar';
import * as fs from 'fs';
import logger from '../util/logger';

export const configureEvlFile = async (
  workingDir: string,
  bufferInput: Buffer,
  filename: string,
) => {
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
  const dateFromFilename = filename.split('_')[2].split('.')[0];
  const csvFilename = `${archiveNamePrefix + dateFromFilename}.csv`;
  const textFilename = `${textFilenamePrefix + dateFromFilename}.txt`;
  const archiveName = `${workingDir + archiveNamePrefix + dateFromFilename}.tar.gz`;

  try {
    const data = bufferInput.toString().split('\n');

    if (data.length === 1 && data[0] === '') {
      throw new Error('No data provided');
    }

    const numberOfRecords = data.length.toString();
    const headerLine = `${recordInfoHeader + description + dateFileCreation}, , `;
    const trailerLine = `${recordInfoTrailer + numberOfRecords} ${vrmsExtracted}, , `;

    data.splice(0, 0, headerLine);
    data.splice(data.length, 0, trailerLine);
    logger.info('Spliced data into the csv file');

    const csvData = data.join('\n');
    fs.writeFileSync(workingDir + csvFilename, csvData);
    logger.info('Written csv file');

    const md5sum = md5(csvData);
    const md5string = `MD5 (${csvFilename}) = ${md5sum}`;
    fs.writeFileSync(workingDir + textFilename, md5string);
    logger.info('Written txt checksum file');

    await tar.c({ gzip: true, file: archiveName, cwd: workingDir }, [
      textFilename,
      csvFilename,
    ]);
    logger.info('Written tar file');
    return archiveName;
  } catch (err) {
    logger.error('', err);
    logger.error('', 'Failed in file converting');
    throw err;
  }
};
