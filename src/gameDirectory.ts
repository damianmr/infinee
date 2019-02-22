import toBuffer from 'blob-to-buffer';
import {
  buildDirectoryStructure,
  createFilePointers,
  FlatDirectoryStructure,
  FlatDirectoryStructureAsEntries
} from './directory';
import { EntryMatcher, GameFilesMatcher } from './entryMatcher';
import { BifEntry } from './infKey';

export type GameFolder = {
  folder: DirectoryEntry;
  matcher: EntryMatcher;
};

function newGameFolder(folder: DirectoryEntry, matcher: EntryMatcher) {
  if (!folder.isDirectory) {
    throw new Error(`Folder ${folder.name} is not a directory.`);
  }
  return {
    folder,
    matcher
  };
}

function removeUnnecesaryPathParts(
  dirStruct: FlatDirectoryStructureAsEntries
): Promise<FlatDirectoryStructureAsEntries> {
  return new Promise((resolve) => {
    const newDirStruct: FlatDirectoryStructureAsEntries = {};
    const keys = Object.keys(dirStruct);
    const chitinKeyPath = keys.find((path: string) => /chitin\.key$/.test(path));
    if (!chitinKeyPath) {
      // The way the this function is supposed to be used, this should never happen,
      // but TypeScript requires this to be checked.
      throw new Error('Chitin.key not found.');
    }
    const partToRemove = chitinKeyPath.slice(0, chitinKeyPath.lastIndexOf('chitin.key'));
    for (const k of keys) {
      newDirStruct[k.slice(partToRemove.length)] = dirStruct[k];
    }

    resolve(newDirStruct);
  });
}

function validateBasicIntegrity(
  dirStruct: FlatDirectoryStructureAsEntries
): Promise<FlatDirectoryStructureAsEntries> {
  return new Promise((resolve) => {
    const keys = Object.keys(dirStruct);
    const existsChitinFile = keys.find((entryPath: string) => {
      return /chitin\.key$/.test(entryPath); // ends with 'chitin.key'
    });
    if (!existsChitinFile) {
      throw new Error('Failed to find missing chitin.key file');
    }

    const existsDataDir = keys.find((entryPath: string) => {
      return /data\/.+\..{3}$/.test(entryPath); // ends with 'data/<something>.<char3Extension>'
    });
    if (!existsDataDir) {
      throw new Error('Failed to find missing data directory');
    }

    const existsDialogFile = keys.find((entryPath: string) => {
      return /dialogf?\.tlk$/.test(entryPath); // ends with 'dialog[f].tlk'
    });
    if (!existsDialogFile) {
      throw new Error('Failed to find missing dialog.tlk or dialogf.tlk file');
    }

    resolve(dirStruct);
  });
}

export async function loadGameFolder(gameFolder: GameFolder): Promise<FlatDirectoryStructure> {
  return new Promise((resolveGameFolder, reject) => {
    buildDirectoryStructure(gameFolder.folder, gameFolder.matcher)
      .then(validateBasicIntegrity)
      .then(removeUnnecesaryPathParts)
      .then(createFilePointers)
      .then((gameFolderStructure: FlatDirectoryStructure) => resolveGameFolder(gameFolderStructure))
      .catch(reject);
  });
}

export const SupportedGameFolders = {
  BG2EE: (entry: Entry) => {
    return newGameFolder(entry as DirectoryEntry, GameFilesMatcher.BG2EE);
  }
};

// TODO Type this so that it receives a GameDirectory!
export async function getGameIndexFile(gameFolder: FlatDirectoryStructure): Promise<Buffer> {
  if (!gameFolder['chitin.key']) {
    throw new Error('Cannot find missing chitin.key');
  }

  return new Promise((resolve, reject) => {
    toBuffer(gameFolder['chitin.key'], (err, buffer: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

export function getBif(gameFolder: FlatDirectoryStructure, bifEntry: BifEntry): Promise<Buffer> {
  if (!gameFolder[bifEntry.fileName]) {
    throw new Error(`Cannot find missing bif entry in game folder "${bifEntry.fileName}"`);
  }

  return new Promise((resolve, reject) => {
    toBuffer(gameFolder[bifEntry.fileName], (err, buffer: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}
