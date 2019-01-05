import { SmartBuffer } from 'smart-buffer';
import { BifIndex, EntityFileEntry } from './infBifFile';

export type SpellDefinition = {
  signature: string;
  version: string;
  genericSpellName: number; // tslint:disable-line:object-literal-sort-keys
  identifiedSpellName: number;
  castSoundRef: string;
  dwUnknown: number;
  category: number;
  usability: number;
  wUnknown2: number;
  minLevel: number;
  minStrength: number;
  minStrengthBonus: number;
  minIntelligence: number;
  minDexterity: number;
  minWisdom: number;
  minConstitution: number;
  minCharisma: number;
  spellLevel: number;
  wUnknown3: number;
  spellIcon: string;
  wUnknown4: number;
  chUnknown: string;
  dwUnknown3: number;
  spellDescriptionGeneric: number;
  spellDescriptionIdentified: number;
  chUnknown2: string;
  dwUnknown4: number;
  abilityOffset: number;
  abilityCount: number;
  effectsOffset: number;
  wUnknown5: number;
  globalEffects: number;
};

export function parseSpellEntry(index: BifIndex, spellEntry: EntityFileEntry): Promise<SpellDefinition> {
  return new Promise((resolve) => {
    index._buffer.readOffset = spellEntry.offset;
    const b = index._buffer;

    const spellDef = {
      signature: b.readString(4),
      version: b.readString(4),
      genericSpellName: b.readUInt32LE(), // tslint:disable-line:object-literal-sort-keys
      identifiedSpellName: b.readUInt32LE(),
      castSoundRef: b.readString(8),
      dwUnknown: b.readUInt32LE(),
      category: b.readUInt16LE(),
      usability: b.readUInt32LE(),
      wUnknown2: b.readUInt16LE(),
      minLevel: b.readUInt16LE(),
      minStrength: b.readUInt16LE(),
      minStrengthBonus: b.readUInt16LE(),
      minIntelligence: b.readUInt16LE(),
      minDexterity: b.readUInt16LE(),
      minWisdom: b.readUInt16LE(),
      minConstitution: b.readUInt16LE(),
      minCharisma: b.readUInt16LE(),
      spellLevel: b.readUInt32LE(),
      wUnknown3: b.readUInt16LE(),
      spellIcon: b.readString(8),
      wUnknown4: b.readUInt16LE(),
      chUnknown: b.readString(8),
      dwUnknown3: b.readUInt32LE(),
      spellDescriptionGeneric: b.readUInt32LE(),
      spellDescriptionIdentified: b.readUInt32LE(),
      chUnknown2: b.readString(8),
      dwUnknown4: b.readUInt32LE(),
      abilityOffset: b.readUInt32LE(),
      abilityCount: b.readUInt16LE(),
      effectsOffset: b.readUInt32LE(),
      wUnknown5: b.readUInt16LE(),
      globalEffects: b.readUInt16LE()
    };

    resolve(spellDef);
  });
}
