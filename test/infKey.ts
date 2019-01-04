import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { CHITIN_DOT_KEY_FILENAME, getGameResourceIndex, IGameResourceIndex } from '../src/infKey';
import { MOCK_INSTALL } from './constants';

chai.use(chaiAsPromised);

const TEST_CHITIN_DOT_KEY_FILE: string = join(MOCK_INSTALL, CHITIN_DOT_KEY_FILENAME);

const BUFFER = readFileSync(TEST_CHITIN_DOT_KEY_FILE);

describe('Testing basic parsing of chitin.key file', () => {

  it('fails when given a file with a very short header (parsing will fail)', (done) => {
    const bogusBuffer = Buffer.from('Bogus Buffer');
    getGameResourceIndex(bogusBuffer)
      .then(() => {
        // Should not happen
      })
      .catch((e: Error) => {
        expect(e.message.indexOf('read beyond the bounds')).to.be.gt(-1);
        done();
      });
  });

  it('fails when given a file is big enough but unrecognizable', (done) => {
    const bogusBuffer = Buffer.alloc(1000, 1);
    getGameResourceIndex(bogusBuffer)
      .then(() => {
        // Should not happen
      })
      .catch((e) => {
        expect(e.message.indexOf('file signature')).to.be.gt(-1);
        done();
      });
  });

  it('file header is properly read', function (done) {
    this.slow(8000); // Threshold for the test to be considered "slow"
    this.timeout(10000); // Reading the whole file takes a while, we need more timeout than the default.
    getGameResourceIndex(BUFFER).then((gameResourceIndex: IGameResourceIndex) => {
      expect(gameResourceIndex.header.signature).to.be.equal('KEY ');
      expect(gameResourceIndex.header.version).to.be.equal('V1  ');
      done();
    });
  });
});
