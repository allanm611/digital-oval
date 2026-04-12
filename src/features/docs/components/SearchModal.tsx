/**
 * SearchModal
 * Full-screen modal search dialog
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import Input from '../../../shared/components/ui/Input';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearch(query);


  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleResultClick = (slug: string) => {
    navigate(`/documentation/${slug}`);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className={styles.searchInputContainer}>
          <Search size={20} className={styles.searchIcon} />
          <Input
            ref={inputRef}
            placeholder="Search documentation..."
            value={query}
            onChange={setQuery}
            className={styles.searchInput}
            variant="medium"
          />
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className={styles.resultsContainer}>
          {query && results.length > 0 ? (
            <div className={styles.resultsList}>
              {results.map((result) => (
                <button
                  key={result.slug}
                  className={styles.resultItem}
                  onClick={() => handleResultClick(result.slug)}
                >
                  <div className={styles.resultContent}>
                    <div className={styles.resultTitle}>{result.title}</div>
                    <div className={styles.resultExcerpt}>{result.excerpt}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : query && results.length === 0 ? (
            <div className={styles.noResults}>
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Start typing to search documentation...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
