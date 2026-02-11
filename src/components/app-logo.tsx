
'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DefaultLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-full w-full text-sidebar-primary">
      <rect width="256" height="256" fill="none"/>
      <path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/>
    </svg>
);

export function AppLogo({ className }: { className?: string }) {
  const [logo, setLogo] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load the logo from localStorage on initial mount.
    const savedLogo = localStorage.getItem('appLogo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    // Create a listener for storage changes.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'appLogo') {
        setLogo(event.newValue);
      }
    };
    
    // Add the event listener.
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up the listener on component unmount.
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  if (!isMounted) {
    // Render a placeholder to avoid hydration mismatch and layout shift.
    return <div className={cn("bg-transparent", className)} />;
  }

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="App Logo" className={cn("object-contain", className)} />;
  }

  return <div className={className}><DefaultLogo /></div>;
}
