import { fail } from "assert";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import { Language } from "../src/constants";
import { getText, IPopulatedDialogsTable, read } from "../src/infTlk";
import { MOCK_INSTALL } from "./constants";

chai.use(chaiAsPromised);

const KNOWN_STRINGS = [
  { index: 0, value: "<NO TEXT>" },
  { index: 1, value: "No, I'm sorry, none of them sound familiar." },
  { index: 55003, value: "What is their true nature? What price are you talking about?" },
  // tslint:disable-next-line:max-line-length
  {
    index: 103240,
    value:
      "Only the most worthy and devoted servants of the Foehammer are granted these powerful holy symbols. \n\nSTATISTICS:\n\nEquipped abilities:\n– Strength: +1\n– Magic Resistance: +5%\n– Can memorize one extra 6th- and 7th-level Cleric spell\n\nWeight: 0"
  }
];

describe("Testing the proper reading of dialog.tlk file", () => {
  it("should read the file properly", () => {
    return read(MOCK_INSTALL, Language.EnglishUS).then((dialogsIndex: IPopulatedDialogsTable) => {
      expect(dialogsIndex.signature).to.be.equal("TLK ");
      expect(dialogsIndex.version).to.be.equal("V1  ");
    });
  });

  it("should've read the strings table properly (testing against a few known values)", async () => {
    return read(MOCK_INSTALL, Language.EnglishUS).then((dialogsIndex: IPopulatedDialogsTable) => {
      KNOWN_STRINGS.forEach(({ index, value }: { index: number; value: string }) => {
        expect(dialogsIndex.dialogs[index].text).to.be.equal(value);
      });
    });
  });
});

describe("Getting a text value from the dialogs file", () => {
  let dialogsIndex: IPopulatedDialogsTable;

  before(async () => {
    dialogsIndex = await read(MOCK_INSTALL, Language.EnglishUS);
  });

  it("should retrieve a text from the index", () => {
    expect(getText(dialogsIndex, KNOWN_STRINGS[0].index)).to.be.equal(KNOWN_STRINGS[0].value);
    const lastKnownString = KNOWN_STRINGS[KNOWN_STRINGS.length - 1];
    expect(getText(dialogsIndex, lastKnownString.index)).to.be.equal(lastKnownString.value);
  });

  it("should fail if trying to access an out of bounds index", () => {
    expect(() => getText(dialogsIndex, 999000)).to.throw(/out of bounds/);
    expect(() => getText(dialogsIndex, -1)).to.throw(/out of bounds/);
  });
});
