import { SmartBuffer } from 'smart-buffer';
import { unpad } from '../util/legacyFilenamePadding';
import { BifIndex, EntityFileEntry } from './infBifFile';

export type ItemDefinition = {
  signature: string;
  version: string;
  // tslint:disable-next-line:object-literal-sort-keys
  genericItemName: number;
  identifiedItemName: number;
  usedUpItem: string;
  typeFlags: number;
  category: number;
  usability: number;
  invBAMResourceIndex: string; // animation
  minLevel: number;
  minStrength: number;
  minStrengthBonus: number;
  minIntelligence: number;
  minDexterity: number;
  minWisdom: number;
  minConstitution: number;
  minCharisma: number;
  baseValue: number;
  maxStackable: number;
  itemIcon: string;
  lore: number;
  groundIcon: string;
  baseWeight: number;
  itemDescriptionGeneric: number;
  itemDescriptionIdentified: number;
  carrieddIcon: string;
  enchantment: number;
  abilityOffset: number;
  abilityCount: number;
  effectsOffset: number;
  unknown: number;
  globalEffects: number;
};

export function parseItemEntry(
  index: BifIndex,
  itemEntry: EntityFileEntry
): Promise<ItemDefinition> {
  return new Promise((resolve) => {
    index._buffer.readOffset = itemEntry.offset;
    const b = index._buffer;

    const itemDef: ItemDefinition = {
      signature: b.readString(4),
      version: b.readString(4),
      // tslint:disable-next-line:object-literal-sort-keys
      genericItemName: b.readUInt32LE(),
      identifiedItemName: b.readUInt32LE(),
      usedUpItem: unpad(b.readString(8)), // "replacement item"
      typeFlags: b.readUInt32LE(),
      category: b.readUInt16LE(),
      usability: b.readUInt32LE(),
      invBAMResourceIndex: b.readString(2), // animation
      minLevel: b.readUInt16LE(),
      minStrength: b.readUInt16LE(),
      minStrengthBonus: b.readUInt16LE(),
      minIntelligence: b.readUInt16LE(),
      minDexterity: b.readUInt16LE(),
      minWisdom: b.readUInt16LE(),
      minConstitution: b.readUInt16LE(),
      minCharisma: b.readUInt16LE(),
      baseValue: b.readUInt32LE(),
      maxStackable: b.readUInt16LE(),
      itemIcon: unpad(b.readString(8)),
      lore: b.readUInt16LE(),
      groundIcon: unpad(b.readString(8)),
      baseWeight: b.readUInt32LE(),
      itemDescriptionGeneric: b.readUInt32LE(),
      itemDescriptionIdentified: b.readUInt32LE(),
      carrieddIcon: unpad(b.readString(8)),
      enchantment: b.readUInt32LE(),
      abilityOffset: b.readUInt32LE(),
      abilityCount: b.readUInt16LE(),
      effectsOffset: b.readUInt32LE(),
      unknown: b.readUInt16LE(),
      globalEffects: b.readUInt16LE()
    };

    resolve(itemDef);
  });
}
