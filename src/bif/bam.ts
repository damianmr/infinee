import { inflateRaw, ungzip } from 'pako';
import { SmartBuffer } from 'smart-buffer';
import { unpad } from '../util/legacyFilenamePadding';
import { addAlpha, intToRGB } from '../util/rgba';
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
};

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
   * Metadata of the frame that was just parsed
   */
  frame: BamFrame;

  /**
   * Raw data that can be used to feed a canvas#putImageData method.
   */
  image: ImageData;
};

/**
 * Specifies the way in which pixels of a BAM image will be decomposed
 * into red, green, blue and alpha values.
 *
 * HTMLCanvas API supports RGBA mode, whereas bitmap libraries usually
 * use ABGR.
 *
 * Each pixel of a BAM image is stored as an index in the palette that
 * should be used for that pixel, thus, each pixel has the following form:
 *
 * pixel0 = palette[0 < someIndex <= 255]
 * .
 * .
 * .
 * pixelN = palette[0 < someIndex <= 255]
 *
 * While reading that information, the algorithm that makes this processing
 * also converts each pixel into a 4 array representation, becoming something
 * like
 *
 * pixel0 = [r, g, b, a] // or [a, b, g, r] based on the specified mode
 * .
 * .
 * .
 * pixel1 = [r, g, b, a] // or [a, b, g, r]
 *
 * This is later turned into a flat array which looks like this:
 *
 * [pixel0r, pixel0g, pixel0b, pixel0a, ..., pixelNr, pixelNg, pixelNb, pixelNa]
 *
 * This array can be used to render the image by different meanings. In testing,
 * we export to BMP and check the results. In a web context, a HTMLCanvas will be
 * better.
 */
export type BitmapMode = 'RGBA' | 'ABGR';

type BamV1CompressedHeader = {
  signature: string;
  version: string;
  uncompressedDataLenght: number;
};

type BamFrame = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  frameDataOffset: number; // bit 31 is a flag for RLE. 1 = RLE
};

type BamPalette = number[];

type DebugPixel = {
  paletteIndex: number;
  red: number;
  green: number;
  blue: number;
  pixelIndex: number;
};

/**
 * Parses a given EntityFileEntry as a BAM file, returning the header which can
 * be used to find a given image in such file.
 *
 * Returns a promise with a BamV1ImageLocator that can be feed into #getImageData.
 *
 * @param index a BIF file index, where the EntityFileEntry is supposed to be.
 * @param bamEntry the entity to parse as a BAM file.
 */
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
      const uncompressedBam: Buffer = uncompressV1Bam(index, bamEntry);
      const bamHeader: BamV1Header = parseV1BamHeader(uncompressedBam, bamEntry);
      resolve({
        bif: index,
        entry: bamEntry,
        header: bamHeader
      });
    } else if (version === 'V2') {
      throw new Error('Unsupported BAM version');
    } else {
      index._buffer.readOffset = bamEntry.offset;
      const bamHeader: BamV1Header = parseV1BamHeader(index._buffer.readBuffer(), bamEntry);
      resolve({
        bif: index,
        entry: bamEntry,
        header: bamHeader
      });
    }
  });
}

function parseV1BamHeader(bamFile: Buffer, bamEntry: EntityFileEntry): BamV1Header {
  const b = SmartBuffer.fromBuffer(bamFile);

  const signature = unpad(b.readString(4));
  const version = unpad(b.readString(4));
  const frameCount = b.readUInt16LE();
  const cycleCount = b.readUInt8();
  const transparentIndex = b.readUInt8();
  const framesOffset = b.readUInt32LE();
  const paletteOffset = b.readUInt32LE();
  const frameLookUpTableOffset = b.readUInt32LE();

  const bamDef: BamV1Header = {
    cycleCount,
    frameCount,
    frameLookUpTableOffset,
    framesOffset,
    paletteOffset,
    signature,
    transparentIndex,
    version
  };

  return bamDef;
}

function uncompressV1Bam(index: BifIndex, bamEntry: EntityFileEntry): Buffer {
  const HEADER_BYTES = 12; // Bytes for signature, version and uncompressed length
  const originalOffset = index._buffer.readOffset;

  index._buffer.readOffset = bamEntry.offset;
  index._buffer.readString(4); // Skip signature ('BAMC') (4 bytes)
  index._buffer.readString(4); // Skip version ('V1  ') (4 bytes)
  index._buffer.readUInt32LE(); // Skip uncompressedDataLength (4 bytes)

  const bufferToUnzip = index._buffer.readBuffer(bamEntry.size - HEADER_BYTES);
  const uncompressedBamBuffer = ungzip(bufferToUnzip);

  index._buffer.readOffset = originalOffset;

  return Buffer.from(uncompressedBamBuffer);
}

export function getImageData(
  locator: BamV1ImageLocator,
  { frame, bitmapMode }: { frame: number; bitmapMode: BitmapMode } = {
    bitmapMode: 'RGBA',
    frame: 0
  }
): Promise<BamV1Image> {
  return new Promise((resolve) => {
    const palette: BamPalette = buildColorsPalette(locator.bif, locator.entry, locator.header);
    const frameHeader: BamFrame = parseFrameHeader(locator, frame);
    const image: ImageData = processFrame(locator, palette, frameHeader, bitmapMode);

    resolve({
      frame: frameHeader,
      image,
      palette
    });
  });
}

