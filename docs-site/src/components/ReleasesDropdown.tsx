import React, { useState, useEffect } from 'react';
import styles from './ReleasesDropdown.module.css';

interface Release {
  version: string;
  createdAt: string;
  filesCount?: number;
}

export function ReleasesDropdown() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentRelease, setCurrentRelease] = useState('2.0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Replace with actual API call
    // For now, mock data
    setReleases([
      { version: '2.0', createdAt: '2026-03-28', filesCount: 45 },
      { version: '1.1', createdAt: '2026-02-15', filesCount: 42 },
      { version: '1.0', createdAt: '2026-01-10', filesCount: 38 },
    ]);
  }, []);

  const handleSelectRelease = (version: string) => {
    if (version !== currentRelease) {
      setLoading(true);
      // TODO: Load docs for selected release
      // Add ?docsVersion=version to current page URL
      setTimeout(() => {
        setCurrentRelease(version);
        setLoading(false);
        setIsOpen(false);
      }, 500);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        Releases
        <span className={styles.chevron}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {releases.map((release) => (
            <button
              key={release.version}
              className={`${styles.item} ${
                release.version === currentRelease ? styles.active : ''
              }`}
              onClick={() => handleSelectRelease(release.version)}
              disabled={loading}
            >
              <span className={styles.version}>v{release.version}</span>
              {release.version === currentRelease && (
                <span className={styles.badge}>Current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
