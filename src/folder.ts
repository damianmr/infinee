type DirectoryEntries = {
  entries: Entry[];
  directory: DirectoryEntry;
};

type FlatDirectoryStructure = {
  [path: string]: FileEntry
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

export function buildDirectoryStructure(mainDirectory: DirectoryEntry): Promise<FlatDirectoryStructure> {
  const dirStructure: FlatDirectoryStructure = {};

  return new Promise((resolveEverything, rejectEverything) => {

    const readDir = (dir: DirectoryEntry): Promise<FlatDirectoryStructure> => {
      const subDirsPromises: Array<Promise<FlatDirectoryStructure>> = [];

      return new Promise((resolveDir) => {
        readDirContents(dir).then((dirEntries: DirectoryEntries) => {
          for (const entry of dirEntries.entries) {
            if (entry.isDirectory) {
              subDirsPromises.push(readDir(entry as DirectoryEntry));
            } else {
              dirStructure[`${entry.fullPath}`] = entry as FileEntry;
            }
          }
          Promise.all(subDirsPromises).then(() => resolveDir(dirStructure));
        });
      });
    }

    readDir(mainDirectory).then(resolveEverything);
  });
}
