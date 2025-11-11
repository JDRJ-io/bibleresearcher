import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X } from 'lucide-react';

function enc(s: string) { 
  return encodeURIComponent(s); 
}

interface SupportQuickContactProps {
  supportEmail?: string;
  userEmail?: string;
  userId?: string;
}

export default function SupportQuickContact({
  supportEmail = 'support@anointed.io',
  userEmail = '',
  userId = '',
}: SupportQuickContactProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState(userEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | 'ok' | 'err'>(null);
  
  const page = typeof window !== 'undefined' ? window.location.href : '';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const prelaunch = import.meta.env.VITE_SUPPORT_PRELAUNCH_MODE === 'true';

  const subject = useMemo(() => `Anointed.io Beta Feedback`, []);
  const defaultBody = useMemo(() => (
    `Hi Anointed.io team,%0D%0A%0D%0A` +
    `Feedback: (please write here) %0D%0A%0D%0A` +
    `— Page: ${enc(page)}%0D%0A` +
    `— User ID: ${enc(userId || 'anonymous')}%0D%0A` +
    `— Agent: ${enc(ua)}`
  ), [page, userId, ua]);

  const mailtoHref = `mailto:${supportEmail}?subject=${enc(subject)}&body=${defaultBody}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(supportEmail)}&su=${enc(subject)}&body=${defaultBody}`;
  const outlookHref = `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(supportEmail)}&subject=${enc(subject)}&body=${defaultBody}`;

  async function submitInline() {
    if (!message.trim()) {
      setSent(null);
      return;
    }
    setSending(true);
    setSent(null);
    
    try {
      const res = await fetch('/api/support-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sender: sender || undefined,
          page,
          userAgent: ua,
          userId: userId || undefined,
        }),
        credentials: 'same-origin'
      });
      
      if (res.ok) {
        setSent('ok');
        setMessage('');
      } else {
        console.error('Support email failed', await res.text());
        setSent('err');
      }
    } catch (e) {
      console.error('Support email error', e);
      setSent('err');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setOpen(v => !v)}
        className="rounded-2xl shadow-lg px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
        aria-expanded={open}
        aria-controls="support-quick-contact"
        data-testid="button-support-toggle"
      >
        {open ? (
          <>
            <X className="h-4 w-4 mr-2" />
            Close support
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Us
          </>
        )}
      </Button>

      {open && (
        <div
          id="support-quick-contact"
          className="mt-2 w-[22rem] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur p-4 space-y-4"
          data-testid="container-support-widget"
        >
          <div className="space-y-2">
            <div className="text-sm font-semibold">Email from your app</div>
            <div className="flex gap-2">
              <a 
                className="text-sm underline hover:text-blue-600" 
                href={mailtoHref}
                data-testid="link-mail-app"
              >
                Mail app
              </a>
              <a 
                className="text-sm underline hover:text-blue-600" 
                href={gmailHref} 
                target="_blank" 
                rel="noreferrer"
                data-testid="link-gmail"
              >
                Gmail
              </a>
              <a 
                className="text-sm underline hover:text-blue-600" 
                href={outlookHref} 
                target="_blank" 
                rel="noreferrer"
                data-testid="link-outlook"
              >
                Outlook
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-3" />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Or send from here</div>
            <Input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Your email (for replies)"
              className="w-full rounded-xl"
              data-testid="input-sender-email"
            />
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or feedback..."
              className="w-full h-28 rounded-xl resize-none"
              data-testid="textarea-message"
            />
            <Button
              onClick={submitInline}
              disabled={sending || !message.trim()}
              className="w-full rounded-2xl"
              data-testid="button-submit-support"
            >
              {sending ? 'Sending…' : prelaunch ? 'Save & notify (pre-launch)' : 'Send to support@anointed.io'}
            </Button>
            {sent === 'ok' && (
              <p className="text-xs text-green-600 dark:text-green-400" data-testid="text-success">
                {prelaunch ? "Saved! We'll review this when we launch." : "Sent! We'll reply soon."}
              </p>
            )}
            {sent === 'err' && (
              <p className="text-xs text-red-600 dark:text-red-400" data-testid="text-error">
                Couldn't send. Try the Mail/Gmail/Outlook buttons.
              </p>
            )}
          </div>

          {prelaunch && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
              Pre-launch: this saves your feedback and notifies the team. Email delivery goes live at launch.
            </p>
          )}

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            We'll include the page URL and basic device info to help debug. No screenshots or console logs are sent unless you attach them.
          </p>
        </div>
      )}
    </div>
  );
}
