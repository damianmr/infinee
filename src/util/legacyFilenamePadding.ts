/**
 * Append NULL characters to the end of a given string so that it
 * perfectly fills the charCount slots.
 *
 * Example: pad('ICON06', 8) -> 'ICON06\0000\0000'.
 *
 * Most strings across the game files usually are constrained to certain
 * array lenght and in many cases those names are shorter than the limit.
 * In such cases, calling this function let you have "compatible names" that
 * will perfectly fit in the game files.
 *
 * @param stringToPad the string you want to pad, if its length is equal to the charCount
 * parameter, the same unmodified string will be returned.
 * @param charCount how many 'slots' this string should have.
 */
export function pad(stringToPad: string, charCount: number): string {
  let aux: string = stringToPad;
  if (stringToPad.length < charCount) {
    for (let i = stringToPad.length; i < charCount; i++) {
      aux += '\u0000';
    }
  } else if (aux.length > charCount) {
    aux = stringToPad.slice(0, charCount);
  }
  return aux;
}

/**
 * Remove NULL characters from the end of a give string.
 *
 * Example: 'ICON06\0000\0000' becomes 'ICON06'.
 *
 * Many strings throught the game files end like this, although all of them
 * have an 8 character cap. When the string is shorter than 8 characters,
 * it ends with NULL char.
 *
 * @param stringToUnpad the string you want to remove the NULL chars from.
 */
export function unpad(stringToUnpad: string): string {
  if (stringToUnpad.indexOf('\u0000') === -1) {
    return stringToUnpad;
  }
  return stringToUnpad.slice(0, stringToUnpad.indexOf('\u0000'));
}
