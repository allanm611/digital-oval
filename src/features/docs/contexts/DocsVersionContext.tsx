/**
 * DocsVersionContext
 * Manages which documentation version is active globally
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DocsVersionContextType {
  activeVersion: string;
  setActiveVersion: (version: string) => void;
}

const DocsVersionContext = createContext<DocsVersionContextType | undefined>(undefined);

export function DocsVersionProvider({ children }: { children: ReactNode }) {
  const [activeVersion, setActiveVersion] = useState('1.3.2');

  return (
    <DocsVersionContext.Provider value={{ activeVersion, setActiveVersion }}>
      {children}
    </DocsVersionContext.Provider>
  );
}

export function useDocsVersion() {
  const context = useContext(DocsVersionContext);
  if (!context) {
    throw new Error('useDocsVersion must be used within DocsVersionProvider');
  }
  return context;
}
