// tslint:disable:max-classes-per-file

export let MOCK_FILESYSTEM_ROOT: DirectoryEntryMock;

export class EntryMock implements Entry {
  public isFile: boolean;

  public isDirectory: boolean;

  public name: string;

  public fullPath: string;

  public filesystem: FileSystem;

  constructor({ isFile, name, fullPath }: { isFile: boolean; name: string; fullPath: string }) {
    this.isFile = isFile;
    this.isDirectory = !isFile;
    this.name = name;
    this.fullPath = fullPath;
    this.filesystem = {
      name: 'mockFileSystem',
      root: MOCK_FILESYSTEM_ROOT
    };
  }

  public getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method public not implemented.');
  }

  public moveTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }

  public copyTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }

  public toURL(): string {
    throw new Error('Method not implemented.');
  }

  public remove(successCallback: VoidCallback, errorCallback?: ErrorCallback | undefined): void {
    throw new Error('Method not implemented.');
  }

  public getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }

}

export class DirectoryEntryMock extends EntryMock implements DirectoryEntry {

  public entries: EntryMock[];

  public lastReader?: DirectoryReaderMock;

  constructor({ name, fullPath, childrenEntries }: { name: string; fullPath: string, childrenEntries?: EntryMock[] }) {
    super({ isFile: false, name, fullPath });
    this.entries = childrenEntries || [];
  }

  public createReader(): DirectoryReader {
    this.lastReader = new DirectoryReaderMock(this.entries);
    return this.lastReader;
  }

  public getFile(
    path: string,
    options?: Flags | undefined,
    successCallback?: FileEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }

  public getDirectory(
    path: string,
    options?: Flags | undefined,
    successCallback?: DirectoryEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }

  public removeRecursively(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }
}

export class FileEntryMock extends EntryMock implements FileEntry {
  constructor({ name, fullPath }: { name: string; fullPath: string }) {
    super({ isFile: true, name, fullPath });
  }

  public createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error('Method not implemented.');
  }
  public file(successCallback: FileCallback, errorCallback?: ErrorCallback | undefined): void {
    throw new Error('Method not implemented.');
  }
}

export class DirectoryReaderMock implements DirectoryReader {

  public static MAX_BATCH_SIZE: number = 2; // used to simulate the "batch" read of #readEntries

  public batchCount: number;

  private entries: EntryMock[];


  constructor(entries: EntryMock[]) {
    this.entries = entries;
    this.batchCount = 0;
  }

  public readEntries(successCallback: EntriesCallback, errorCallback?: ErrorCallback | undefined): void {
    const max = DirectoryReaderMock.MAX_BATCH_SIZE;
    setTimeout(() => {
      const nextBatch = this.entries.slice(0, max);
      const entriesLeft = this.entries.slice(max);
      successCallback(nextBatch);
      if (nextBatch.length !== 0) {
        this.batchCount += 1;
      }
      if (nextBatch.length < max) {
        this.entries = [];
      } else {
        this.entries = entriesLeft;
      }
    }, 1);
  }

}

MOCK_FILESYSTEM_ROOT = new DirectoryEntryMock({
  fullPath: '/mockFileSystem',
  name: 'mockFileSystem'
});
