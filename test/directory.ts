import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { emit } from 'cluster';
import 'mocha';
import {
  buildDirectoryStructure,
  FlatDirectoryStructureAsEntries,
  GameFilesMatcher,
  readDirContents
} from '../src/directory';
import { DirectoryEntryMock, DirectoryReaderMock, EntryMock } from './mocks/fileSystem';
import { buildDirEntry, buildFileEntry, mockDirStruct } from './mocks/fileSystemUtil';

chai.use(chaiAsPromised);

const BG2EE_ROOT = buildDirEntry("Baldur's Gate II Enhanced Edition (Mock)");

const Pepe = {
  // BG2EE: [buildRoute(BG2EE_ROOT, 'BaldursGateIIEnhancedEdition.app')]
};

const MatcherTargets = {
  BG2EE: [
    // ============== Root Folder
    buildDirEntry('BaldursGateIIEnhancedEdition.app'),
    buildFileEntry('chitin.key'),
    buildDirEntry('data'),
    buildFileEntry('engine.lua'),
    buildDirEntry('lang'),
    buildFileEntry('libsteam_apy.dylib'),
    buildDirEntry('Manuals'),
    buildDirEntry('movies'),
    buildDirEntry('music'),
    buildDirEntry('override'),
    buildDirEntry('scripts'),
    buildDirEntry('Soundtracks'),
    buildFileEntry('steam_appid.txt'),
    // ============== Some of the files in /data
    buildFileEntry('25AmbSnd.bif', buildDirEntry('data')),
    buildFileEntry('25Areas.bif', buildDirEntry('data')),
    buildFileEntry('AMBSound.bif', buildDirEntry('data')),
    buildFileEntry('DIALOG.BIF', buildDirEntry('data')),
    buildFileEntry('STORES.BIF', buildDirEntry('data')),
    // ============== Lang files
    //     Lang German
    buildDirEntry('de_DE', buildDirEntry('lang')),
    buildDirEntry('data', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildDirEntry('movies', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildDirEntry('override', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildDirEntry('sounds', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildFileEntry('dialog.tlk', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildFileEntry('dialogf.tlk', buildDirEntry('de_DE', buildDirEntry('lang'))),
    //     Adding some bif files to test out if they are properly ignored
    buildFileEntry(
      '25NPCSo.bif',
      buildDirEntry('data', buildDirEntry('de_DE', buildDirEntry('lang')))
    ),
    buildFileEntry(
      'DLCHERO.bam',
      buildDirEntry('override', buildDirEntry('de_DE', buildDirEntry('lang')))
    ),
    //     Lang English
    buildDirEntry('en_US', buildDirEntry('lang')),
    buildDirEntry('data', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildDirEntry('movies', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildDirEntry('override', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildDirEntry('sounds', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildFileEntry('dialog.tlk', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildFileEntry('dialogf.tlk', buildDirEntry('en_US', buildDirEntry('lang'))),
    //     Adding some bif files to test out if they are properly ignored
    buildFileEntry(
      '25NPCSo.bif',
      buildDirEntry('data', buildDirEntry('en_ES', buildDirEntry('lang')))
    ),
    buildFileEntry(
      'DLCHERO.bam',
      buildDirEntry('override', buildDirEntry('en_ES', buildDirEntry('lang')))
    )
  ]
};

const MatcherResultsUnsorted = {
  BG2EE: [
    buildFileEntry('chitin.key'),
    buildDirEntry('data'),
    buildDirEntry('lang'),
    buildFileEntry('25AmbSnd.bif', buildDirEntry('data')),
    buildFileEntry('25Areas.bif', buildDirEntry('data')),
    buildFileEntry('AMBSound.bif', buildDirEntry('data')),
    buildFileEntry('DIALOG.BIF', buildDirEntry('data')),
    buildFileEntry('STORES.BIF', buildDirEntry('data')),
    buildDirEntry('de_DE', buildDirEntry('lang')),
    buildDirEntry('en_US', buildDirEntry('lang')),
    buildFileEntry('dialog.tlk', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildFileEntry('dialogf.tlk', buildDirEntry('de_DE', buildDirEntry('lang'))),
    buildFileEntry('dialog.tlk', buildDirEntry('en_US', buildDirEntry('lang'))),
    buildFileEntry('dialogf.tlk', buildDirEntry('en_US', buildDirEntry('lang')))
  ]
};

describe('directory.ts', () => {
  describe('Matchers of game assets', () => {
    it('correctly matches BG2EE files', () => {
      const filteredResults = MatcherTargets.BG2EE.filter(GameFilesMatcher.BG2EE);
      expect(filteredResults.length).to.be.eq(MatcherResultsUnsorted.BG2EE.length);

      const resultsFullPaths = filteredResults.map((em: EntryMock) => em.fullPath);
      MatcherResultsUnsorted.BG2EE.forEach((expectedToBePresentEntry: EntryMock) => {
        expect(resultsFullPaths.indexOf(expectedToBePresentEntry.fullPath)).to.not.be.eql(
          -1,
          `After filtering, ${expectedToBePresentEntry.fullPath} is not in the results.`
        );
      });
    });
  });

  describe('readDirContents function', () => {
    it('properly returns a promise with all the entries in a given DirectoryEntry', (done) => {
      const mockFolder = mockDirStruct('Test Mock Folder', [
        'entry1.gif',
        'subfolderVisible/thisEntryIsInvisible.jpg', // only 'subfolderVisible' should be read
        'subfolderVisible/thisFolderIsInvisible',
        'visible.jpg'
      ]);
      readDirContents(mockFolder).then(({ entries, directory }) => {
        expect(entries.length).to.be.equal(3);
        expect(entries[0].name).to.be.eql('entry1.gif');
        expect(entries[1].name).to.be.eql('subfolderVisible');
        expect(entries[2].name).to.be.eql('visible.jpg');
        done();
      });
    });

    it('reads in batchs, but returns only when the read is complete', (done) => {
      const mockFolder = mockDirStruct('Test Mock Folder', [
        'entry1.gif',
        'subfolder1',
        'subfolder2',
        'entry2.jpg',
        'entry3.png'
      ]);
      readDirContents(mockFolder).then(({ entries, directory }) => {
        expect(entries.length).to.be.equal(5);
        expect(entries[0].name).to.be.eql('entry1.gif');
        expect(entries[1].name).to.be.eql('subfolder1');
        expect(entries[2].name).to.be.eql('subfolder2');
        expect(entries[3].name).to.be.eql('entry2.jpg');
        expect(entries[4].name).to.be.eql('entry3.png');
        expect(mockFolder.lastReader && mockFolder.lastReader.batchCount).to.be.eql(
          Math.ceil(5 / DirectoryReaderMock.MAX_BATCH_SIZE)
        );
        done();
      });
    });
  });

  describe('buildDirectoryStructure', () => {
    it('builds a flat directory tree of a given directory structure', (done) => {
      const rootFolder = 'Test Mock Folder';
      const mockFolder = mockDirStruct(rootFolder, [
        'entry1.jpg',
        'subfolder1/subentry1.jpg',
        'subfolder1/subentry2.jpg',
        'subfolder2/subentry1.jpg',
        'subfolder2/subentry2.jpg',
        'subfolder3/sub-subfolder/entry.jpg',
        'entry3.jpg'
      ]);

      const path = (x: string) => `${mockFolder.fullPath}/${x}`;

      buildDirectoryStructure(mockFolder, (x: Entry) => true).then(
        (flatStruct: FlatDirectoryStructureAsEntries) => {
          expect(flatStruct[path('entry1.jpg')]).to.be.equal(mockFolder.entries[0]);

          expect(flatStruct[path('subfolder1/subentry1.jpg')]).to.be.equal(
            (mockFolder.entries[1] as DirectoryEntryMock).entries[0]
          );
          expect(flatStruct[path('subfolder1/subentry2.jpg')]).to.be.equal(
            (mockFolder.entries[1] as DirectoryEntryMock).entries[1]
          );

          expect(flatStruct[path('subfolder2/subentry1.jpg')]).to.be.equal(
            (mockFolder.entries[2] as DirectoryEntryMock).entries[0]
          );
          expect(flatStruct[path('subfolder2/subentry2.jpg')]).to.be.equal(
            (mockFolder.entries[2] as DirectoryEntryMock).entries[1]
          );

          expect(flatStruct[path('subfolder3/sub-subfolder/entry.jpg')]).to.be.equal(
            ((mockFolder.entries[3] as DirectoryEntryMock).entries[0] as DirectoryEntryMock)
              .entries[0]
          );

          expect(flatStruct[path('entry3.jpg')]).to.be.equal(mockFolder.entries[4]);
          done();
        }
      );
    });
  });
});
