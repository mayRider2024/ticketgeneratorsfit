"use client";
import { ClerkProvider } from '@clerk/nextjs';

function ConfigMessage({ title, lines }) {
  return (
    <div style={{padding: '2rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.55}}>
      <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem'}}>{title}</h2>
      {lines.map((l,i) => <p key={i} style={{margin: '0 0 0.5rem'}} dangerouslySetInnerHTML={{__html: l}} />)}
      <p style={{marginTop: '1rem'}}>Get keys at: <a href="https://dashboard.clerk.com/" target="_blank" rel="noreferrer">Clerk Dashboard</a>.</p>
    </div>
  );
}

export default function Providers({ children }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const isMissing = !publishableKey;
  const isPlaceholder = publishableKey === 'pk_test_replace_with_real_key';
  const formatOk = !!publishableKey && /^pk_(test|live)_[A-Za-z0-9]+$/.test(publishableKey);
  const isInvalidFormat = !!publishableKey && !formatOk;

  if (isMissing) {
    return (
      <ConfigMessage
        title="Clerk configuration missing"
        lines={[
          'Environment variable <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is not set.',
          '1. Create <code>.env.local</code> at the project root.',
          '2. Add your publishable key: <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX</code>',
          '3. Add secret key: <code>CLERK_SECRET_KEY=sk_test_XXXXXXXX</code>',
          '4. Restart the dev server (Ctrl+C then npm run dev).'
        ]}
      />
    );
  }

  if (isPlaceholder || isInvalidFormat) {
    return (
      <ConfigMessage
        title="Clerk publishable key invalid"
        lines={[
          `Current value: <code>${publishableKey}</code>`,
          'This is a placeholder or malformed key.',
          'Copy the real key from Clerk Dashboard → API Keys (it starts with <code>pk_test_</code> or <code>pk_live_</code>).',
          'Update <code>.env.local</code>, save, then restart the dev server.'
        ]}
      />
    );
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
