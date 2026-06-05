/**
 * NotificationPreferencesPanel — UI for managing approval email notification settings
 * 
 * Allows users to:
 * - Toggle email notifications per event type
 * - Set notification email address
 * - Toggle in-app notifications
 * 
 * P3-B009
 */

import { useState } from 'react';
import { Bell, Mail, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
} from '@/hooks/social/use-approval-notification';

// ─── Types ──────────────────────────────────────────────────────────

type ApiMode = 'portal' | 'admin';

interface NotificationPreferencesPanelProps {
  mode: ApiMode;
}

// ─── Component ──────────────────────────────────────────────────────

export function NotificationPreferencesPanel({ mode }: NotificationPreferencesPanelProps) {
  const { preferences, isLoading } = useNotificationPreferences(mode);
  const updatePrefs = useUpdateNotificationPreferences(mode);
  const [emailInput, setEmailInput] = useState('');
  const [emailDirty, setEmailDirty] = useState(false);

  const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
    updatePrefs.mutate({ [field]: value });
  };

  const handleEmailSave = () => {
    updatePrefs.mutate({ emailAddress: emailInput || null });
    setEmailDirty(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how you receive notifications about approval workflow events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Address */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notification Email
          </Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={emailDirty ? emailInput : (preferences.emailAddress || '')}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailDirty(true);
              }}
              className="flex-1"
            />
            {emailDirty && (
              <Button
                size="sm"
                onClick={handleEmailSave}
                disabled={updatePrefs.isPending}
              >
                {updatePrefs.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Email address where approval notifications will be sent
          </p>
        </div>

        <Separator />

        {/* Email Notification Toggles */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email Notifications
          </Label>

          <div className="space-y-3">
            <NotificationToggle
              label="Approval Requests"
              description="Receive an email when a post is submitted for your approval"
              checked={preferences.emailOnApprovalRequest}
              onToggle={(v) => handleToggle('emailOnApprovalRequest', v)}
              disabled={updatePrefs.isPending}
            />

            <NotificationToggle
              label="Approval Responses"
              description="Receive an email when your post is approved or rejected"
              checked={preferences.emailOnApprovalResponse}
              onToggle={(v) => handleToggle('emailOnApprovalResponse', v)}
              disabled={updatePrefs.isPending}
            />

            <NotificationToggle
              label="Changes Requested"
              description="Receive an email when an approver requests changes to your post"
              checked={preferences.emailOnChangesRequested}
              onToggle={(v) => handleToggle('emailOnChangesRequested', v)}
              disabled={updatePrefs.isPending}
            />
          </div>
        </div>

        <Separator />

        {/* In-App Notifications */}
        <NotificationToggle
          label="In-App Notifications"
          description="Show notification badges and alerts within the application"
          checked={preferences.inAppNotifications}
          onToggle={(v) => handleToggle('inAppNotifications', v)}
          disabled={updatePrefs.isPending}
        />
      </CardContent>
    </Card>
  );
}

// ─── Toggle Row Component ───────────────────────────────────────────

function NotificationToggle({
  label,
  description,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

export default NotificationPreferencesPanel;
