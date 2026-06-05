interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn("[Turnstile] Secret key not configured, skipping verification");
    return true;
  }

  if (!token) {
    console.warn("[Turnstile] No token provided");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const result: TurnstileVerifyResponse = await response.json();
    
    if (!result.success) {
      console.warn("[Turnstile] Verification failed:", result["error-codes"]);
    }

    return result.success;
  } catch (error) {
    console.error("[Turnstile] Verification error:", error);
    return false;
  }
}
