import { unpad } from '../util/legacyFilenamePadding';
import { BifIndex, EntityFileEntry } from './infBifFile';

// tslint:disable:no-bitwise

/**
 * Describes the header of a BAM image. With this
 * information, we can look up for the original image data
 * in a BIF file.
 */
export type BamV1Header = {

  /** 'BAM ' | 'BAMC' */
  signature: string;

  /** 'V1  ' | 'V2  ' */
  version: string;

  /** Frames count in BAM resource */
  frameCount: number;

  /** Cycles count in a BAM resource */
  cycleCount: number;

  /** The color used for transparency mask */
  transparentIndex: number;

  /**
   * Where to seek to find frames' data. Relative
   * to the beggining of a BAM file, not the BIF in
   * which it is stored.
   */
  framesOffset: number;

  /**
   * Where to seek to find palette's data. Relative
   * to the beggining of a BAM file, not the BIF in
   * which it is stored.
   */
  paletteOffset: number;

  /** Where to seek to find frame lookup table (TODO: Add more details) */
  frameLookUpTableOffset: number;
};

/**
 * Holds all the information that is required to have access
 * to the image data of a BAM resource.
 */
export type BamV1ImageLocator = {

  /** The BIF file where the image (BAM) is stored */
  bif: BifIndex;

  /** Information regarding as to where in the BIF file is the BAM header stored */
  entry: EntityFileEntry;

  /** Information about the image (palette, frames, cycles, pixels) */
  header: BamV1Header;

}

/**
 * Stores raw image data that can be used to render
 * a BAM file into a canvas or any other format in
 * which the pixel by pixel information could be used.
 *
 * SVG could be acandidate for easier testing, it's been discarded
 * because the resulting SVG would be massive in size compared
 * to canvas versions.
 */
export type BamV1Image = {

  /**
   * An array of 256 colors (or less) that are used in the image.
   */
  palette: BamPalette;

  /**
   * Raw data that can be used to feed a canvas#putImageData method.
   */
  image: ImageData;
};

// type CompressedBamDefinition = {
//   signature: string;
//   version: string;
//   uncompressedDataLenght: string;
// };

type BamFrame = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  frameDataOffset: number; // bit 31 is a flag for RLE. 1 = RLE
};

type BamPalette = number[];

export function parseBamEntry(
  index: BifIndex,
  bamEntry: EntityFileEntry
): Promise<BamV1ImageLocator> {
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
      const bamHeader: BamV1Header = parseV1BamHeader(index, bamEntry);
      resolve({
        bif: index,
        entry: bamEntry,
        header: bamHeader,
      });
    }
  });
}

function parseV1BamHeader(index: BifIndex, bamEntry: EntityFileEntry): BamV1Header {
  index._buffer.readOffset = bamEntry.offset;
  const b = index._buffer;

  const bamDef: BamV1Header = {
    signature: unpad(b.readString(4)),
    version: unpad(b.readString(4)),
    // tslint:disable-next-line:object-literal-sort-keys
    frameCount: b.readUInt16LE(),
    cycleCount: b.readUInt8(),
    transparentIndex: b.readUInt8(),
    framesOffset: b.readUInt32LE(),
    paletteOffset: b.readUInt32LE(),
    frameLookUpTableOffset: b.readUInt32LE()
  };

  return bamDef;
}

