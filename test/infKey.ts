import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import {
  BifEntry,
  CHITIN_DOT_KEY_FILENAME,
  findBifEntry,
  findResourceInfo,
  GameResourceIndex,
  getGameResourceIndex,
  ResourceInfo,
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
      getGameResourceIndex(BUFFER).then((gameResourceIndex: GameResourceIndex) => {
        expect(gameResourceIndex.header.signature).to.be.equal('KEY ');
        expect(gameResourceIndex.header.version).to.be.equal('V1  ');
        done();
      });
    });
  });

  describe('Getting values from the index', () => {
    let gameResourceIndex: GameResourceIndex;

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
      const resources: ResourceInfo[] = gameResourceIndex.resources[ResourceTypeID.IDS];
      expect(resources[0].name).to.be.equal('ACTION');
      expect(resources[1].name).to.be.equal('ACTSLEEP');
      expect(resources[2].name).to.be.equal('ALIGN');
      expect(resources[resources.length - 1].name).to.be.equal('xequip');
    });

    it('indexes in resources correctly point to their BIF files (testing against some known values)', () => {
      const knownResources = [
        { name: 'AMUL01', file: 'data/Items.bif' },
        { name: 'DRAGBLUE', file: 'data/25Items.bif' },
        { name: '1amul07B', file: 'data/GUIIcon.bif' },
        { name: 'DIFFLEV', file: 'data/Default.bif' }
      ];
      const item1 = gameResourceIndex.resources[ResourceTypeID.IDS].find((value: ResourceInfo) => {
        return value.name === knownResources[3].name;
      });
      // console.log(gameResourceIndex.resources[ResourceTypeID.IDS]);
      // tslint:disable-next-line:no-unused-expression
      expect(item1).to.not.be.undefined;
      if (!item1) {
        throw new Error();
      }
      const bif: BifEntry = gameResourceIndex.bifResources[item1.bifKeyIndex];
      expect(bif.fileName).to.be.equal(knownResources[3].file);
    });

    describe('Testing #findResourceInfo', () => {
      it('should find a ResourceInfo using its name and type', () => {
        const resInfo: ResourceInfo = findResourceInfo(
          gameResourceIndex,
          'AMUL01',
          ResourceTypeID.ITM
        );
        expect(resInfo.name).to.be.equal('AMUL01');
        expect(resInfo.resourceType).to.be.equal(ResourceTypeID.ITM);
      });

      it('should throw if nothing is found', () => {
        expect(() => {
          findResourceInfo(gameResourceIndex, 'Hello', ResourceTypeID.ITM);
        }).to.throw(/not found/);
      });

      it('case does not affect the search', () => {
        const resInfo: ResourceInfo = findResourceInfo(
          gameResourceIndex,
          'aMuL01',
          ResourceTypeID.ITM
        );
        expect(resInfo.name).to.be.equal('AMUL01');
        expect(resInfo.resourceType).to.be.equal(ResourceTypeID.ITM);
      });
    });

    describe('Testing #findBifEntry', () => {
      it('it should find BIF file information based on its name', () => {
        const itemsEntry: BifEntry = findBifEntry(gameResourceIndex, 'items');
        expect(itemsEntry.fileName).to.be.equal('data/Items.bif');
      });

      it('it should throw if nothing is found', () => {
        expect(() => {
          const itemsEntry: BifEntry = findBifEntry(gameResourceIndex, 'hello');
        }).to.throw(/not found/);
      });

      it('is not affected by upper or lower case', () => {
        const itemsEntry: BifEntry = findBifEntry(gameResourceIndex, 'iTeMs');
        expect(itemsEntry.fileName).to.be.equal('data/Items.bif');
      });
    });

    // TODO: Here we should check that all the files present in the chitin.key file
    // are actually available to be read from the directory structure.
    // Probably this is not the best place to do this kind of test as is an integration test
    // between infKey.ts and directory.ts but I'm adding this empty test as a reminder.
    it('verifies that all files present in the index are currently available as files');
  });
});
