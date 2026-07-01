import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // Ensure relative paths for assets inside Logseq
  build: {
    target: "esnext",
    minify: false, // Turn off minification for easier debugging inside Logseq
    sourcemap: false,
    outDir: "dist", // Keep output directory as dist to match package.json main entry
  },
});
