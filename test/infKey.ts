import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import {
  CHITIN_DOT_KEY_FILENAME,
  getGameResourceIndex,
  IGameResourceIndex,
  IResourceInfo,
  ResourceTypeID
} from '../src/infKey';
import { MOCK_INSTALL } from './constants';

chai.use(chaiAsPromised);

const TEST_CHITIN_DOT_KEY_FILE: string = join(MOCK_INSTALL, CHITIN_DOT_KEY_FILENAME);

const BUFFER = readFileSync(TEST_CHITIN_DOT_KEY_FILE);

describe('infKey.ts', () => {

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
  
    it('file header is properly read', function(done) {
      this.slow(8000); // Threshold for the test to be considered "slow"
      this.timeout(10000); // Reading the whole file takes a while, we need more timeout than the default.
      getGameResourceIndex(BUFFER).then((gameResourceIndex: IGameResourceIndex) => {
        expect(gameResourceIndex.header.signature).to.be.equal('KEY ');
        expect(gameResourceIndex.header.version).to.be.equal('V1  ');
        done();
      });
    });
  });
  
  describe('Getting values from the index', () => {
    let gameResourceIndex: IGameResourceIndex;
  
    before(async () => {
      gameResourceIndex = await getGameResourceIndex(BUFFER);
    });
  
    it('got the expected number of resources', () => {
      // These values were extracted from Near Infinity using BaldursGate2:EE (no mods) data files.
      expect(gameResourceIndex.resources[ResourceTypeID.ITM].length).to.be.equal(2867);
      expect(gameResourceIndex.resources[ResourceTypeID.BAM].length).to.be.equal(17136);
      expect(gameResourceIndex.resources[ResourceTypeID.BMP].length).to.be.equal(2660);
      expect(gameResourceIndex.resources[ResourceTypeID.SPL].length).to.be.equal(1634);
      expect(gameResourceIndex.resources[ResourceTypeID.CRE].length).to.be.equal(4735);
      expect(gameResourceIndex.resources[ResourceTypeID.IDS].length).to.be.equal(72);
      expect(gameResourceIndex.resources[ResourceTypeID.TWO_DA].length).to.be.equal(611);
      expect(gameResourceIndex.resources[ResourceTypeID.BS]).to.be.undefined; // tslint:disable-line:no-unused-expression
    });
  
    it('got the expected resources', () => {
      // These values were extracted from Near Infinity using BaldursGate2:EE (no mods) data files.
      const resources: IResourceInfo[] = gameResourceIndex.resources[ResourceTypeID.IDS];
      expect(resources[0].name).to.be.equal('ACTION');
      expect(resources[1].name).to.be.equal('ACTSLEEP');
      expect(resources[2].name).to.be.equal('ALIGN');
      expect(resources[resources.length - 1].name).to.be.equal('xequip');
    });

  });
});
