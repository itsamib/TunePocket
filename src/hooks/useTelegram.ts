'use client';

import { useState, useEffect } from 'react';

// This hook is no longer in use and can be removed in the future.
// The logic has been integrated directly into TunePocketApp.tsx for simplicity and reliability.
export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    if (window.Telegram) {
      const telegramApp = window.Telegram.WebApp;
      telegramApp.ready();
      
      setTg(telegramApp);
      setUser(telegramApp.initDataUnsafe?.user);
    }
  }, []);

  return { tg, user };
};
