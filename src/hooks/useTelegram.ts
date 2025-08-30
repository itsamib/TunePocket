'use client';

import { useState, useEffect } from 'react';

// This hook is now simplified. It only cares about the initial start_param.
// Re-triggering based on hash changes is removed because it was unreliable
// and the new flow in TunePocketApp handles clearing the start_param from the URL
// to prevent re-processing.
export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    let param: string | null = null;
    
    // First, try to get the start_param from the hash, which is what Telegram uses
    // for deep links when the app is already open.
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.slice(1));
    param = urlParams.get('tgWebAppStartParam');

    if (window.Telegram) {
      const telegramApp = window.Telegram.WebApp;
      telegramApp.ready();
      
      setTg(telegramApp);
      setUser(telegramApp.initDataUnsafe?.user);
      
      if (telegramApp.colorScheme) {
        setTheme(telegramApp.colorScheme);
      }
      
      // If the hash param wasn't found, check the initData a`start_param`,
      // which is used when the app is first launched.
      if (!param) {
        param = telegramApp.initDataUnsafe?.start_param;
      }
    }
    
    if (param) {
      setStartParam(param);
    }
    
  }, []);

  return { tg, user, startParam, theme };
};
