// tslint:disable:no-console object-literal-sort-keys
import { readFile as rF } from "fs";
import { join } from "path";
import { promisify } from "util";
import { LanguageCode } from "./constants";

const readFile = promisify(rF);

const TLK_FILENAME = "dialog.tlk";

function parseHeader(fileBuffer: Buffer): any {
  
}

export function read(installationPath: string, language: LanguageCode) {
  const filePath: string = join(installationPath, language, TLK_FILENAME);

  console.log("Reading translations file: ", filePath);
  readFile(filePath, null)
  .then((contents) => {
    console.log(contents);
  })
  .catch((err) => {
    console.log("Error reading dialog.tlk file. ", err);
  });
}
