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
  // Use a state to ensure we're on the client before accessing localStorage
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const handleStorageChange = () => {
        setLogo(localStorage.getItem(LOGO_STORAGE_KEY));
      };
      handleStorageChange(); // Initial load
      window.addEventListener('logo-updated', handleStorageChange);
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('logo-updated', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isClient]);
  
  if (!isClient) {
    // To avoid hydration mismatch, render a placeholder of the correct size 
    // on the server and let the client-side effect fill it in.
    return <div className="h-8 w-8" />;
  }

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="App Logo" className="h-8 w-8 object-contain" />;
  }

  return <DefaultLogo />;
}
