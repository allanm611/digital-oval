/**
 * DocsHeader
 * Fixed navbar at top with logo and Documentation navigation
 */

import { useState, useRef, useEffect } from 'react';
import Input from '../../../shared/components/ui/Input';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { useDocsVersion } from '../contexts/DocsVersionContext';
import styles from './DocsHeader.module.css';
import logo from '../../../assets/logo.png';

export function DocsHeader() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const { activeVersion, setActiveVersion } = useDocsVersion();
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  const versions = [
    { version: 'v1.1', isLatest: true },
    { version: 'v1.0' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setIsVersionOpen(false);
      }
    }

    if (isVersionOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVersionOpen]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Left: Logo + Brand + Documentation label */}
          <div className={styles.leftSection}>
            {/* <Link to="/landing" className={styles.brand}> */}
            <button onClick={() => navigate(-1)} className={styles.brand}>
              <img src={logo} alt="Sentra CVM" className={styles.logo} />
              <span className={styles.brandName}>Sentra CVM</span>
            </button>
            {/* </Link> */}
            <span className={styles.docLabel}>Documentation</span>
          </div>

          {/* Center: Release Notes + Version Dropdown */}
          <div className={styles.centerSection}>
            <span className={styles.releaseLabel}>Release Notes</span>
            <div ref={versionDropdownRef} className={styles.versionDropdownContainer}>
              <button
                onClick={() => setIsVersionOpen(!isVersionOpen)}
                className={styles.versionButton}
              >
                <span className={styles.versionText}>{activeVersion}</span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isVersionOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {isVersionOpen && (
                <div className={styles.versionDropdown}>
                  {versions.map((versionInfo) => (
                    <button
                      key={versionInfo.version}
                      onClick={() => {
                        setActiveVersion(versionInfo.version);
                        setIsVersionOpen(false);
                      }}
                      className={`${styles.versionItem} ${activeVersion === versionInfo.version ? styles.versionItemActive : ''}`}
                    >
                      <div className={styles.versionItemTitle}>
                      {versionInfo.version}
                      {versionInfo.isLatest && <span className={styles.latestBadge}>Latest</span>}
                    </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Search */}
          <div className={styles.rightSection}>
            <button
              onClick={() => setIsSearchOpen(true)}
              className={styles.searchBox}
            >
              <Search size={18} className={styles.searchIcon} />
              <Input
                type="text"
                placeholder="Search documentation..."
                className={styles.searchInput}
                readOnly
              />
            </button>
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
