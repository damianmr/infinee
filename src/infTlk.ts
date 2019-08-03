import { SmartBuffer } from 'smart-buffer';

export const DIALOG_DOT_TLK_FILENAME = 'dialog.tlk';

const FILE_SIGNATURE = 'TLK ';

type DialogEntry = {
  unknown: number;
  soundName: string;
  volumeVariance: number;
  pitchVariance: number;
  relativeOffset: number;
  length: number;
};

type PopulatedDialogEntry = DialogEntry & {
  text: string;
};

type DialogsTable = {
  signature: string;
  version: string;
  unknown: string;
  stringsCount: number;
  stringsOffset: number;
};

type EmptyDialogsTable = DialogsTable & {
  dialogs: DialogEntry[];
};

export type PopulatedDialogsTable = DialogsTable & {
  dialogs: PopulatedDialogEntry[];
};

function buildDialogsTable(fileBuffer: Buffer): EmptyDialogsTable {
  const r = SmartBuffer.fromBuffer(fileBuffer);

  const fileHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    unknown: r.readString(2), // tslint:disable-line:no-console object-literal-sort-keys
    stringsCount: r.readUInt32LE(),
    stringsOffset: r.readUInt32LE()
  };

  if (fileHeader.signature.indexOf(FILE_SIGNATURE) !== 0) {
    const errorMessage = [
      'Unrecognized file signature. ',
      `Expected "${FILE_SIGNATURE}", got "${fileHeader.signature}" instead.`
    ];
    throw new Error(errorMessage.join(''));
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

function populateDialogsTable(
  dialogsFileContents: Buffer,
  dI: EmptyDialogsTable
): PopulatedDialogsTable {
  const r = SmartBuffer.fromBuffer(dialogsFileContents);
  const dialogs: PopulatedDialogEntry[] = [];
  for (let i = 0; i < dI.stringsCount; i++) {
    r.readOffset = dI.stringsOffset + dI.dialogs[i].relativeOffset;
    dialogs[i] = Object.assign({}, dI.dialogs[i], {
      text: r.readString(dI.dialogs[i].length)
    });
  }

  return Object.assign({}, dI, { dialogs });
}

export function getDialogsTable(dialogsFileBuffer: Buffer): Promise<PopulatedDialogsTable> {
  return new Promise((resolve, reject) => {
    try {
      const index: PopulatedDialogsTable = populateDialogsTable(
        dialogsFileBuffer,
        buildDialogsTable(dialogsFileBuffer)
      );
      resolve(index);
    } catch (e) {
      reject(e);
    }
  });
}

export function getText(dialogsIndex: PopulatedDialogsTable, index: number) {
  if (index > dialogsIndex.dialogs.length || index < 0) {
    throw new Error('Cannot retrieve text. Index out of bounds.');
  }

  return dialogsIndex.dialogs[index].text;
}
