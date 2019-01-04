import { SmartBuffer } from 'smart-buffer';

export const CHITIN_DOT_KEY_FILENAME = 'chitin.key';

type ResourceTypeID = 0x0001 |
  0x0004 |
  0x03e8 |
  0x03ec | 
  0x03ed | 
  0x03ee | 
  0x03ef | 
  0x03f0 | 
  0x03f1 |
  0x03f4 | 
  0x03f9;

export const ResourceType: { [id: string]: ResourceTypeID } = {
  BMP: 0x0001, // 1
  WAV: 0x0004, // 4
  BAM: 0x03e8, // tslint:disable-line:object-literal-sort-keys // 1000
  MOS: 0x03ec, // 1004
  ITM: 0x03ed, // 1005
  SPL: 0x03ee, // 1006
  BCS: 0x03ef, // 1007
  IDS: 0x03f0, // 1008
  CRE: 0x03f1, // 1009
  '2DA': 0x03f4, // 1012
  BS:  0x03f9 // 1017
};

// We don't need to index all resources, this list defines which ones goes to the index.
const IndexableResourceTypes: { [id in ResourceTypeID]?: true } = {
  [ResourceType.ITM]: true,
  [ResourceType.BAM]: true,
  [ResourceType.BMP]: true,
  [ResourceType.SPL]: true,
  [ResourceType.CRE]: true,
  [ResourceType.IDS]: true,
  [ResourceType['2DA']]: true,
  [ResourceType.BS]: true
};

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

// An entry in the file that helps rebuild the index of resources.
interface IResourceLocatorEntry {
  name: string;
  type: ResourceTypeID;
  locator: number;
}

interface IResourceInfo {
  name: string;
  bifKeyIndex: number;
  tileIndex: number;
  locator: number;
  resourceType: ResourceTypeID;
  flags: number;
}

export type ResourcesByType = { [id in ResourceTypeID]?: IResourceInfo[] };

export interface IGameResourceIndex {
  header: IKeyHeader;
  bifResources: IBifEntry[];
  resources: ResourcesByType;
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

  const resources: IResourceLocatorEntry[] = [];
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
    if (resources[i].type in IndexableResourceTypes) {
      const resourceEntry = resources[i];
      const sameTypeResources: IResourceInfo[] = resourcesByType[resourceEntry.type] || [];
      sameTypeResources.push({
        name: resourceEntry.name,
        bifKeyIndex: (resourceEntry.locator & 0xFFF00000) >> 20, // tslint:disable-line: object-literal-sort-keys no-bitwise
        locator: resourceEntry.locator & 0x00003FFF, // tslint:disable-line: no-bitwise
        tileIndex: (resourceEntry.locator & 0x000FC000) >> 14, // tslint:disable-line: no-bitwise
        resourceType: resourceEntry.type,
        flags: 0
      });
      resourcesByType[resourceEntry.type] = sameTypeResources;
    }
  }

  return {
    bifResources,
    header,
    resources: resourcesByType
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