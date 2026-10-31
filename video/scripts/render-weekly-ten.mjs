// Compatibility entry; all new render logic lives in render-news.mjs.
process.argv.splice(2, 0, "--edition", "weekly-ten");
await import("./render-news.mjs");
