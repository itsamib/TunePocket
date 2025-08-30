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
      
      // Set theme
      document.documentElement.className = telegramApp.colorScheme;
    }
  }, []);

  return { tg, startParam };
};