export function getImageData(
  locator: BamV1ImageLocator,
  frameWanted: number = 0
): BamV1Image {
  if (frameWanted > locator.header.frameCount) {
    throw new Error(`BAM file does not have frame "#${frameWanted}". BIF ID: "${locator.bif.id}"`);
  }

  const bifFile = locator.bif._buffer;
  bifFile.readOffset = locator.entry.offset + locator.header.framesOffset;

  const palette = buildColorsPalette(locator.bif, locator.entry, locator.header);

  // move the offset to the specific frame we want to take
  // TODO Find a better, more direct, way.
  for (let i = 0; i < frameWanted; i++) {
    bifFile.readUInt16LE(); // width
    bifFile.readUInt16LE(); // height
    bifFile.readUInt16LE(); // centerX
    bifFile.readUInt16LE(); // centerY
    bifFile.readUInt32LE(); // frameDataOffset
  }

  const frameToDraw: BamFrame = {
    width: bifFile.readUInt16LE(),
    // tslint:disable-next-line:object-literal-sort-keys
    height: bifFile.readUInt16LE(),
    centerX: bifFile.readUInt16LE(),
    centerY: bifFile.readUInt16LE(),
    frameDataOffset: bifFile.readUInt32LE()
  };

  // b.readOffset = bamEntry.offset + (frameToDraw.frameDataOffset & 0x7fffffff);
  // const frameIsCompressed = !(frameToDraw.frameDataOffset & 0x80000000);

  // const pixelsCount = frameToDraw.width * frameToDraw.height;
  // const pixelsOffset = 0;
  // const count = 0;
  // const x = 0;
  // const y = 0;

  // while (pixelsRead < pixelsCount) {
  //   if (frameIsCompressed && asdsa) {

  //   } else {

  //   }
  // }

  /*
    int nNumPixels = pFrame->wWidth * pFrame->wHeight;
    int nSourceOff = 0;
    int nPixelCount = 0;
    int nCount;
    int x = 0;
    int y = 0;

    while(nPixelCount < nNumPixels)
    {
        if (bIsCompressed && pRawBits[nSourceOff] == m_pHeader->chTransparentIndex)
        {
            nSourceOff++;
            nCount = pRawBits[nSourceOff] + 1;
            while(nCount)
            {
                //TODO: double-check x/y
                image.setPixel(x, y, clrTrans);
                nCount--;
                nPixelCount++;

                if (++x >= pFrame->wWidth) {
                    x = 0;
                    ++y;
                }
            }

            nSourceOff++;
        }
        else
        {
            // If it is not compressed, still need to catch the transparent pixels and
            // fill with the transaprent color.
            if (pRawBits[nSourceOff] == m_pHeader->chTransparentIndex)
                image.setPixel(x, y, clrTrans);
            else {
                QRgb revColor  = *(pPal + pRawBits[nSourceOff]);
                QRgb realColor = qRgb(qRed(revColor), qGreen(revColor), qBlue(revColor));
                image.setPixel(x, y, realColor);
            }

            nSourceOff++;
            nPixelCount++;

            if (++x >= pFrame->wWidth) {
                x = 0;
                ++y;
            }
        }
    }
    */
  return {
    image: {
      data: Uint8ClampedArray.from([123, 123, 123]),
      height: 10,
      width: 10
    },
    palette
  };
}

/**
 * Builds the color palette for a BAMV1Definition.
 *
 * The algorithm is based on NearInfinity's implementation, which works even in cases
 * where the palette has less than 256 colors (See BAMV1Decoder#init method).
 *
 * I honestly don't understand the reasons why this algorithm reliably works. Most probably
 * has to be with implementation details of BAM files in edge cases that are unknown to me.
 *
 * A different approach is used by EEKeeper. There, the palette is not built at all. The
 * algorithm iterates through the pixels and then to get the color of a given pixel is
 * just a matter of using paletteOffset[pixelCurrentlyProcessing].
 *
 * Although I found EEKeeper's approach simpler (I don't plan to use the palette in the UI),
 * is harder to test. If I have the palette information, I can code tests in which I
 * compare the color numbers in the palette for different items/objects with the information
 * displayed in NearInfinity.
 *
 * @param index The BIF file that holds an entry for the BAM file that is to be retrieved.
 * @param bamEntry the BAM file locator in the BIF file.
 * @param bamDef the BAM file descriptor (where to read the frames, the header, cycles, etc).
 */
function buildColorsPalette(
  index: BifIndex,
  bamEntry: EntityFileEntry,
  bamDef: BamV1Header
): BamPalette {
  const originalBufferOffset = index._buffer.readOffset;
  // buffer.readOffset = bamEntry.offset + bamDef.paletteOffset;

  const offsets: number[] = [
    bamDef.frameLookUpTableOffset,
    bamDef.framesOffset,
    bamDef.paletteOffset,
    bamEntry.size
  ];

  const sortedOffsets = offsets.sort((a: number, b: number) => a - b);
  const paletteIndex = sortedOffsets.indexOf(bamDef.paletteOffset);
  let entriesCount = 256;
  if (paletteIndex >= 0 && paletteIndex + 1 < sortedOffsets.length) {
    entriesCount = Math.min(
      256,
      (sortedOffsets[paletteIndex + 1] - sortedOffsets[paletteIndex]) / 4
    );
  }

  const bamPalette: number[] = [];
  for (let i = 0; i < 256; i++) {
    bamPalette[i] = 0x00ff00;
  }

  index._buffer.readOffset = bamEntry.offset + bamDef.paletteOffset;
  for (let i = 0; i < entriesCount; i++) {
    const color = index._buffer.readUInt32LE();
    bamPalette[i] = color;
  }

  index._buffer.readOffset = originalBufferOffset;
  return bamPalette;
}