/**
 * Builds the color palette for a BAMV1Definition.
 *
 * The algorithm is based on NearInfinity's implementation, which works even in cases
 * where the palette has less than 256 colors (See BAMV1Decoder#init method in NearInfinity source).
 *
 * I honestly don't understand the reasons why this algorithm reliably works. Most probably
 * has to be with implementation details of BAM files in edge cases that are unknown to me.
 *
 * A different approach is used by EEKeeper. There, the palette is not built at all. The
 * algorithm iterates through the pixels and then to get the color of a given pixel is
 * just a matter of using paletteOffset[valueOfPixelCurrentlyBeingProcessed].
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

function parseFrameHeader(locator: BamV1ImageLocator, frameWanted: number): BamFrame {
  if (frameWanted > locator.header.frameCount) {
    throw new Error(`BAM file does not have frame "#${frameWanted}". BIF ID: "${locator.bif.id}"`);
  }

  const bifFile = locator.bif._buffer;
  const originalBufferOffset = bifFile.readOffset;

  bifFile.readOffset = locator.entry.offset + locator.header.framesOffset;

  // move the offset to the specific frame we want to take
  // TODO Find a better, more direct, way for god's sake.
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

  bifFile.readOffset = originalBufferOffset;

  return frameToDraw;
}

function processFrame(
  locator: BamV1ImageLocator,
  palette: BamPalette,
  frame: BamFrame,
  bitmapMode: BitmapMode
): ImageData {
  const bifFile = locator.bif._buffer;
  const originalBufferOffset = bifFile.readOffset;
  const readByte = (): number => bifFile.readBuffer(1)[0];

  const frameDataOffset = frame.frameDataOffset & 0x7fffffff;
  const isCompressed = !(frame.frameDataOffset & 0x80000000);

  bifFile.readOffset = locator.entry.offset + frameDataOffset;

  const transparentPaletteIndex = locator.header.transparentIndex;
  const pixelCount = frame.width * frame.height;

  const pixels: number[] = [];
  const debugPixels: DebugPixel[] = [];

  while (pixels.length < pixelCount) {
    const currentByte = readByte();
    if (isCompressed && currentByte === transparentPaletteIndex) {
      const repeatedPixelsCount = readByte() + 1; // run the run-length encoding (RTE), repeating N pixels
      for (let i = 0; i < repeatedPixelsCount; i++) {
        pixels[pixels.length] = palette[transparentPaletteIndex];
        debugPixels[pixels.length - 1] = {
          ...intToRGB(pixels[pixels.length - 1]),
          paletteIndex: transparentPaletteIndex,
          pixelIndex: pixels.length - 1
        };
      }
    } else if (currentByte === transparentPaletteIndex) {
      pixels[pixels.length] = palette[transparentPaletteIndex];
      debugPixels[pixels.length - 1] = {
        ...intToRGB(pixels[pixels.length - 1]),
        paletteIndex: transparentPaletteIndex,
        pixelIndex: pixels.length - 1
      };
    } else {
      pixels[pixels.length] = palette[currentByte];
      debugPixels[pixels.length - 1] = {
        ...intToRGB(pixels[pixels.length - 1]),
        paletteIndex: currentByte,
        pixelIndex: pixels.length - 1
      };
    }
  }

  setLastProcessedFrame(debugPixels);

  // Decompose each pixel color into RGBA representation. After
  // this transformation, the number of elements in the imageRawData
  // becomes width * height * 4.
  const imageRawData: number[] = pixels.reduce(
    (output, pixelColor) => {
      const rgba = addAlpha(intToRGB(pixelColor), 255);
      if (bitmapMode === 'RGBA') {
        return output.concat([rgba.red, rgba.green, rgba.blue, rgba.alpha]);
      } else if (bitmapMode === 'ABGR') {
        return output.concat([rgba.alpha, rgba.blue, rgba.green, rgba.red]);
      } else {
        throw new Error('Impossible case but I have to put it anyway or typescript will kill me.');
      }
    },
    [] as number[]
  );

  bifFile.readOffset = originalBufferOffset;

  return {
    data: Uint8ClampedArray.from(imageRawData),
    height: frame.height,
    width: frame.width
  };
}

let lastProcessedFrame: DebugPixel[] = [];

/**
 * Sets debug information on the last processed frame.
 *
 * Useful for debugging, as the DebugPixel array allows
 * to see the pixels of the image before they are decomposed
 * into RGBA values.
 *
 * @param pixels latest frame processed by the function #processFrame
 */
function setLastProcessedFrame(pixels: DebugPixel[]) {
  lastProcessedFrame = pixels;
}

/**
 * Returns debug information about the last frame processed
 * by #processFrame.
 *
 * This information can be used during debugging sessions. It exposes
 * the color values decomposed in RGBA parts and palette information.
 */
export function getLastProcessedFrameDebugInfo(): DebugPixel[] {
  return lastProcessedFrame;
}
