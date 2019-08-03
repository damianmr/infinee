import { DirectoryEntryMock, EntryMock, FileEntryMock, MOCK_FILESYSTEM_ROOT } from './fileSystem';

export function buildDirEntry(name: string, parentDir?: DirectoryEntryMock): DirectoryEntryMock {
  if (!parentDir) {
    parentDir = MOCK_FILESYSTEM_ROOT;
  }
  return new DirectoryEntryMock({
    fullPath: `${parentDir.fullPath}/${name}`,
    name
  });
}

export function buildFileEntry(name: string, parentDir?: DirectoryEntryMock): FileEntryMock {
  if (!parentDir) {
    parentDir = MOCK_FILESYSTEM_ROOT;
  }
  return new FileEntryMock({
    fullPath: `${parentDir.fullPath}/${name}`,
    name
  });
}

/**
 * WARNING! NOT A PURE FUNCTION! Modifies the given DirectoryEntryMock!
 */
function buildDirRoute(dir: DirectoryEntryMock, route: string) {
  const routeParts = route.split('/'); // my/super/route [my, super, route]
  let parentDir: DirectoryEntryMock = dir;
  for (let i = 0; i < routeParts.length; i++) {
    const part = routeParts[i];
    if (i === routeParts.length - 1) {
      // last part of the route
      if (part.indexOf('.') === -1) {
        parentDir.entries.push(
          new DirectoryEntryMock({
            fullPath: `${parentDir.fullPath}/${part}`,
            name: part
          })
        );
      } else {
        parentDir.entries.push(
          new FileEntryMock({
            fullPath: `${parentDir.fullPath}/${part}`,
            name: part
          })
        );
      }
    } else {
      const parentFullPath = parentDir.fullPath;
      // look up for existent folder
      const existentDir = parentDir.entries.find(
        (e: EntryMock) => e.isDirectory && e.fullPath === `${parentFullPath}/${part}`
      );
      if (existentDir) {
        parentDir = existentDir as DirectoryEntryMock;
      } else {
        const newEntry = new DirectoryEntryMock({
          name: part,
          fullPath: `${parentFullPath}/${part}`
        });
        parentDir.entries.push(newEntry);
        parentDir = newEntry;
      }
    }
  }
}

export function mockDirStruct(rootName: string, routes: string[]) {
  const rootDir = new DirectoryEntryMock({
    fullPath: `${MOCK_FILESYSTEM_ROOT.fullPath}/${rootName}`,
    name: rootName
  });
  for (const route of routes) {
    buildDirRoute(rootDir, route);
  }

  return rootDir;
}
