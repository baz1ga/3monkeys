import { createI18n } from 'vue-i18n';
import fr from '../locales/fr.json';
import en from '../locales/en.json';

const saved = localStorage.getItem('lang');
const browser = (navigator.language || 'fr').slice(0, 2).toLowerCase();
const initialLocale = saved === 'en' || saved === 'fr' ? saved : (browser === 'en' ? 'en' : 'fr');

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'fr',
  messages: { fr, en }
});

export function setLocale(locale: 'fr' | 'en') {
  i18n.global.locale.value = locale;
  localStorage.setItem('lang', locale);
}
