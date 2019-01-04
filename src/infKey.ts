import { SmartBuffer } from 'smart-buffer';

export const CHITIN_DOT_KEY_FILENAME = 'chitin.key';

const FILE_SIGNATURE = 'KEY ';

interface IKeyHeader {
  signature: string;
  version: string;
  bifCount: number;
  resourceCount: number;
  bifOffset: number;
  resourceOffset: number;
}

interface IBifEntry {
  fileLength: number;
  fileNameOffset: number;
  fileNameLength: number; // includes NULL (?)
  fileLocation: number;
  fileName: string;
}

interface IResourceEntry {
  name: string;
  type: number;
  locator: number;
}

export interface IGameResourceIndex {
  header: IKeyHeader;
  bifResources: IBifEntry[];
  resources: IResourceEntry[];
}


function buildGameIndex(fileBuffer: Buffer): IGameResourceIndex {
  const r = SmartBuffer.fromBuffer(fileBuffer);

  const header: IKeyHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    bifCount: r.readUInt32LE(), // tslint:disable-line:no-console object-literal-sort-keys
    resourceCount: r.readUInt32LE(),
    bifOffset: r.readUInt32LE(),
    resourceOffset: r.readUInt32LE()
  };

  if (header.signature.indexOf(FILE_SIGNATURE) !== 0) {
    throw new Error(
      `Unrecognized file signature. Expected "${FILE_SIGNATURE}", got "${header.signature}" instead.`
    );
  }

  r.readOffset = header.bifOffset;

  const bifResources: IBifEntry[] = [];
  for (let i = 0; i < header.bifCount; i++) {
    bifResources.push({
      fileLength: r.readUInt32LE(),
      fileNameOffset: r.readUInt32LE(),
      fileNameLength: r.readUInt16LE(), // tslint:disable-line:no-console object-literal-sort-keys
      fileLocation: r.readInt16LE(),
      fileName: '' // will be populated later
    });
  }

  for (let i = 0; i < header.bifCount; i++) {
    r.readOffset = bifResources[i].fileNameOffset;
    const fileName: string = r.readString(bifResources[i].fileNameLength);
    // if (fileName[0] === ':') {
    //   console.warn('starting with ":"');
    // }
    bifResources[i].fileName = fileName;
   }

  r.readOffset = header.resourceOffset;

  const resources: IResourceEntry[] = [];
  for (let i = 0; i < header.resourceCount; i++) {
    resources.push({
      name: r.readString(8),
      type: r.readUInt16LE(),
      locator: r.readUInt32LE() // tslint:disable-line:no-console object-literal-sort-keys
    });
  }

  return {
    bifResources,
    header,
    resources
  }
}

export function getGameResourceIndex(chitinDotKeyFile: Buffer): Promise<IGameResourceIndex> {
  return new Promise((resolve, reject) => {
    try {
      const gameResourceIndex: IGameResourceIndex = buildGameIndex(chitinDotKeyFile);
      resolve(gameResourceIndex);
    } catch(e) {
      reject(e);
    }
  });
}