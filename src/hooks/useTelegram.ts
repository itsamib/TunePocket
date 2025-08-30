'use client';

import { useState, useEffect } from 'react';

// A function to get the start_param from the URL hash
const getStartParamFromHash = () => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.slice(1)); // remove '#' and parse
  return urlParams.get('tgWebAppStartParam');
};


export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    const handleHashChange = () => {
      const newStartParam = getStartParamFromHash();
      if (newStartParam) {
        setStartParam(newStartParam);
      }
    };
    
    // Set initial startParam from hash
    setStartParam(getStartParamFromHash());
    
    window.addEventListener('hashchange', handleHashChange, false);
    
    if (window.Telegram) {
      const telegramApp = window.Telegram.WebApp;
      telegramApp.ready();
      setTg(telegramApp);
      setUser(telegramApp.initDataUnsafe?.user);

      if (telegramApp.colorScheme) {
        setTheme(telegramApp.colorScheme);
      }
      
      const param = telegramApp.initDataUnsafe?.start_param;
      if (param) {
        setStartParam(param);
      }
    }

    return () => {
        window.removeEventListener('hashchange', handleHashChange, false);
    }

  }, []);


  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme])

  return { tg, user, startParam };
};
