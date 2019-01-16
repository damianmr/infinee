import { DirectoryEntryMock, FileEntryMock, MOCK_FILESYSTEM_ROOT } from './fileSystem';

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
