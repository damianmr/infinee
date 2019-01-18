import { dirname, extname } from "path";
import { LANG_FOLDER_REGEX } from "./constants";

export type EntryMatcher = (entry: Entry) => boolean;

export const GameFilesMatcher: { [id: string]: EntryMatcher } = {
  BG2EE: (e: Entry) => {
    const dirPath = dirname(e.fullPath).toLowerCase();
    const dirName = dirPath.slice(dirPath.lastIndexOf('/') + 1);
    const extName = extname(e.fullPath).toLowerCase();
    const name = e.name.toLowerCase();
    if (e.isDirectory) {
      const isDataFolder = name === 'data';
      const isLangFolder = name === 'lang';
      const isOneLanguageFolder = LANG_FOLDER_REGEX.test(name);
      const isDataFolderInLanguageFolder = isDataFolder && LANG_FOLDER_REGEX.test(dirName);
      return (isDataFolder && !isDataFolderInLanguageFolder) || isLangFolder || isOneLanguageFolder;
    } else {
      const isImportant = ['chitin.key', 'dialog.tlk', 'dialogf.tlk'].indexOf(name) !== -1;
      const isBif = extName === '.bif';
      const isInDataFolder = dirName === 'data';
      let parentsParent = dirname(e.fullPath.slice(0, e.fullPath.lastIndexOf('/')));
      parentsParent = parentsParent.slice(parentsParent.lastIndexOf('/') + 1);
      const isInLangFolder = isInDataFolder && LANG_FOLDER_REGEX.test(parentsParent);
      return isImportant || (isBif && !isInLangFolder);
    }
  }
};