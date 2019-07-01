import { LanguageCode } from '../constants';
// eslint-disable-next-line @typescript-eslint/camelcase
import en_US from './locales/en_US';

let locale: LanguageCode = 'en_US';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const i18n: { [id: string]: any } = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  en_US
};

export function setLocale(newLocale: LanguageCode) {
  locale = newLocale;
}

export default function t(i18nKeyPath: string) {
  const path: string[] = i18nKeyPath.split('.');

  let target = i18n[locale];

  for (const part of path) {
    if (target[part]) {
      target = target[part];
    } else {
      throw new Error(`Translation not found "${i18nKeyPath}" using locale "${locale}"`);
    }
  }

  if (typeof target !== 'string') {
    throw new Error(`Translation "${i18nKeyPath}" in local "${locale}" is not a string."`);
  }

  return target;
}
