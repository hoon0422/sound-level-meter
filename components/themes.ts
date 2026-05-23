export const themes = {
  light: {
    logo: require('../app/assets/icons/decibella.png') as number,
    colors: {
      background: '#FEFAEE',
      surface: '#FDFCFA',
      text: '#333333',
      mutedText: '#6B6459',
      primary: '#F0923A',
      border: '#333333',
      shadow: '#333333',
      divider: '#EDE9E4',
      inactive: '#AAAAAA',
      quiet: '#4CB522',
      moderate: '#FBBF24',
      loud: '#E23F3F',
      info: '#22D3EE',
    },
    typography: {
      fontFamily: 'DM Sans',
      headingWeight: '700',
      bodyWeight: '500',
      scale: 1,
    },
  },

  dark: {
    logo: require('../app/assets/icons/decibella_dark.png') as number,
    colors: {
      background: '#121212',
      surface: '#333333',
      text: '#FDFCFA',
      mutedText: '#AAAAAA',
      primary: '#F0923A',
      border: '#6B6459',
      shadow: '#000000',
      divider: '#6B6459',
      inactive: '#AAAAAA',
      quiet: '#4CB522',
      moderate: '#FBBF24',
      loud: '#E23F3F',
      info: '#22D3EE',
    },
    typography: {
      fontFamily: 'DM Sans',
      headingWeight: '700',
      bodyWeight: '500',
      scale: 1,
    },
  },
};

export default themes;
