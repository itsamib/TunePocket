'use client';

import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      const telegramApp = window.Telegram.WebApp;
      telegramApp.ready();
      setTg(telegramApp);
      
      const param = telegramApp.initDataUnsafe?.start_param;
      if (param) {
        setStartParam(param);
      }
    }
  }, []);
  
  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    if (tg) {
        document.documentElement.className = tg.colorScheme;
    } else {
        // Default to dark theme if not in telegram
        document.documentElement.className = 'dark';
    }
  }, [tg])

  return { tg, startParam };
};
