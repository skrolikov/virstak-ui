import { defineConfig } from "vite";

export default defineConfig({
  build: { target: ["es2020", "chrome87", "edge88", "firefox78", "safari14"] },
});
