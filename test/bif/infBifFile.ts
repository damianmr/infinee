import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { BifIndex, getEntityEntry, getFilesIndex, getItem, getSpell } from '../../src/bif/infBifFile';
import { ItemDefinition } from '../../src/bif/item';
import { SpellDefinition } from '../../src/bif/spell';
import {
  CHITIN_DOT_KEY_FILENAME,
  findBifEntry,
  findResourceInfo,
  GameResourceIndex,
  getGameResourceIndex,
  ResourceTypeID
} from '../../src/infKey';
import { unpad } from '../../src/util/legacyFilenamePadding';
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

  describe('Parsing of a bif file', () => {
    let itemsIndex: BifIndex;
    let spellsIndex: BifIndex;

    before(async () => {
      const testItemsBif = findBifEntry(gameResourceIndex, 'items');
      const itemsBifBuffer = await readFileSync(join(MOCK_INSTALL, testItemsBif.fileName));
      itemsIndex = await getFilesIndex(itemsBifBuffer, 'items');

      const testSpellsBif = findBifEntry(gameResourceIndex, 'spells');
      const spellsBifBuffer = await readFileSync(join(MOCK_INSTALL, testSpellsBif.fileName));
      spellsIndex = await getFilesIndex(spellsBifBuffer, 'spells');
    });

    it('parsing a known item', async () => {
      const resourceInfo = findResourceInfo(gameResourceIndex, 'AROW10', ResourceTypeID.ITM);
      const bifEntityEntry = getEntityEntry({
        index: itemsIndex,
        locator: resourceInfo.locator,
        resourceType: ResourceTypeID.ITM
      });
      const item: ItemDefinition = await getItem(itemsIndex, bifEntityEntry.locator);
      expect(item.genericItemName).to.be.equal(6328);
      expect(item.lore).to.be.equal(30);
      expect(unpad(item.itemIcon)).to.be.equal('IAROW10');
    });

    it('parsing a known spell', async () => {
      const FREEDOM_SPELL = 'cdwi917a';
      const resourceInfo = findResourceInfo(gameResourceIndex, FREEDOM_SPELL, ResourceTypeID.SPL);
      const bifEntityEntry = getEntityEntry({
        index: spellsIndex,
        locator: resourceInfo.locator,
        resourceType: ResourceTypeID.SPL
      });
      const spell: SpellDefinition = await getSpell(spellsIndex, bifEntityEntry.locator);
      expect(spell.genericSpellName).to.be.equal(35553);
      expect(unpad(spell.spellIcon)).to.be.equal('SPWI917C');
    });

  });
});
