import { SmartBuffer } from 'smart-buffer';

export const DIALOG_DOT_TLK_FILENAME = 'dialog.tlk';

const FILE_SIGNATURE = 'TLK ';

interface IDialogEntry {
  unknown: number;
  soundName: string;
  volumeVariance: number;
  pitchVariance: number;
  relativeOffset: number;
  length: number;
}

interface IPopulatedDialogEntry extends IDialogEntry {
  text: string;
}

interface IDialogsTable {
  signature: string;
  version: string;
  unknown: string;
  stringsCount: number;
  stringsOffset: number;
}

interface IEmptyDialogsTable extends IDialogsTable {
  dialogs: IDialogEntry[];
}

export interface IPopulatedDialogsTable extends IDialogsTable {
  dialogs: IPopulatedDialogEntry[];
}

function buildDialogsTable(fileBuffer: Buffer): IEmptyDialogsTable {
  const r = SmartBuffer.fromBuffer(fileBuffer);

  const fileHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    unknown: r.readString(2), // tslint:disable-line:no-console object-literal-sort-keys
    stringsCount: r.readUInt32LE(),
    stringsOffset: r.readUInt32LE()
  };

  if (fileHeader.signature.indexOf(FILE_SIGNATURE) !== 0) {
    throw new Error(
      `Unrecognized file signature. Expected "${FILE_SIGNATURE}", got "${fileHeader.signature}" instead.`
    );
  }

  const dialogs = [];
  // TODO Maybe iterate just once and compare performance results?
  // I would be 'seeking' the file all the time
  for (let i = 0; i < fileHeader.stringsCount; i++) {
    dialogs[i] = {
      unknown: r.readUInt16LE(),
      soundName: r.readString(8), // tslint:disable-line:no-console object-literal-sort-keys
      volumeVariance: r.readUInt32LE(),
      pitchVariance: r.readUInt32LE(),
      relativeOffset: r.readUInt32LE(),
      length: r.readUInt32LE(),
      text: null
    };
  }
  return Object.assign({}, fileHeader, { dialogs });
}

function populateDialogsTable(dialogsFileContents: Buffer, dI: IEmptyDialogsTable): IPopulatedDialogsTable {
  const r = SmartBuffer.fromBuffer(dialogsFileContents);
  const dialogs: IPopulatedDialogEntry[] = [];
  for (let i = 0; i < dI.stringsCount; i++) {
    r.readOffset = dI.stringsOffset + dI.dialogs[i].relativeOffset;
    dialogs[i] = Object.assign({}, dI.dialogs[i], {
      text: r.readString(dI.dialogs[i].length)
    });
  }

  return Object.assign({}, dI, { dialogs });
}

export function getDialogsTable(dialogsFileBuffer: Buffer): Promise<IPopulatedDialogsTable> {
  return new Promise((resolve, reject) => {
    try {
      const index: IPopulatedDialogsTable = populateDialogsTable(dialogsFileBuffer, buildDialogsTable(dialogsFileBuffer));
      resolve(index);
    } catch(e) {
      reject(e);
    }
  });
}

export function getText(dialogsIndex: IPopulatedDialogsTable, index: number) {
  if (index > dialogsIndex.dialogs.length || index < 0) {
    throw new Error('Cannot retrieve text. Index out of bounds.');
  }

  return dialogsIndex.dialogs[index].text;
}
