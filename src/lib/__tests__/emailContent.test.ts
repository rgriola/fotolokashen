import { describe, it, expect } from 'vitest';
import {
  EMAIL_SUBJECTS,
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
} from '@/lib/email-content';

// ── EMAIL_SUBJECTS coverage ───────────────────────────────────────────────────

describe('EMAIL_SUBJECTS', () => {
  const requiredKeys = [
    'verification',
    'welcome',
    'password_reset',
    'password_changed',
    'account_deletion',
  ] as const;

  it('has an entry for every transactional email type', () => {
    for (const key of requiredKeys) {
      expect(EMAIL_SUBJECTS[key]).toBeTruthy();
    }
  });

  it('contains no empty subject strings', () => {
    for (const value of Object.values(EMAIL_SUBJECTS)) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

// ── Template variable substitution ───────────────────────────────────────────

describe('verificationEmailTemplate', () => {
  it('includes the username', () => {
    const html = verificationEmailTemplate('alice', 'https://example.com/verify?token=abc');
    expect(html).toContain('alice');
  });

  it('includes the verification URL', () => {
    const url = 'https://example.com/verify?token=abc';
    const html = verificationEmailTemplate('alice', url);
    expect(html).toContain(url);
  });

  it('returns a non-empty HTML string', () => {
    const html = verificationEmailTemplate('alice', 'https://example.com/verify?token=abc');
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });
});

describe('welcomeToEmailTemplate', () => {
  it('includes the username', () => {
    const html = welcomeToEmailTemplate('bob');
    expect(html).toContain('bob');
  });

  it('returns a non-empty HTML string', () => {
    const html = welcomeToEmailTemplate('bob');
    expect(html.length).toBeGreaterThan(100);
  });
});

describe('passwordResetEmailTemplate', () => {
  it('includes the username', () => {
    const html = passwordResetEmailTemplate('carol', 'https://example.com/reset?token=xyz');
    expect(html).toContain('carol');
  });

  it('includes the reset URL', () => {
    const url = 'https://example.com/reset?token=xyz';
    const html = passwordResetEmailTemplate('carol', url);
    expect(html).toContain(url);
  });
});

describe('passwordChangedEmailTemplate', () => {
  it('includes the username', () => {
    const html = passwordChangedEmailTemplate('dave', 'January 1, 2026, 12:00 PM UTC', null);
    expect(html).toContain('dave');
  });

  it('includes the formatted timestamp', () => {
    const ts = 'January 1, 2026, 12:00 PM UTC';
    const html = passwordChangedEmailTemplate('dave', ts, null);
    expect(html).toContain(ts);
  });

  it('includes the IP address when provided', () => {
    const html = passwordChangedEmailTemplate('dave', 'January 1, 2026', '192.0.2.1');
    expect(html).toContain('192.0.2.1');
  });

  it('omits the IP address row when null', () => {
    const html = passwordChangedEmailTemplate('dave', 'January 1, 2026', null);
    expect(html).not.toContain('IP address');
  });
});

describe('accountDeletionEmailTemplate', () => {
  it('includes the username', () => {
    const html = accountDeletionEmailTemplate('eve', 'eve@example.com');
    expect(html).toContain('eve');
  });

  it('includes the deleted email address', () => {
    const html = accountDeletionEmailTemplate('eve', 'eve@example.com');
    expect(html).toContain('eve@example.com');
  });
});
