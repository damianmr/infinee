// import { ItemDefinition } from './bif/item';
import {
  BifIndex,
  getEntityEntry,
  getFilesIndex as getFilesIndexInBIF,
  getItem
} from './bif/infBifFile';
import { ItemDefinition } from './bif/item';
import { FlatDirectoryStructure } from './directory';
import { getBif, getGameIndexFile, loadGameFolder, SupportedGameFolders } from './gameDirectory';
import {
  BifEntry,
  findBifForResource,
  findResourceInfo,
  GameResourceIndex,
  getAllResources,
  getAllResourcesByType,
  getGameResourceIndex,
  IndexableResourceTypes,
  ResourceInfo,
  ResourceTypeID,
  toResourceType
} from './infKey';
import t from './intl';
// tslint:disable:no-console

let gameDir: FlatDirectoryStructure;
let gi: GameResourceIndex;

const byId = (id: string): HTMLElement => {
  const e = document.getElementById(id);
  if (!e) {
    throw new Error(`Invalid DOM id "${id}"`);
  }
  return e;
};

const templ = (
  templateId: string,
  targetEl: HTMLElement,
  ctx: { [id: string]: string | number | { toString: () => string } },
  append?: boolean
) => {
  const templateStr: string = byId(templateId).innerHTML;
  let t = templateStr;
  for (const key of Object.keys(ctx)) {
    t = t.replace(`{${key}}`, ctx[key] as string);
  }
  if (append) {
    const newEl = document.createElement('div');
    newEl.innerHTML = t;
    targetEl.appendChild(newEl.firstChild as Node);
  } else {
    targetEl.innerHTML = t;
  }
};

document.addEventListener('DOMContentLoaded', handleDropsInFolderArea);
document.addEventListener('DOMContentLoaded', handleChangeInSelects);

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

    templ('resOptTempl', byId('resourceType'), { value: -1000, name: 'Pick one' });
    templ('resOptTempl', byId('resourceName'), { value: -1000, name: 'Pick one' });

    gameDir = await loadGameFolder(SupportedGameFolders.BG2EE(items[0].webkitGetAsEntry()));
    // console.log('gameDir', gameDir);
    getGameIndexFile(gameDir)
      .then(getGameResourceIndex)
      .then((gameIndex: GameResourceIndex) => {
        gi = gameIndex;
        return getAllResources(gameIndex);
      })
      .then((resources: ResourceInfo[]) => {
        for (const type of IndexableResourceTypes) {
          const rType = t(`resourceType.${type}`);
          templ(
            'resOptTempl',
            byId('resourceType'),
            { value: type, name: `${rType} (Type: ${type})` },
            true
          );
        }
      });
  });
}

function handleChangeInSelects() {
  byId('resourceType').addEventListener('change', (e) => {
    const resourceType: ResourceTypeID = toResourceType((e.currentTarget as HTMLFormElement).value);
    const resInfos: ResourceInfo[] = getAllResourcesByType(gi, resourceType);
    templ('resOptTempl', byId('resourceName'), { value: -1000, name: 'Pick one' });
    for (const resInfo of resInfos) {
      templ(
        'resOptTempl',
        byId('resourceName'),
        { value: resInfo.name, name: `${resInfo.name}` },
        true
      );
    }
  });

  byId('resourceName').addEventListener('change', (e) => {
    const resType = toResourceType((byId('resourceType') as HTMLFormElement).value);
    const resName = (e.currentTarget as HTMLFormElement).value;

    const resourceInfo: ResourceInfo = findResourceInfo(gi, resName, resType);
    if (resourceInfo.resourceType === ResourceTypeID.ITM) {
      const itemBif: BifEntry = findBifForResource(gi, resourceInfo);
      getBif(gameDir, itemBif)
        .then((buffer: Buffer) => getFilesIndexInBIF(buffer, itemBif.fileName))
        .then((index: BifIndex) => getItem(index, resourceInfo))
        .then((itemDef: ItemDefinition) => Promise.resolve(itemDef.itemIcon))
        .then((itemIcon: string) =>
          Promise.resolve(
            getAllResourcesByType(gi, ResourceTypeID.BAM).find((b) => b.name === itemIcon)
          )
        )
        .then((resInfo: ResourceInfo | undefined) => {
          console.log('Icon for this ITEM can be located with this ResourceInfo: ', resInfo);
        });
    }
  });
}
