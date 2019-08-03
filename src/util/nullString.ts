export function fromCString(nullTerminatedString: string) {
  return nullTerminatedString.replace(/\0/g, '');
}

export function toCString(stringToEndWithNull: string) {
  return `${fromCString(stringToEndWithNull)}\u0000`;
}
