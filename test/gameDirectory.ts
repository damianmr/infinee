import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import { FlatDirectoryStructure } from '../src/directory';
import { loadGameFolder, SupportedGameFolders } from '../src/gameDirectory';
import { FileEntryMock } from './mocks/fileSystem';
import { mockDirStruct } from './mocks/fileSystemUtil';

chai.use(chaiAsPromised);

describe('gameDirectory.ts', () => {
  describe('loadGameFolder', () => {
    it('fails if the dropped element is not a directory', () => {
      expect(() => {
        loadGameFolder(
          SupportedGameFolders.BG2EE(
            new FileEntryMock({
              fullPath: 'i/will/make/it/fail/iWillMakeItFail.png',
              name: 'iWillMakeItFail.png'
            })
          )
        );
      }).to.throw(/is not a directory/);
    });
  
    describe('fails if is not possible to read a basic game structure', () => {
      it('fails on missing data directory', (done) => {
        loadGameFolder(
          SupportedGameFolders.BG2EE(
            mockDirStruct('invalid bg2ee install', ['chitin.key', 'lang/de_DE/dialog.tlk'])
          )
        ).catch((e: Error) => {
          expect(/data directory/.test(e.message)).to.be.eq(true);
          done();
        });
      });
  
      it('fails on missing dialog file', (done) => {
        loadGameFolder(
          SupportedGameFolders.BG2EE(
            mockDirStruct('invalid bg2ee install', [
              'chitin.key',
              'data/some.bif',
              'data/another.bif',
              'lang/de_DE/ignored.bif'
            ])
          )
        ).catch((e: Error) => {
          expect(/missing dialog\.tlk or dialogf\.tlk file/.test(e.message)).to.be.eq(true);
          done();
        });
      });
  
      it('fails on missing chitin.key file', (done) => {
        loadGameFolder(
          SupportedGameFolders.BG2EE(
            mockDirStruct('invalid bg2ee install', ['data/some.bif', 'lang/de_DE/dialog.tlk'])
          )
        ).catch((e: Error) => {
          expect(/missing chitin\.key file/.test(e.message)).to.be.eq(true);
          done();
        });
      });
    });
  
    it('removes unnecesary prefix parts from the paths', (done) => {
      loadGameFolder(
        SupportedGameFolders.BG2EE(
          mockDirStruct('bg2ee', ['chitin.key', 'data/some.bif', 'lang/de_DE/dialog.tlk'])
        )
      ).then((gameDir: FlatDirectoryStructure) => {
        expect(gameDir['chitin.key']).not.to.be.undefined;
        expect(gameDir['data/some.bif']).not.to.be.undefined;
        expect(gameDir['lang/de_DE/dialog.tlk']).not.to.be.undefined;
        done();
      });
    });
  
    // TODO Make this test
    // I am not making it right now because the tests that make use of
    // MatcherResultsUnsorted are already checking this, but I want to remove those tests
    // and just leave this one.
    it('loads all expected directories and files, leaving out unnecesary ones');
  });

  describe('getGameIndexFile', () => {
    it('fails if chitin.key does not exist in the given index');
  });

  describe('getBif', () => {
    it('fails if a given BifEntry does no does not exists.');
  });
});

