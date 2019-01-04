import { SmartBuffer } from 'smart-buffer';
import { unpad } from './util/legacyFilenamePadding';

export const CHITIN_DOT_KEY_FILENAME = 'chitin.key';

export const enum ResourceTypeID {
  BMP = 0x0001, // 1
  WAV = 0x0004, // 4
  BAM = 0x03e8, // 1000
  MOS = 0x03ec, // 1004
  ITM = 0x03ed, // 1005
  SPL = 0x03ee, // 1006
  BCS = 0x03ef, // 1007
  IDS = 0x03f0, // 1008
  CRE = 0x03f1, // 1009
  TWO_DA = 0x03f4, // 1012
  BS = 0x03f9 // 1017
}

const IndexableResourceTypes = [
  ResourceTypeID.ITM,
  ResourceTypeID.BAM,
  ResourceTypeID.BMP,
  ResourceTypeID.SPL,
  ResourceTypeID.CRE,
  ResourceTypeID.IDS,
  ResourceTypeID.TWO_DA,
  ResourceTypeID.BS
];

const FILE_SIGNATURE = 'KEY ';

type KeyHeader = {
  signature: string;
  version: string;
  bifCount: number;
  resourceCount: number;
  bifOffset: number;
  resourceOffset: number;
}

export type BifEntry = {
  fileLength: number;
  fileNameOffset: number;
  fileNameLength: number; // includes NULL (?)
  fileLocation: number;
  fileName: string;
  rawFileName: string; // name as read from disk (with NULL terminator)
}

// An entry in the file that helps rebuild the index of resources.
type ResourceLocatorEntry = {
  name: string;
  type: ResourceTypeID;
  locator: number;
}

export type ResourceInfo = {
  rawName: string; // Name as read from the file, with NULL characters at the end ("MY_FILE\u0000")
  name: string; // Name as JavaScript sees it (no NULL chars, "MY_FILE\u0000" becomes "MY_FILE")
  bifKeyIndex: number;
  tileIndex: number;
  locator: number;
  resourceType: ResourceTypeID;
  flags: number;
}

type ResourcesByType = {
  [index: number]: ResourceInfo[];
}

export type GameResourceIndex = {
  header: KeyHeader;
  bifResources: BifEntry[];
  resources: ResourcesByType;
}

function buildGameIndex(fileBuffer: Buffer): GameResourceIndex {
  const r = SmartBuffer.fromBuffer(fileBuffer);

  const header: KeyHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    bifCount: r.readUInt32LE(), // tslint:disable-line:no-console object-literal-sort-keys
    resourceCount: r.readUInt32LE(),
    bifOffset: r.readUInt32LE(),
    resourceOffset: r.readUInt32LE()
  };

  if (header.signature.indexOf(FILE_SIGNATURE) !== 0) {
    throw new Error(`Unrecognized file signature. Expected "${FILE_SIGNATURE}", got "${header.signature}" instead.`);
  }

  r.readOffset = header.bifOffset;

  const bifResources: BifEntry[] = [];
  for (let i = 0; i < header.bifCount; i++) {
    bifResources.push({
      fileLength: r.readUInt32LE(),
      fileNameOffset: r.readUInt32LE(),
      fileNameLength: r.readUInt16LE(), // tslint:disable-line:no-console object-literal-sort-keys
      fileLocation: r.readInt16LE(),
      fileName: '', // will be populated later
      rawFileName: '' // will be populated later
    });
  }

  for (let i = 0; i < header.bifCount; i++) {
    r.readOffset = bifResources[i].fileNameOffset;
    const fileName: string = r.readString(bifResources[i].fileNameLength);
    // if (fileName[0] === ':') {
    //   console.warn('starting with ":"');
    // }
    bifResources[i].fileName = unpad(fileName);
    bifResources[i].rawFileName = fileName;
  }

  r.readOffset = header.resourceOffset;

  const resources: ResourceLocatorEntry[] = [];
  for (let i = 0; i < header.resourceCount; i++) {
    resources.push({
      name: r.readString(8),
      type: r.readUInt16LE() as ResourceTypeID,
      locator: r.readUInt32LE() // tslint:disable-line: object-literal-sort-keys
    });
  }

  // TODO Copying this logic from EEKeeper, but I think is worth checking if a map
  // with <resourceType_resourceName> as key would be more efficient in JavaScript.
  // I'll find out once I start working in the UI logic.
  const resourcesByType: ResourcesByType = {};
  for (let i = 0; i < header.resourceCount; i++) {
    if (IndexableResourceTypes.indexOf(resources[i].type) !== -1) {
      const resourceEntry = resources[i];
      const sameTypeResources: ResourceInfo[] = resourcesByType[resourceEntry.type] || [];
      sameTypeResources.push({
        name: unpad(resourceEntry.name),
        rawName: resourceEntry.name,
        bifKeyIndex: (resourceEntry.locator & 0xfff00000) >> 20, // tslint:disable-line: object-literal-sort-keys no-bitwise
        locator: resourceEntry.locator & 0x00003fff, // tslint:disable-line: no-bitwise
        tileIndex: (resourceEntry.locator & 0x000fc000) >> 14, // tslint:disable-line: no-bitwise
        resourceType: resourceEntry.type,
        flags: 0
      });
      resourcesByType[resourceEntry.type] = sameTypeResources;
    }
  }

  // TODO Here there _should_ be a call to RefreshOverride() (original EEKeeper)

  return {
    bifResources,
    header,
    resources: resourcesByType
  };
}

export function findBifEntry(gameResourceIndex: GameResourceIndex, bifFileName: string): BifEntry {
  const foundEntry: BifEntry | undefined = gameResourceIndex.bifResources.find((entry: BifEntry) => {
    return (
      entry.fileName
        .toLowerCase()
        .replace('data/', '')
        .replace('.bif', '') === bifFileName.toLowerCase()
    );
  });

  if (!foundEntry) {
    throw new Error(`Entry for BIF file "${bifFileName}.bif" (and variations) not found.`);
  }

  return foundEntry;
}

export function getGameResourceIndex(chitinDotKeyFile: Buffer): Promise<GameResourceIndex> {
  return new Promise((resolve, reject) => {
    try {
      const gameResourceIndex: GameResourceIndex = buildGameIndex(chitinDotKeyFile);
      resolve(gameResourceIndex);
    } catch (e) {
      reject(e);
    }
  });
}
