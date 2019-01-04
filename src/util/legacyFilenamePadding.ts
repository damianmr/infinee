
export function pad(stringToPad: string, charCount: number): string {
  let aux: any = stringToPad;
  if (stringToPad.length < charCount) {
    for (let i = stringToPad.length; i < charCount; i++) {
      aux += '\u0000';
    }
  } else if (aux.length > charCount) {
    aux = stringToPad.slice(0, charCount);
  }
  return aux;
}

export function unpad(stringToUnpad: string): string {
  if (stringToUnpad.indexOf('\u0000') === -1) {
    return stringToUnpad;
  } else {
    return stringToUnpad.slice(0, stringToUnpad.indexOf('\u0000'));
  }
}