export const themes = {
  light: {
    logo: require('../app/assets/icons/decibella.png') as number,
    colors: {
      background: "#FEFAEE",
      text: "#4A4A4A",
      primary: "#F0923A",
      border: "#000",
    },
    typography: {
      fontFamily: "DM Sans",
      headingWeight: "700",
      bodyWeight: "500",
      scale: 1,
    },
  },

  dark: {
    logo: require('../app/assets/icons/decibella_dark.png') as number,
    colors: {
      background: "#4A4A4A",
      text: "#FEFAEE",
      primary: "#F0923A",
      border: "#fff"
    },
    typography: {
      fontFamily: "DM Sans",
      headingWeight: "700",
      bodyWeight: "500",
      scale: 1,
    },
  },
};

export default themes;