
import { unpad } from '../util/legacyFilenamePadding';
import { BifIndex, EntityFileEntry } from './infBifFile';


export type BamV1Definition = {
  signature: string;
  version: string;
  frameCount: number;
  cycleCount: number;
  transparentIndex: number;
  frameOffset: number;
  paletteOffset: number;
  frameLookUpTableOffset: number;
}

type CompressedBamDefinition = {
  signature: string;
  version: string;
  uncompressedDataLenght: string;
}

export function parseBamEntry(
  index: BifIndex,
  bamEntry: EntityFileEntry
): Promise<BamV1Definition> {
  return new Promise((resolve) => {
    index._buffer.readOffset = bamEntry.offset;
    const b = index._buffer;

    const signature: string = unpad(b.readString(4));
    const version: string = unpad(b.readString(4));

    if (signature === 'BAMC') {
      throw new Error('Cannot handle compressed BAMs yet');
    } else if (version === 'V2') {
      throw new Error('Unsupported BAM version');
    } else {
      resolve(parseV1Bam(index, bamEntry));
    }

  });
}

function parseV1Bam(index: BifIndex, bamEntry: EntityFileEntry): BamV1Definition {
  index._buffer.readOffset = bamEntry.offset;
  const b = index._buffer;

  return {
    signature: unpad(b.readString(4)),
    version: unpad(b.readString(4)),
    // tslint:disable-next-line:object-literal-sort-keys
    frameCount: b.readUInt16LE(),
    cycleCount: b.readUInt8(),
    transparentIndex: b.readUInt8(),
    frameOffset: b.readUInt32LE(),
    paletteOffset: b.readUInt32LE(),
    frameLookUpTableOffset: b.readUInt32LE()
  };
}