import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { BifIndex, getFilesIndex } from '../../src/bif/infBifFile';
import { CHITIN_DOT_KEY_FILENAME, findBifEntry, GameResourceIndex, getGameResourceIndex } from '../../src/infKey';
import { MOCK_INSTALL } from '../constants';

chai.use(chaiAsPromised);

const TEST_CHITIN_DOT_KEY_FILE: string = join(MOCK_INSTALL, CHITIN_DOT_KEY_FILENAME);

const BUFFER = readFileSync(TEST_CHITIN_DOT_KEY_FILE);

describe('infBifFile.ts', () => {
  let gameResourceIndex: GameResourceIndex;

  before(async () => {
    gameResourceIndex = await getGameResourceIndex(BUFFER);
  });

  describe('Testing basic parsing of bif file', () => {
    it('fails when given a file with a very short header (parsing will fail)', (done) => {
      const bogusBuffer = Buffer.from('Bogus Buffer');
      getFilesIndex(bogusBuffer, 'bogusIndex')
        .then(() => {
          // Should not happen
        })
        .catch((e: Error) => {
          expect(e.message.indexOf('read beyond the bounds')).to.be.gt(-1);
          done();
        });
    });

    it('fails when given a file is big enough but unrecognizable', (done) => {
      const bogusBuffer = Buffer.alloc(10000, 1);
      getFilesIndex(bogusBuffer, 'bogusIndex')
        .then(() => {
          // Should not happen
        })
        .catch((e) => {
          expect(e.message.indexOf('file signature')).to.be.gt(-1);
          done();
        });
    });

    it('fails on given an unrecognized version (just "V1  " supported)');
  });

  describe('Parsing of some known files', () => {
    let bifIndex: BifIndex;

    before(async () => {
      const knownBif = findBifEntry(gameResourceIndex, 'items');
      const knownBifPath = join(MOCK_INSTALL, knownBif.fileName);
      const bifBuffer = await readFileSync(knownBifPath);
      bifIndex = await getFilesIndex(bifBuffer, 'items');
    });

    it('parsing some known items');

    it('test 2');
  });
});
