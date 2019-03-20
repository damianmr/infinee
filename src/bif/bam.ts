import { inflateRaw, ungzip } from 'pako';
import { SmartBuffer } from 'smart-buffer';
import { unpad } from '../util/legacyFilenamePadding';
import { addAlpha, intToRGB } from '../util/rgba';
import { BifIndex, EntityFileEntry } from './infBifFile';

// tslint:disable:no-bitwise

/**
 * Describes the header of a BAM image. With this
 * information, we can look up the original image data
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
 * Describes the header of a compressed BAM image
 */
type BamV1CompressedHeader = {
  /** 'BAMC' */
  signature: string;

  /** 'V1  ' */
  version: string;

  /** Length of the uncompressed contents */
  uncompressedDataLength: number;
}

type UncompressedBamV1 = {

  /** Header of the compressed file */
  header: BamV1CompressedHeader,

  /** Uncompressed contents file */
  contents: Buffer
}

/**
 * Holds all the information that is required to have access
 * to the image data of a BAM resource.
 */
export type BamV1ImageLocator = {
  /**
   * The buffer of the file where the image (BAM) is stored.
   *
   * For uncompressed BAMs (v1), this buffer is the BIF file in
   * which the image is stored.
   *
   * For compressed BAMs (v1), this buffer is the uncompressed
   * file that was stored in the BIF file.
   */
  buffer: Buffer;

  offsetToBAM: number;

  bamSize: number;

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
 * also converts each pixel into a 4 elements array representation, becoming something
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
 * we export to BMP and check the results. In a web context, a HTMLCanvas is
 * the most usual way.
 */
export type BitmapMode = 'RGBA' | 'ABGR';

/**
 * Metadata for a frame. Used during rendering.
 */
type BamFrame = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  /** Offset to the image data in the file where this frame is stored */
  frameDataOffset: number;
};

/**
 * An array of 256 numbers (int) with values between 0 and 0xFFFFFF
 */
type BamPalette = number[];

/**
 * Useful debug information when testing the rendering of frames.
 */
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
    const b = SmartBuffer.fromBuffer(index.buffer);
    b.readOffset = bamEntry.offset;

    const signature: string = unpad(b.readString(4));
    const version: string = unpad(b.readString(4));

    if (signature === 'BAMC') {
      const uncompressedBam: UncompressedBamV1 = uncompressV1Bam(index, bamEntry);
      const bamHeader: BamV1Header = parseV1BamHeader(uncompressedBam.contents, bamEntry);
      resolve({
        bamSize: uncompressedBam.header.uncompressedDataLength,
        buffer: uncompressedBam.contents,
        header: bamHeader,
        offsetToBAM: 0
      });
    } else if (version === 'V2') {
      throw new Error('BAM V2 files are not supported.');
    } else {
      b.readOffset = bamEntry.offset;
      const bamHeader: BamV1Header = parseV1BamHeader(b.readBuffer(), bamEntry);
      resolve({
        bamSize: bamEntry.size,
        buffer: index.buffer,
        header: bamHeader,
        offsetToBAM: bamEntry.offset
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

function uncompressV1Bam(index: BifIndex, bamEntry: EntityFileEntry): UncompressedBamV1 {
  const HEADER_BYTES = 12; // Bytes for signature, version and uncompressed length
  const b = SmartBuffer.fromBuffer(index.buffer);

  b.readOffset = bamEntry.offset;

  const signature = b.readString(4);
  const version = b.readString(4);
  const uncompressedDataLength = b.readUInt32LE();

  const bufferToUnzip = b.readBuffer(bamEntry.size - HEADER_BYTES);
  const uncompressedBamBuffer = ungzip(bufferToUnzip);

  return {
    contents: Buffer.from(uncompressedBamBuffer),
    header: { signature, version, uncompressedDataLength }
  }
}

export function getImageData(
  locator: BamV1ImageLocator,
  { frame, bitmapMode }: { frame: number; bitmapMode: BitmapMode } = {
    bitmapMode: 'RGBA',
    frame: 0
  }
): Promise<BamV1Image> {
  return new Promise((resolve) => {
    const palette: BamPalette = buildColorsPalette(locator);
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
 * displayed by NearInfinity.
 *
 * @param locator a BamV1ImageLocator.
 */
function buildColorsPalette(
  locator: BamV1ImageLocator,
): BamPalette {

  const offsets: number[] = [
    locator.header.frameLookUpTableOffset,
    locator.header.framesOffset,
    locator.header.paletteOffset,
    locator.bamSize
  ];

  const sortedOffsets = offsets.sort((n1: number, n2: number) => n1 - n2);
  const paletteIndex = sortedOffsets.indexOf(locator.header.paletteOffset);
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

  const b = SmartBuffer.fromBuffer(locator.buffer);
  b.readOffset = locator.offsetToBAM + locator.header.paletteOffset;
  for (let i = 0; i < entriesCount; i++) {
    const color = b.readUInt32LE();
    bamPalette[i] = color;
  }

  return bamPalette;
}

/**
 * Parse the given file in the BamV1ImageLocator in search of the wanted frame to
 * read its metadata, which will be used later on for the processing.
 */
function parseFrameHeader(locator: BamV1ImageLocator, frameWanted: number): BamFrame {
  if (frameWanted > locator.header.frameCount) {
    throw new Error(`BAM file does not have frame "#${frameWanted}".`);
  }

  const bifFile = SmartBuffer.fromBuffer(locator.buffer);

  bifFile.readOffset = locator.offsetToBAM + locator.header.framesOffset;

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

  return frameToDraw;
}

/**
 * Runs the algorithm that is in charge of decoding the image data of a BAM file
 * so that the output can be used to render it in a HTMLCanvas
 * or any other file format (like BMP).
 *
 * Info on BAM files: https://gibberlings3.github.io/iesdp/file_formats/ie_formats/bam_v1.htm
 *
 * @param locator image locator for the frame that is to be processed.
 * @param palette color palette for the image, each pixel in the image is stored as an
 * index of the palette. Thus, if pixel0's values is 9, it means is using the palette[9] color.
 * @param frame frame metadata like size, offsets, etc
 * @param bitmapMode see the documentation for BitmapMode type. It modifies the output so it can
 * be used to feed a HTMLCanvas (RGBA) or a bitmap file (ABGR).
 */
function processFrame(
  locator: BamV1ImageLocator,
  palette: BamPalette,
  frame: BamFrame,
  bitmapMode: BitmapMode
): ImageData {
  const bifFile = SmartBuffer.fromBuffer(locator.buffer);
  const readByte = (): number => bifFile.readBuffer(1)[0];

  const frameDataOffset = frame.frameDataOffset & 0x7fffffff;
  const isCompressed = !(frame.frameDataOffset & 0x80000000);

  bifFile.readOffset = locator.offsetToBAM + frameDataOffset;

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
