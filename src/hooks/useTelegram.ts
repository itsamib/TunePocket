'use client';

import { useState, useEffect } from 'react';

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
