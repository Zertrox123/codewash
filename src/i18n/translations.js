export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'fr'];

const translations = {
  en: {
    chrome: {
      enterFullscreen: 'Enter fullscreen',
      exitFullscreen: 'Exit fullscreen',
      languageLabel: 'Language',
    },
    settings: {
      title: 'Settings',
      selectFile: 'Select File',
      audioConfiguration: 'Audio Configuration',
      musicVolume: 'Music Volume',
      sfxVolume: 'SFX Volume',
      dangerZone: 'Danger Zone',
      deleteProfileProgress: 'Delete Profile Progress',
    },
    bugReport: {
      title: 'Discovered a bug?',
      subtitle: 'Whoa... That sucks...',
      close: 'Close',
    },
    loading: {
      title: 'Preparing your adventure...',
      profile: 'Loading profile',
      assets: 'Loading key assets',
      ready: 'Ready',
    },
  },
  fr: {
    chrome: {
      enterFullscreen: 'Passer en plein ecran',
      exitFullscreen: 'Quitter le plein ecran',
      languageLabel: 'Langue',
    },
    settings: {
      title: 'Parametres',
      selectFile: 'Choisir le profil',
      audioConfiguration: 'Configuration audio',
      musicVolume: 'Volume musique',
      sfxVolume: 'Volume effets',
      dangerZone: 'Zone dangereuse',
      deleteProfileProgress: 'Supprimer la progression du profil',
    },
    bugReport: {
      title: 'Tu as trouve un bug ?',
      subtitle: 'Oups... Ce n est pas ideal...',
      close: 'Fermer',
    },
    loading: {
      title: 'Preparation de ton aventure...',
      profile: 'Chargement du profil',
      assets: 'Chargement des ressources',
      ready: 'Pret',
    },
  },
};

export const resolveLocale = (value) => {
  if (!value) return DEFAULT_LOCALE;
  const short = value.toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(short) ? short : DEFAULT_LOCALE;
};

export const createTranslator = (locale) => {
  const dict = translations[resolveLocale(locale)] || translations[DEFAULT_LOCALE];
  return (key) => {
    const value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), dict);
    return typeof value === 'string' ? value : key;
  };
};
