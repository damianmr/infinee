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
  constructor({ name, fullPath }: { name: string; fullPath: string }) {
    super({ isFile: false, name, fullPath });
  }

  public createReader(): DirectoryReader {
    throw new Error('Method not implemented.');
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

  public createWriter(successCallback: FileWriterCallback, errorCallback?: ErrorCallback | undefined): void {
    throw new Error("Method not implemented.");
  }
  public file(successCallback: FileCallback, errorCallback?: ErrorCallback | undefined): void {
    throw new Error("Method not implemented.");
  }
}

MOCK_FILESYSTEM_ROOT = new DirectoryEntryMock({
  fullPath: '/mockFileSystem',
  name: 'mockFileSystemRoot'
});

