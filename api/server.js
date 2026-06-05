// Vercel serverless function wrapper for Express app
import { app } from "../dist/index.js";

// Wait for async initialization (route registration) to complete
if (!globalThis.__appReady) {
  await new Promise(resolve => {
    const check = () => {
      if (globalThis.__appReady) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

export default app;
