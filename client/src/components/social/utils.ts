// utils
// Part of SMP-Updates refactor — see docs/ADR-001-social-media-component-architecture.md
// TODO: Extract from PortalSocialMedia.tsx / SocialMediaPage.tsx

export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

export function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}
