import { dirname, extname } from 'path';
import { EntryMock } from '../test/mocks/fileSystem';
import { LANG_FOLDER_REGEX } from './constants';

type DirectoryEntries = {
  entries: Entry[];
  directory: DirectoryEntry;
};

export type FlatDirectoryStructureAsEntries = {
  [path: string]: FileEntry;
};

export type FlatDirectoryStructure = {
  [path: string]: File;
};

function asFile(fileEntry: FileEntry): Promise<File> {
  return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
}

type EntryMatcher = (entry: Entry) => boolean;

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

export function readDirContents(directory: DirectoryEntry): Promise<DirectoryEntries> {
  const directoryReader = directory.createReader();
  return new Promise((resolve, reject) => {
    let entries: Entry[] = [];
    const readBatch = () => {
      directoryReader.readEntries((batch: Entry[]) => {
        if (batch.length === 0) {
          resolve({ entries, directory });
        } else {
          entries = entries.concat(batch);
          readBatch();
        }
      }, reject);
    };
    readBatch();
  });
}

export function buildDirectoryStructure(
  mainDirectory: DirectoryEntry,
  allow: EntryMatcher
): Promise<FlatDirectoryStructureAsEntries> {
  const dirStructure: FlatDirectoryStructureAsEntries = {};

  return new Promise((resolveEverything, rejectEverything) => {
    const readDir = (dir: DirectoryEntry): Promise<FlatDirectoryStructureAsEntries> => {
      const subDirsPromises: Array<Promise<FlatDirectoryStructureAsEntries>> = [];

      return new Promise((resolveDir) => {
        readDirContents(dir).then((dirEntries: DirectoryEntries) => {
          for (const entry of dirEntries.entries) {
            if (entry.isDirectory && allow(entry)) {
              subDirsPromises.push(readDir(entry as DirectoryEntry));
            } else if (allow(entry)) {
              dirStructure[`${entry.fullPath}`] = entry as FileEntry;
            }
          }
          Promise.all(subDirsPromises).then(() => resolveDir(dirStructure));
        });
      });
    };

    readDir(mainDirectory).then(resolveEverything);
  });
}

export function createFilePointers(
  dirStructure: FlatDirectoryStructureAsEntries
): Promise<FlatDirectoryStructure> {
  const struct: FlatDirectoryStructure = {};
  return new Promise((resolveAll, rejectAll) => {
    Promise.all(
      Object.keys(dirStructure).map((filePath: string) => {
        return new Promise((resolve) => {
          asFile(dirStructure[filePath]).then((file: File) => {
            struct[filePath] = file;
            resolve();
          });
        });
      })
    )
      .then(() => resolveAll(struct))
      .catch(rejectAll);
  });
}

type FutureProofDataTransferItem = DataTransferItem & { getAsEntry?: () => void };
function getAsEntry(transferItem: FutureProofDataTransferItem) {
  if (transferItem.getAsEntry) {
    return transferItem.getAsEntry();
  } else {
    return transferItem.webkitGetAsEntry();
  }
}

export function loadGameFolder(
  gameFolder: DataTransferItemList,
  matcher: EntryMatcher
): Promise<FlatDirectoryStructure> {
  return new Promise((resolveGameFolder, rejectGameFolder) => {
    if (gameFolder.length > 1) {
      rejectGameFolder(new Error('Only one element must be in the transfer.'));
    }
    const droppedItem: Entry = getAsEntry(gameFolder[0]);
    if (!droppedItem.isDirectory) {
      rejectGameFolder(new Error('Not a valid BG2:EE game folder.'));
    }

    buildDirectoryStructure(droppedItem as DirectoryEntry, matcher)
      .then(createFilePointers)
      .then((gameFolderStructure: FlatDirectoryStructure) =>
        resolveGameFolder(gameFolderStructure)
      );
  });
}
