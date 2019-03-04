import { encode as encodeBMP } from 'bmp-js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync, writeFile, writeFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { BamV1Header, BamV1Image, BamV1ImageLocator, getLastProcessedFrameDebugInfo} from '../../src/bif/bam';
import {
  BifIndex,
  getBam,
  getBamImage,
  getEntityEntry,
  getFilesIndex,
  getItem,
  getSpell
} from '../../src/bif/infBifFile';
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
    let bamsIndex: BifIndex;

    before(async () => {
      const testItemsBif = findBifEntry(gameResourceIndex, 'items');
      const itemsBifBuffer = await readFileSync(join(MOCK_INSTALL, testItemsBif.fileName));
      itemsIndex = await getFilesIndex(itemsBifBuffer, 'items');

      const testSpellsBif = findBifEntry(gameResourceIndex, 'spells');
      const spellsBifBuffer = await readFileSync(join(MOCK_INSTALL, testSpellsBif.fileName));
      spellsIndex = await getFilesIndex(spellsBifBuffer, 'spells');

      const testBamsBif = findBifEntry(gameResourceIndex, '25guibam');
      const bamsBifBuffer = await readFileSync(join(MOCK_INSTALL, testBamsBif.fileName));
      bamsIndex = await getFilesIndex(bamsBifBuffer, '25guibams');
    });

    it('parsing a known item', async () => {
      const resourceInfo = findResourceInfo(gameResourceIndex, 'AROW10', ResourceTypeID.ITM);
      const bifEntityEntry = getEntityEntry({
        index: itemsIndex,
        resourceInfo
      });
      const item: ItemDefinition = await getItem(itemsIndex, resourceInfo);
      expect(item.genericItemName).to.be.equal(6328);
      expect(item.lore).to.be.equal(30);
      expect(unpad(item.itemIcon)).to.be.equal('IAROW10');
    });

    it('returned items do not have NULL terminated strings', async () => {
      const resourceInfo = findResourceInfo(gameResourceIndex, 'AROW10', ResourceTypeID.ITM);
      const bifEntityEntry = getEntityEntry({
        index: itemsIndex,
        resourceInfo
      });
      const item: ItemDefinition = await getItem(itemsIndex, resourceInfo);
      expect(item.carrieddIcon.indexOf('\u0000')).to.be.equal(-1);
      expect(item.itemIcon.indexOf('\u0000')).to.be.equal(-1);
      expect(item.usedUpItem.indexOf('\u0000')).to.be.equal(-1);
      expect(item.groundIcon.indexOf('\u0000')).to.be.equal(-1);
    });

    it('parsing a known spell', async () => {
      const FREEDOM_SPELL = 'cdwi917a';
      const resourceInfo = findResourceInfo(gameResourceIndex, FREEDOM_SPELL, ResourceTypeID.SPL);
      const bifEntityEntry = getEntityEntry({
        index: spellsIndex,
        resourceInfo
      });
      const spell: SpellDefinition = await getSpell(spellsIndex, resourceInfo);
      expect(spell.genericSpellName).to.be.equal(35553);
      expect(unpad(spell.spellIcon)).to.be.equal('SPWI917C');
    });

    it('returned spells do not have NULL terminated strings', async () => {
      const FREEDOM_SPELL = 'cdwi917a';
      const resourceInfo = findResourceInfo(gameResourceIndex, FREEDOM_SPELL, ResourceTypeID.SPL);
      const bifEntityEntry = getEntityEntry({
        index: spellsIndex,
        resourceInfo
      });
      const spell: SpellDefinition = await getSpell(spellsIndex, resourceInfo);
      expect(spell.spellIcon.indexOf('\u0000')).to.be.equal(-1);
    });

    describe('Parsing data for BAM files', () => {
      it('header of a given BAM file (v1, uncompressed) is properly parsed', async () => {
        const TEST_BAM = 'iplot01f';
        const resourceInfo = findResourceInfo(gameResourceIndex, TEST_BAM, ResourceTypeID.BAM);
        const bifEntity = getEntityEntry({
          index: bamsIndex,
          resourceInfo
        });
        const imageLocator: BamV1ImageLocator = await getBam(bamsIndex, resourceInfo);
        const bamHeader: BamV1Header = imageLocator.header;
        expect(bamHeader.signature).to.be.equal('BAM ');
        expect(bamHeader.version).to.be.equal('V1  ');

        // These values were taken from NearInfinity
        expect(bamHeader.cycleCount).to.be.equal(2);
        expect(bamHeader.frameCount).to.be.equal(2);

        // All of these values were fine tuned. I assumed they were true,
        // and then ran some manual tests with the rendering so I could be sure
        // they were accurate. I am putting them here in case I break
        // anything in the future, the values reported by the parsing code
        // will be different in such a case.
        expect(bamHeader.transparentIndex).to.be.equal(0);
        expect(bamHeader.framesOffset).to.be.equal(24);
        expect(bamHeader.paletteOffset).to.be.equal(56);
        expect(bamHeader.frameLookUpTableOffset).to.be.equal(1080);
      });

      it('creates the color palette of a given BAM resource properly', async () => {
        const TEST_BAM = 'iplot01f';
        const resourceInfo = findResourceInfo(gameResourceIndex, TEST_BAM, ResourceTypeID.BAM);
        const bifEntity = getEntityEntry({
          index: bamsIndex,
          resourceInfo
        });

        const imageLocator: BamV1ImageLocator = await getBam(bamsIndex, resourceInfo);
        const image: BamV1Image = await getBamImage(imageLocator);

        expect(image.palette.length).to.be.eql(256);

        // These values were hand-picked from NearInfinity.
        expect(image.palette[0]).to.be.eql(0x00ff00);
        expect(image.palette[7]).to.be.eql(0x9c9494);
        expect(image.palette[15]).to.be.eql(0x847b73);
        expect(image.palette[31]).to.be.eql(0x6b5231);
        expect(image.palette[63]).to.be.eql(0xe7bd6b);
        expect(image.palette[127]).to.be.eql(0xb59442);
        expect(image.palette[255]).to.be.eql(0x000000);
      });

      it('creates frame header data properly', async () => {
        const TEST_BAM = 'iplot01f';
        const resourceInfo = findResourceInfo(gameResourceIndex, TEST_BAM, ResourceTypeID.BAM);
        const bifEntity = getEntityEntry({
          index: bamsIndex,
          resourceInfo
        });

        const imageLocator: BamV1ImageLocator = await getBam(bamsIndex, resourceInfo);
        const image1: BamV1Image = await getBamImage(imageLocator, {
          bitmapMode: 'RGBA',
          frame: 0
        });
        const image2: BamV1Image = await getBamImage(imageLocator, {
          bitmapMode: 'RGBA',
          frame: 1
        });

        // Values from NearInfinity
        expect(image1.frame.centerX).to.be.equal(9);
        expect(image1.frame.centerY).to.be.equal(15);
        expect(image1.frame.width).to.be.equal(19);
        expect(image1.frame.height).to.be.equal(31);

        expect(image2.frame.centerX).to.be.equal(14);
        expect(image2.frame.centerY).to.be.equal(28);
        expect(image2.frame.width).to.be.equal(33);
        expect(image2.frame.height).to.be.equal(56);
      });

      it('can create bitmaps out of a BAM file (uncompressed)', async () => {
        const TEST_BAM = 'iplot01f';
        const resourceInfo = findResourceInfo(gameResourceIndex, TEST_BAM, ResourceTypeID.BAM);
        const bifEntity = getEntityEntry({
          index: bamsIndex,
          resourceInfo
        });

        const imageLocator: BamV1ImageLocator = await getBam(bamsIndex, resourceInfo);
        const frameImage: BamV1Image = await getBamImage(imageLocator, {
          bitmapMode: 'ABGR',
          frame: 0
        });

        const bmpRaw = encodeBMP(frameImage.image);

        // const debugInfo = JSON.stringify(getLastProcessedFrameDebugInfo(), null, '\t');
        // writeFileSync('./debug.json', debugInfo);
        writeFileSync(`./test/output/${TEST_BAM}.bmp`, bmpRaw.data);
      });

      it.only('can create bitmaps out of a BAM file (compressed)', async () => {
        const TEST_BAM = 'iplat20';
        const resourceInfo = findResourceInfo(gameResourceIndex, TEST_BAM, ResourceTypeID.BAM);
        const bifEntity = getEntityEntry({
          index: bamsIndex,
          resourceInfo
        });

        const imageLocator: BamV1ImageLocator = await getBam(bamsIndex, resourceInfo);
        const frameImage: BamV1Image = await getBamImage(imageLocator, {
          bitmapMode: 'ABGR',
          frame: 0
        });

        const bmpRaw = encodeBMP(frameImage.image);

        // const debugInfo = JSON.stringify(getLastProcessedFrameDebugInfo(), null, '\t');
        // writeFileSync('./debug.json', debugInfo);
        writeFileSync(`./test/output/${TEST_BAM}.bmp`, bmpRaw.data);
      });

    });
  });
});
