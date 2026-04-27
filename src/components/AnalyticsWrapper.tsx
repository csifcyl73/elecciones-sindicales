'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function AnalyticsWrapper({ gaId }: { gaId: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'all') {
      setShouldLoad(true);
    }
  }, []);

  if (!shouldLoad || !gaId) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
