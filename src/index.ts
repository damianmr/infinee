import toBuffer from 'blob-to-buffer';
import { GameFilesMatcher, loadGameFolder } from './folder';
import { getDialogsTable, getText, PopulatedDialogsTable } from './infTlk';

// tslint:disable:no-console

const byId = (id: string): HTMLElement => {
  const e = document.getElementById(id);
  if (!e) {
    throw new Error(`Invalid DOM id "${id}"`);
  }
  return e;
};

document.addEventListener('DOMContentLoaded', handleDialogsInputChange);
document.addEventListener('DOMContentLoaded', handleDropsInFolderArea);

function handleDialogsInputChange() {
  const dialogsFileInput = byId('dialogsFile');
  dialogsFileInput.addEventListener('change', (e: any) => {
    const dialogsFile: File = e.srcElement.files[0];
    toBuffer(dialogsFile, (err, buffer: Buffer) => {
      getDialogsTable(buffer).then((dialogs: PopulatedDialogsTable) => {
        const contents: HTMLElement = byId('contents');
        contents.append(getText(dialogs, 1).replace('\n', '<br/>'));
        contents.append(' ||| ');
        contents.append(getText(dialogs, 10).replace('\n', '<br/>'));
        contents.append(' ||| ');
        contents.append(getText(dialogs, 100).replace('\n', '<br/>'));
        contents.append(' ||| ');
        contents.append(getText(dialogs, 1000).replace('\n', '<br/>'));
      });
    });
  });
}

function handleDropsInFolderArea() {
  const dropArea = byId('folderDropArea');
  const highlight = () => {
    dropArea.style.backgroundColor = 'lightblue';
  };
  const unhighlight = () => {
    dropArea.style.backgroundColor = 'transparent';
  };
  const preventDefaults: EventListener = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults);
  });

  ['dragenter', 'dragover'].forEach((eventName: string) => {
    dropArea.addEventListener(eventName, highlight);
  });

  ['dragleave', 'drop'].forEach((eventName: string) => {
    dropArea.addEventListener(eventName, unhighlight);
  });

  dropArea.addEventListener('drop', async (ev: DragEvent) => {
    if (!ev.dataTransfer) {
      return;
    }
    const items: DataTransferItemList = ev.dataTransfer.items;
    if (items.length > 1) {
      console.log('Only drop your BG2:EE folder');
      return;
    }
    const droppedItem: Entry = items[0].webkitGetAsEntry();
    if (!droppedItem.isDirectory) {
      console.log('Only your BG2:EE folder is supported');
      return;
    }
    const listEl = document.createElement('ul');
    byId('dirContents').style.display = 'block';
    byId('dirContents').innerHTML = '';
    byId('dirContents').appendChild(listEl);
    processFolder(droppedItem as DirectoryEntry, listEl);

    // const tree = await buildDirectoryStructure(droppedItem as DirectoryEntry);
    // const treeFiles = await createFilePointers(tree);
    console.log('Building game folder dir structure...');
    loadGameFolder(ev.dataTransfer.items, GameFilesMatcher.BG2EE).then(console.log);
  });

  let lastFile: FileEntry;

  const processFolder = (directory: DirectoryEntry, parentList: HTMLElement) => {
    const reader = directory.createReader();
    const readSomeEntries = () => {
      reader.readEntries(
        (directoryEntries) => {
          if (directoryEntries.length === 0) {
            return;
          }
          for (const entry of directoryEntries) {
            const nameEl = document.createElement('li');
            nameEl.innerHTML = `${entry.name} (${entry.fullPath})`;
            parentList.appendChild(nameEl);
            if (entry.isDirectory) {
              const listEl = document.createElement('ul');
              nameEl.appendChild(listEl);
              processFolder(entry as DirectoryEntry, listEl);
            } else {
              lastFile = entry as FileEntry;
            }
          }
          readSomeEntries();
        },
        (err) => {
          console.error('Uknown error reading entries', err);
        }
      );
    };
    readSomeEntries();
  };
}
