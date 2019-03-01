import { SmartBuffer } from 'smart-buffer';
import { ResourceInfo, ResourceTypeID } from '../infKey';
import { BamV1Definition, parseBamEntry } from './bam';
import { ItemDefinition, parseItemEntry } from './item';
import { parseSpellEntry, SpellDefinition } from './spell';

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
};

export type EntityFileEntry = {
  locator: number; // uint32
  offset: number; // uint32
  size: number; // uint32
  type: number; // uint16
  unknown: string; // char[2]
};

type EntriesIndex = { [id: string]: EntityFileEntry }; // ID will be <resourceType_locator>

const key = (type: ResourceTypeID, locator: number) => `${type}_${locator}`;

export type BifIndex = {
  id: string;
  header: BifHeader;
  entities: EntriesIndex;
  _buffer: SmartBuffer;
};

/**
 * Build the index of available entities in the given .BIF file.
 *
 * @param biffBuffer a Buffer of a .bif file
 * @param indexName an arbitrary id provided by clients of the module to identify the index in case
 * there's need of debugging
 */
function buildFileIndex(biffBuffer: Buffer, indexName: string): BifIndex {
  const r = SmartBuffer.fromBuffer(biffBuffer);
  const header: BifHeader = {
    signature: r.readString(4),
    version: r.readString(4),
    fileEntryCount: r.readUInt32LE(), // tslint:disable-line:object-literal-sort-keys
    tileEntryCount: r.readUInt32LE(),
    fileEntryOffset: r.readUInt32LE()
  };

  if (header.signature.indexOf(FILE_SIGNATURE) !== 0) {
    throw new Error(
      `Unrecognized file signature for BIF index "${indexName}". Expected "${FILE_SIGNATURE}", got "${
        header.signature
      }" instead.`
    );
  }

  if (header.version !== SUPPORTED_VERSION) {
    throw new Error(
      `Unrecognized file version for BIF index "${indexName}". Expected "${SUPPORTED_VERSION}", got "${
        header.version
      }" instead.`
    );
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
    };
    entities[key(fileEntry.type as ResourceTypeID, fileEntry.locator)] = fileEntry;
  }

  return {
    _buffer: r,
    entities,
    header,
    id: indexName
  };
}

export function getFilesIndex(biffBuffer: Buffer, indexName: string): Promise<BifIndex> {
  return new Promise((resolve, reject) => {
    try {
      const fileIndex: BifIndex = buildFileIndex(biffBuffer, indexName);
      resolve(fileIndex);
    } catch (e) {
      reject(e);
    }
  });
}

// TODO Make this receive two arguments
export function getEntityEntry({
  index,
  resourceInfo
}: {
  index: BifIndex;
  resourceInfo: ResourceInfo;
}): EntityFileEntry {
  const entry: EntityFileEntry =
    index.entities[key(resourceInfo.resourceType, resourceInfo.locator)];
  if (!entry) {
    throw new Error(
      `Entity ${key(resourceInfo.resourceType, resourceInfo.locator)} not found in index ${
        index.id
      }`
    );
  }
  return entry;
}

// -----------
// TODO I see no reason for these getItem|Spell|Bam functions to return a promise.
// The parsing of the entity entry should be fast, right?
// -----------

export function getItem(index: BifIndex, itemResourceInfo: ResourceInfo): Promise<ItemDefinition> {
  return parseItemEntry(index, getEntityEntry({ index, resourceInfo: itemResourceInfo }));
}

export function getSpell(
  index: BifIndex,
  spellResourceInfo: ResourceInfo
): Promise<SpellDefinition> {
  return parseSpellEntry(index, getEntityEntry({ index, resourceInfo: spellResourceInfo }));
}

export function getBam(index: BifIndex, bamResourceInfo: ResourceInfo): Promise<BamV1Definition> {
  return parseBamEntry(index, getEntityEntry({ index, resourceInfo: bamResourceInfo }));
}
