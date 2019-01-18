import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {
  buildDirectoryStructure,
  createFilePointers,
  FlatDirectoryStructure,
  FlatDirectoryStructureAsEntries,
  readDirContents,
} from '../src/directory';
import {
  DirectoryEntryMock,
  DirectoryReaderMock,
  EntryMock,
  FileEntryMock,
  FileMock,
  MOCK_FILESYSTEM_ROOT
} from './mocks/fileSystem';
import { mockDirStruct } from './mocks/fileSystemUtil';

chai.use(chaiAsPromised);

describe('directory.ts', () => {

  describe('readDirContents function', () => {
    it('properly returns a promise with all the entries in a given DirectoryEntry', (done) => {
      const mockFolder = mockDirStruct('Test Mock Folder', [
        'entry1.gif',
        'subfolderVisible/thisEntryIsInvisible.jpg', // only 'subfolderVisible' should be read
        'subfolderVisible/thisFolderIsInvisible',
        'visible.jpg'
      ]);
      readDirContents(mockFolder).then(({ entries, directory }) => {
        expect(entries.length).to.be.equal(3);
        expect(entries[0].name).to.be.eql('entry1.gif');
        expect(entries[1].name).to.be.eql('subfolderVisible');
        expect(entries[2].name).to.be.eql('visible.jpg');
        done();
      });
    });

    it('reads in batchs, but returns only when the read is complete', (done) => {
      const mockFolder = mockDirStruct('Test Mock Folder', [
        'entry1.gif',
        'subfolder1',
        'subfolder2',
        'entry2.jpg',
        'entry3.png'
      ]);
      readDirContents(mockFolder).then(({ entries, directory }) => {
        expect(entries.length).to.be.equal(5);
        expect(entries[0].name).to.be.eql('entry1.gif');
        expect(entries[1].name).to.be.eql('subfolder1');
        expect(entries[2].name).to.be.eql('subfolder2');
        expect(entries[3].name).to.be.eql('entry2.jpg');
        expect(entries[4].name).to.be.eql('entry3.png');
        expect(mockFolder.lastReader && mockFolder.lastReader.batchCount).to.be.eql(
          Math.ceil(5 / DirectoryReaderMock.MAX_BATCH_SIZE)
        );
        done();
      });
    });
  });

  describe('buildDirectoryStructure', () => {
    it('builds a flat directory tree of a given directory structure', (done) => {
      const rootFolder = 'Test Mock Folder';
      const mockFolder = mockDirStruct(rootFolder, [
        'entry1.jpg',
        'subfolder1/subentry1.jpg',
        'subfolder1/subentry2.jpg',
        'subfolder2/subentry1.jpg',
        'subfolder2/subentry2.jpg',
        'subfolder3/sub-subfolder/entry.jpg',
        'entry3.jpg'
      ]);

      const path = (x: string) => `${mockFolder.fullPath}/${x}`;

      buildDirectoryStructure(mockFolder, (x: Entry) => true).then(
        (flatStruct: FlatDirectoryStructureAsEntries) => {
          expect(flatStruct[path('entry1.jpg')]).to.be.equal(mockFolder.entries[0]);

          expect(flatStruct[path('subfolder1/subentry1.jpg')]).to.be.equal(
            (mockFolder.entries[1] as DirectoryEntryMock).entries[0]
          );
          expect(flatStruct[path('subfolder1/subentry2.jpg')]).to.be.equal(
            (mockFolder.entries[1] as DirectoryEntryMock).entries[1]
          );

          expect(flatStruct[path('subfolder2/subentry1.jpg')]).to.be.equal(
            (mockFolder.entries[2] as DirectoryEntryMock).entries[0]
          );
          expect(flatStruct[path('subfolder2/subentry2.jpg')]).to.be.equal(
            (mockFolder.entries[2] as DirectoryEntryMock).entries[1]
          );

          expect(flatStruct[path('subfolder3/sub-subfolder/entry.jpg')]).to.be.equal(
            ((mockFolder.entries[3] as DirectoryEntryMock).entries[0] as DirectoryEntryMock)
              .entries[0]
          );

          expect(flatStruct[path('entry3.jpg')]).to.be.equal(mockFolder.entries[4]);
          done();
        }
      );
    });
  });

  describe('createFilePointers', () => {
    it('creates file pointers for all file entries in a directory', (done) => {
      const rootFolder = 'Test Mock Folder';
      const mockFolder = mockDirStruct(rootFolder, [
        'entry1.jpg',
        'subfolder1/subentry1.jpg',
        'subfolder2/subentry2-1.jpg'
      ]);

      const path = (x: string) => `${mockFolder.fullPath}/${x}`;

      buildDirectoryStructure(mockFolder, (x: Entry) => true)
        .then(createFilePointers)
        .then((dirStruct: FlatDirectoryStructure) => {
          let f = dirStruct[path('entry1.jpg')];
          expect(f instanceof FileMock).to.be.equal(true);
          expect(f.name).to.be.equal(path('entry1.jpg'));

          f = dirStruct[path('subfolder1/subentry1.jpg')];
          expect(f instanceof FileMock).to.be.equal(true);
          expect(f.name).to.be.equal(path('subfolder1/subentry1.jpg'));

          f = dirStruct[path('subfolder2/subentry2-1.jpg')];
          expect(f instanceof FileMock).to.be.equal(true);
          expect(f.name).to.be.equal(path('subfolder2/subentry2-1.jpg'));

          done();
        });
    });
  });

});
