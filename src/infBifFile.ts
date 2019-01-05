import { SmartBuffer } from 'smart-buffer';
import { ResourceTypeID } from './infKey';

/*
  From IESDP: https://github.com/gibberlings3/iesdp/

  This file format is a simple archive format,
  used mainly both to simplify organization of the files
  by grouping logically related files together (especially for areas).
  There is also a gain from having few large files rather than many small files,
  due to the wastage in the FAT and NTFS file systems.
*/

const FILE_SIGNATURE = 'BIFF';
const SUPPORTED_VERSION = 'V1  ';

type BifHeader = {
  signature: string; // char [4]
  version: string; // char [4]
  fileEntryCount: number; // uint32
  tileEntryCount: number; // uint32
  fileEntryOffset: number; // uint32
  // Tileset entries will follow the file entries.
}

type EntityFileEntry = {
  locator: number; // uint32
  offset: number; // uint32
  size: number; // uint32
  type: number; // uint16
  unknown: string; // char[2]
}

type EntriesIndex = { [id: string]: EntityFileEntry } // ID will be <resourceType_locator>

export type BifIndex = {
  header: BifHeader;
  entities: EntriesIndex;
}

function buildFileIndex(biffBuffer: Buffer): BifIndex {
  const r = SmartBuffer.fromBuffer(biffBuffer);
  const header: BifHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    fileEntryCount: r.readUInt32LE(), // tslint:disable-line:object-literal-sort-keys
    tileEntryCount: r.readUInt32LE(),
    fileEntryOffset: r.readUInt32LE()
  };

  if (header.signature.indexOf(FILE_SIGNATURE) !== 0) {
    throw new Error(`Unrecognized file signature. Expected "${FILE_SIGNATURE}", got "${header.signature}" instead.`);
  }

  if (header.version !== SUPPORTED_VERSION) {
    throw new Error(`Unrecognized file version. Expected "${SUPPORTED_VERSION}", got "${header.version}" instead.`);
  }

  r.readOffset = header.fileEntryOffset;

  const entities: EntriesIndex = {};
  for (let i = 0; i < header.fileEntryCount; i++) {
    const fileEntry: EntityFileEntry = {
      locator: r.readUInt32LE(),
      offset: r.readUInt32LE(),
      size: r.readUInt32LE(),
      type: r.readUInt16LE(),
      unknown: r.readString(2)
    }
    entities[`${fileEntry.type}_${fileEntry.locator}`] = fileEntry;
  }

  return {
    entities,
    header
  };
}

export function getFilesIndex(biffBuffer: Buffer): Promise<BifIndex> {
  return new Promise((resolve, reject) => {
    try {
      const fileIndex: BifIndex = buildFileIndex(biffBuffer);
      resolve(fileIndex);
    } catch (e) {
      reject(e);
    }
  });
}

// export function getEntityData