'use client';
import React, { useState, useEffect } from 'react';

const LOGO_STORAGE_KEY = 'app-logo';

const DefaultLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-sidebar-primary">
      <rect width="256" height="256" fill="none"/>
      <path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/>
    </svg>
  );

export function AppLogo() {
  const [logo, setLogo] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const handleStorageChange = () => {
        try {
          setLogo(localStorage.getItem(LOGO_STORAGE_KEY));
        } catch (error) {
            console.error("Could not access localStorage:", error);
            setLogo(null);
        }
      };
      
      handleStorageChange();
      
      const storageEventHandler = (e: StorageEvent) => {
        if (e.key === LOGO_STORAGE_KEY) {
          handleStorageChange();
        }
      };

      window.addEventListener('logo-updated', handleStorageChange);
      window.addEventListener('storage', storageEventHandler);

      return () => {
        window.removeEventListener('logo-updated', handleStorageChange);
        window.removeEventListener('storage', storageEventHandler);
      };
    }
  }, [isMounted]);
  
  if (!isMounted) {
    // Render default logo on server and during initial client render to prevent hydration mismatch
    return <DefaultLogo />;
  }

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="App Logo" className="h-8 w-8 object-contain" />;
  }

  return <DefaultLogo />;
}
