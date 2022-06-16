import { configureFile } from '../../src/fileConvert/fileConvert';
import * as fs from 'fs';
import * as zlib from 'zlib';
import md5 from 'md5';

describe('test the file config', () => {
  const formattedDate = new Date()
    .toLocaleDateString('en-GB')
    .split('/')
    .reverse()
    .join('');
  const txtFilename = 'crc32_' + formattedDate + '.txt';
  const zipCsvFilename = 'EVL_GVT_' + formattedDate + '.csv.gz';
  const finalFilename = 'EVL_GVT_' + formattedDate + '.tar.gz';
  const testFilename = 'tests/resources/EVL_GVT_TESTFILE.csv';
  let buffer: Buffer;

  afterEach(() => {
    fs.unlinkSync(finalFilename);
    fs.unlinkSync(zipCsvFilename);
    fs.unlinkSync(txtFilename);
  });

  beforeAll(() => {
    buffer = fs.readFileSync(testFilename);
  });

  test('expect filename to be correct', async () => {
    await configureFile(buffer);
    const fileList = fs.readdirSync('./');
    expect(fileList).toContain(finalFilename);
  });

  test('expect csv filename to be correct', async () => {
    await configureFile(buffer);
    const fileList = fs.readdirSync('./');
    expect(fileList).toContain(zipCsvFilename);
  });

  test('expect txt filename to be correct', async () => {
    await configureFile(buffer);
    const fileList = fs.readdirSync('./');
    expect(fileList).toContain(txtFilename);
  });

  test('expect csv to include the header and footer', async () => {
    await configureFile(buffer);
    const zipCsvFile = fs.readFileSync(zipCsvFilename);
    const csvFile = zlib.gunzipSync(zipCsvFile);
    const csvData = csvFile.toString();
    expect(csvData).toContain('HEADER LINE: EVL GVT TRANSFER FILE');
    expect(csvData).toContain('TRAILER LINE: 2 RECORDS.');
  });

  test('expect hash to match', async () => {
    await configureFile(buffer);
    const csvFile = fs.readFileSync(zipCsvFilename);
    const textFile = fs.readFileSync(txtFilename);
    const hash = md5(csvFile);
    expect(textFile.toString()).toBe(hash);
  });
});


describe('test the file config failure condition', () => {
  test('no data provided throws an error', async () => {
    await expect(configureFile(Buffer.from(''))).rejects.toThrow('No data provided');
  });
});
