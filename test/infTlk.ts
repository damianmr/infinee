import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import 'mocha';
import { join } from 'path';
import { DIALOG_DOT_TLK_FILENAME, getDialogsTable, getText, IPopulatedDialogsTable } from '../src/infTlk';
import { MOCK_INSTALL } from './constants';

chai.use(chaiAsPromised);

const TEST_DIALOG_DOT_TLK_FILE_PATH: string = join(MOCK_INSTALL, 'en_US', DIALOG_DOT_TLK_FILENAME);

const KNOWN_STRINGS = [
  { index: 0, value: '<NO TEXT>' },
  { index: 1, value: "No, I'm sorry, none of them sound familiar." },
  { index: 55003, value: 'What is their true nature? What price are you talking about?' },
  // tslint:disable-next-line:max-line-length
  {
    index: 103240,
    value:
      'Only the most worthy and devoted servants of the Foehammer are granted these powerful holy symbols. \n\nSTATISTICS:\n\nEquipped abilities:\n– Strength: +1\n– Magic Resistance: +5%\n– Can memorize one extra 6th- and 7th-level Cleric spell\n\nWeight: 0'
  }
];

const BUFFER = readFileSync(TEST_DIALOG_DOT_TLK_FILE_PATH);

describe('Testing the basic parsing of dialog.tlk file', () => {
  it('fails when given a file with a very short header (parsing will fail)', (done) => {
    const bogusBuffer = Buffer.from('Bogus Buffer');
    getDialogsTable(bogusBuffer)
      .then(() => {
        // Should not happen
      })
      .catch((e) => {
        expect(e.message.indexOf('read beyond the bounds')).to.be.gt(-1);
        done();
      });
  });

  it('fails when given a file is big enough but unrecognizable', (done) => {
    const bogusBuffer = Buffer.alloc(1000, 1);
    getDialogsTable(bogusBuffer)
      .then(() => {
        // Should not happen
      })
      .catch((e) => {
        expect(e.message.indexOf('file signature')).to.be.gt(-1);
        done();
      });
  });

  it('file header is properly read', () => {
    return getDialogsTable(BUFFER).then((dialogsIndex: IPopulatedDialogsTable) => {
      expect(dialogsIndex.signature).to.be.equal('TLK ');
      expect(dialogsIndex.version).to.be.equal('V1  ');
    });
  });

  it("should've read the strings table properly (testing against a few known values)", async () => {
    return getDialogsTable(BUFFER).then((dialogsIndex: IPopulatedDialogsTable) => {
      KNOWN_STRINGS.forEach(({ index, value }: { index: number; value: string }) => {
        expect(dialogsIndex.dialogs[index].text).to.be.equal(value);
      });
    });
  });
});

describe('Getting a text value from the dialogs file', () => {
  let dialogsIndex: IPopulatedDialogsTable;

  before(async () => {
    dialogsIndex = await getDialogsTable(BUFFER);
  });

  it('should retrieve a text from the index', () => {
    expect(getText(dialogsIndex, KNOWN_STRINGS[0].index)).to.be.equal(KNOWN_STRINGS[0].value);
    const lastKnownString = KNOWN_STRINGS[KNOWN_STRINGS.length - 1];
    expect(getText(dialogsIndex, lastKnownString.index)).to.be.equal(lastKnownString.value);
  });

  it('should fail if trying to access an out of bounds index', () => {
    expect(() => getText(dialogsIndex, 999000)).to.throw(/out of bounds/);
    expect(() => getText(dialogsIndex, -1)).to.throw(/out of bounds/);
  });
});
