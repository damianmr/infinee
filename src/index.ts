import toBuffer from 'blob-to-buffer';
import { getDialogsTable, getText, IPopulatedDialogsTable } from './infTlk';

const byId = (id: string): HTMLElement => {
  const e = document.getElementById(id);
  if (!e) {
    throw new Error(`Invalid DOM id "${id}"`);
  }
  return e;
};

document.addEventListener('DOMContentLoaded', (event) => {
  const dialogsFileInput = byId('dialogsFile');
  dialogsFileInput.addEventListener('change', (e: any) => {
    const dialogsFile: File = e.srcElement.files[0];
    toBuffer(dialogsFile, (err, buffer: Buffer) => {
      getDialogsTable(buffer).then((dialogs: IPopulatedDialogsTable) => {
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
});
