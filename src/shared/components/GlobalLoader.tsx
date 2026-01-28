import React from 'react';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import LoadingSpinner from './ui/LoadingSpinner';

export default function GlobalLoader() {
  const { isLoading } = useGlobalLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <LoadingSpinner
        variant="modern"
        size="xl"
        color="primary"
      />
    </div>
  );
}
