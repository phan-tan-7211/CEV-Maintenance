import { en } from './en';
import { ko } from './ko';
import { vi } from './vi';

export type Locale = 'vi' | 'en' | 'ko';

export const dictionaries = { vi, en, ko } as const;

export function getMessages(locale: Locale) {
  return dictionaries[locale];
}
