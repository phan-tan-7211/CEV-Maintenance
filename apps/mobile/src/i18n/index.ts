import { en } from './en';
import { vi } from './vi';

export type Locale = 'vi' | 'en';

export const dictionaries = { vi, en } as const;

export function getMessages(locale: Locale) {
  return dictionaries[locale];
}
