// tslint:disable:no-bitwise
// tslint:disable:object-literal-sort-keys

export type RGBColor = {
  red: number;
  green: number;
  blue: number;
}

export type RGBAColor = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * Given a color number smaller than 0xFFFFFF, this function decomposes
 * into red, green and blue channels.
 *
 * @param intColor number less than 0xFFFFFF
 */
export function intToRGB(intColor: number): RGBColor {
  if (intColor < 0 || Math.floor(intColor) !== intColor) {
    throw new Error(`Cannot deal with negative or float numbers numbers: ${intColor}.`);
  }
  if (intColor > 0xFFFFFF) {
    throw new Error(`Cannot handle colors with numbers bigger than ${0xFFFFFF} (0xFFFFFF). Given color: ${intColor}`);
  }

  const red: number = intColor >> 16;
  const green: number = intColor - (red << 16) >> 8;
  const blue: number = intColor - (red << 16) - (green << 8);

  return { red, green, blue };
}

/**
 * Adds the alpha channel to a given RGBColor object.
 */
export function addAlpha(color: RGBColor, alpha: number = 255): RGBAColor {
  return {...color, alpha};
}