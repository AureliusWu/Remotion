export const paletteFor = (chapterId: string) => {
  const paper = ["02", "03", "05", "07", "15"].includes(chapterId);
  return paper
    ? {
        paper,
        bg: "#eee9df",
        panel: "#e4ded2",
        ink: "#183b46",
        muted: "#576b70",
        line: "#b4c0b9",
        accent: "#af593e",
        secondary: "#287c79",
      }
    : {
        paper,
        bg: "#0d1d2c",
        panel: "#142c3c",
        ink: "#f2eee4",
        muted: "#a5bbc6",
        line: "#355361",
        accent: "#efb58a",
        secondary: "#79d3ca",
      };
};
export type Palette = ReturnType<typeof paletteFor>;
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
