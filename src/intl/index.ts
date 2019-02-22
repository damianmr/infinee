import { LanguageCode } from '../constants';
import en_US from './locales/en_US';

let locale: LanguageCode = 'en_US';

const i18n: { [id: string]: any } = {
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
