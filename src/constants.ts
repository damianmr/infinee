export type LanguageCode = 'en_US' | 'es_ES';

export const Language: { [id: string]: LanguageCode } = {
  EnglishUS: 'en_US'
};

export const LANG_FOLDER_REGEX = /^\w{2}_\w{2}$/;
