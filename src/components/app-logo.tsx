'use client';

import React, { useState, useEffect } from 'react';

const LOGO_STORAGE_KEY = 'app-logo';
const DEFAULT_LOGO_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-sidebar-primary">
    <rect width="256" height="256" fill="none"/>
    <path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/>
  </svg>
);

export function AppLogo() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleStorageChange = () => {
      try {
        const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
        setLogoSrc(savedLogo);
      } catch (error) {
        console.error("Could not access localStorage:", error);
      }
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logo-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logo-updated', handleStorageChange);
    };
  }, []);

  if (!isClient) {
    return DEFAULT_LOGO_SVG;
  }
  
  if (logoSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoSrc} alt="App Logo" className="h-8 w-8 object-contain" />;
  }

  return DEFAULT_LOGO_SVG;
}
