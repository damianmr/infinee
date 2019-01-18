import { EntryMatcher } from './entryMatcher';

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
