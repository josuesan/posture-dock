import type { AuthUser } from '@/domain/auth/types';
import { messages } from '@/translations';
import { Button } from '@/ui/components/ui/button';
import { Panel } from '@/ui/components/ui/panel';
import { Badge } from '@/ui/components/ui/badge';

interface AuthPanelProps {
  authAvailable: boolean;
  user: AuthUser | null;
  email: string;
  isBusy: boolean;
  message: string;
  busyLabel: string;
  canResend: boolean;
  onEmailChange: (email: string) => void;
  onSignIn: () => void;
  onResend: () => void;
  onSignOut: () => void;
}

export function AuthPanel({
  authAvailable,
  user,
  email,
  isBusy,
  message,
  busyLabel,
  canResend,
  onEmailChange,
  onSignIn,
  onResend,
  onSignOut
}: AuthPanelProps) {
  return (
    <Panel className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
            {messages.auth.label}
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {messages.auth.title}
          </h2>
        </div>
        {isBusy ? <Badge tone="neutral">{busyLabel}</Badge> : null}
      </div>

      {!authAvailable ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <strong className="block text-sm text-ink">
            {messages.auth.unavailableTitle}
          </strong>
          <p className="mt-2 text-sm leading-7 text-mist">
            {messages.auth.unavailableCopy}
          </p>
        </div>
      ) : user ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div>
            <strong className="block text-sm text-ink">
              {user.email ?? messages.auth.authenticatedFallback}
            </strong>
            <p className="mt-2 text-sm leading-7 text-mist">
              {messages.auth.authenticatedCopy}
            </p>
          </div>
          <Button onClick={onSignOut}>{messages.auth.signOut}</Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="grid gap-2">
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-mist">
              {messages.auth.emailLabel}
            </span>
            <input
              className="min-h-11 rounded-2xl border border-white/10 bg-ocean-950/70 px-4 text-sm text-ink outline-none transition placeholder:text-mist/70 focus:border-teal-300/40"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={messages.auth.emailPlaceholder}
              type="email"
              value={email}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button disabled={isBusy || !email} onClick={onSignIn} variant="primary">
              {messages.auth.sendMagicLink}
            </Button>
            <Button disabled={isBusy || !canResend} onClick={onResend}>
              {messages.auth.resendMagicLink}
            </Button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="text-sm leading-7 text-mist">
        {message}
      </p>
    </Panel>
  );
}
