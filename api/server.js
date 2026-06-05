// Vercel serverless function wrapper for Express app
import { app } from "../dist/index.js";

// Wait for async initialization (route registration) to complete
if (!(globalThis as any).__appReady) {
  await new Promise(resolve => {
    const check = () => {
      if ((globalThis as any).__appReady) {
        resolve(undefined);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

export default app;
