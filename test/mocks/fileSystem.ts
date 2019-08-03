/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Mock FileSystem API implementation.
 *
 * For the most part, these classes only implement the methods of their corresponding interfaces
 * using just empty functions that raise an exception when called.
 *
 * The only methods/properties that are implemented are the ones that are needed to properly
 * test the methods/functions related to loading of directories in JavaScript. As most of these
 * functions make use of APIs that are only present in browser environments and which are not
 * accessible from a programmer perspective (for instance, is not possible to create a new
 * FileEntry instance, or a new File instance, and so on), these mock classes allow to create
 * dummy implementations that behave more or less like the real ones.
 *
 * One example of this behavior would be the use-flow of dropping a game folder into the browser.
 * This action makes the browser create a DirectoryEntry which in turns will provide methods for
 * reading the files and directories in that dropped folder. As these instances cannot be created
 * in a test environment, we mimick their behavior by creating a DirectoryEntryMock, populating it
 * with mock files and directories and then provide a simple implementation of the methods that
 * allow the reading of those.
 */

export class DirectoryReaderMock implements DirectoryReader {
  /**  used to simulate the "batch" read of #readEntries */
  public static MAX_BATCH_SIZE: number = 2;

  /**
   * Keeps track of how many batches were returned during the iteration over the entries.
   * Only needed to assert on this value and check that code making use of #readEntries method
   * is properly iterating enough times to get all the entries in the reader.
   */
  public batchCount: number;

  private entries: EntryMock[];

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(entries: EntryMock[]) {
    this.entries = entries;
    this.batchCount = 0;
  }

  /**
   * Mock implementation of readEntries.
   *
   * The real one returns entries in batches, whose size is, as the time of writting this commment, limited
   * to 100 entries. As this size is a bit inconvenient to test (I would need to create more than 100 mock
   * entries) I defined the size of these batches in a constant. User of this API should
   * not see their code affected by this.
   */
  public readEntries(
    successCallback: EntriesCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
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

export class EntryMock implements Entry {
  public isFile: boolean;

  public isDirectory: boolean;

  public name: string;

  public fullPath: string;

  public filesystem: FileSystem;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor({ isFile, name, fullPath }: { isFile: boolean; name: string; fullPath: string }) {
    this.isFile = isFile;
    this.isDirectory = !isFile;
    this.name = name;
    this.fullPath = fullPath;
    this.filesystem = {
      name: 'mockFileSystem',
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

  /**
   * Keeps track of the last returned DirectoryReader. Only needed
   * to have access to that instance and run assertions on it.
   *
   * Not present in the real API.
   */
  public lastReader?: DirectoryReaderMock;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor({
    name,
    fullPath,
    childrenEntries
  }: {
    name: string;
    fullPath: string;
    childrenEntries?: EntryMock[];
  }) {
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

export const MOCK_FILESYSTEM_ROOT: DirectoryEntryMock = new DirectoryEntryMock({
  fullPath: '/mockFileSystem',
  name: 'mockFileSystem'
});

export class FileMock implements File {
  public lastModified: number;
  public name: string;
  public size: number;
  public type: string;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(name: string) {
    this.name = name;
    this.lastModified = Date.now();
    this.size = 1;
    this.type = 'mock';
  }

  public slice(
    start?: number | undefined,
    end?: number | undefined,
    contentType?: string | undefined
  ): Blob {
    throw new Error('Method not implemented.');
  }
}

export class FileEntryMock extends EntryMock implements FileEntry {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
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
    setTimeout(() => {
      successCallback(new FileMock(this.fullPath));
    }, 1);
  }
}
