import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import { GameFilesMatcher } from '../src/entryMatcher';
import { EntryMock } from './mocks/fileSystem';
import { buildDirEntry, buildFileEntry } from './mocks/fileSystemUtil';

chai.use(chaiAsPromised);

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
