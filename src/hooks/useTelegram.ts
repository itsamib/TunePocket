'use client';

import { useState, useEffect } from 'react';

// This hook is now simplified. It only cares about the initial start_param.
// Re-triggering based on hash changes is handled more robustly in TunePocketApp.
export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  
  useEffect(() => {
    let param: string | null = null;
    
    // Function to extract param from hash
    const getParamFromHash = () => {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.slice(1));
        return urlParams.get('tgWebAppStartParam');
    }

    // Main initialization logic
    const init = () => {
        if (window.Telegram) {
          const telegramApp = window.Telegram.WebApp;
          telegramApp.ready();
          
          setTg(telegramApp);
          setUser(telegramApp.initDataUnsafe?.user);
          
          // First, try to get the start_param from the hash
          param = getParamFromHash();

          // If the hash param wasn't found, check the initData's start_param
          if (!param) {
            param = telegramApp.initDataUnsafe?.start_param;
          }

          if (param) {
            setStartParam(param);
          }
        }
    }
    
    init();

    // The component using this hook (TunePocketApp) will now be responsible
    // for listening to hash changes if it needs to react to them while
    // the app is already running. This simplifies the hook's purpose.

  }, []);

  return { tg, user, startParam };
};
