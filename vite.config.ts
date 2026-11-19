import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Preserve the Vite 6 browser syntax targets during the bundler migration.
    target: ["es2020", "chrome87", "edge88", "firefox78", "safari14"],
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
      cssFileName: "components",
    },
    rolldownOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "lucide-react",
        "@tanstack/react-table",
      ],
    },
  },
  plugins: [
    {
      name: "component-css-import",
      renderChunk(code, chunk) {
        if (chunk.isEntry)
          return { code: 'import "./components.css";\n' + code, map: null };
      },
    },
  ],
});
