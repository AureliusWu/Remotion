// Units: hundred million people (亿人). The final observation is a lower bound.
// Full provenance, dates and comparability notes live in docs/CHINA-GENAI-SOURCES.md.
export const researchDate = "2026-10-29";
export const milestones = [
  { period: "2024.06", people: 2.3, label: "2.3", lowerBound: false },
  { period: "2024.12", people: 2.49, label: "2.49", lowerBound: false },
  { period: "2025.06", people: 5.15, label: "5.15", lowerBound: false },
  { period: "2025.12", people: 6.02, label: "6.02", lowerBound: false },
  { period: "2026上半年", people: 7, label: ">7", lowerBound: true },
] as const;
export const applications = [
  { label: "回答问题", percent: 76, display: "76.0", code: "Q&A" },
  { label: "处理图片 / 视频", percent: 47.8, display: "47.8", code: "VISUAL" },
  { label: "处理文本", percent: 37.6, display: "37.6", code: "TEXT" },
  { label: "总结 / 纪要 / PPT", percent: 32.5, display: "32.5", code: "WORK" },
] as const;
export const sourceLinks = {
  jun2024: "https://www.cnnic.cn/n4/2024/1216/c88-11196.html",
  dec2024: "https://www.cnnic.cn/n4/2025/0117/c88-11229.html",
  latest: "https://www.cnnic.cn/n4/2026/1008/c88-11704.html",
  dec2025: "https://www.cnnic.ac.cn/n4/2026/0304/c88-11549.html",
  jun2025: "https://www.cnnic.cn/n4/2025/1020/c326-11389.html",
} as const;
