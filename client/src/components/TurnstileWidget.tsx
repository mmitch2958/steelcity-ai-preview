import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
  className?: string;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return;
    
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onVerify,
      "error-callback": onError,
      "expired-callback": onExpire,
      theme,
      size,
    });
  }, [onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener("load", renderWidget);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [renderWidget]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className={className} data-testid="turnstile-widget" />;
}

export function useTurnstile() {
  const reset = useCallback((widgetId: string) => {
    if (window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, []);

  return { reset, isConfigured: !!TURNSTILE_SITE_KEY };
}
