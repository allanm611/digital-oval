/**
 * DocsHeader
 * Fixed navbar at top with logo and Documentation navigation
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { SearchModal } from './SearchModal';
import styles from './DocsHeader.module.css';
import logo from '../../../assets/logo.png';

export function DocsHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const isDocsActive = location.pathname.startsWith('/documentation');

  const currentVersion = 'v1.0';
  const releaseDate = 'April 2026';

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
            <div className={styles.versionDropdownContainer}>
              <button
                onClick={() => setIsVersionOpen(!isVersionOpen)}
                className={styles.versionButton}
              >
                <span className={styles.versionText}>{currentVersion}</span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isVersionOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {isVersionOpen && (
                <div className={styles.versionDropdown}>
                  <div className={styles.versionItem}>
                    <div className={styles.versionItemTitle}>{currentVersion}</div>
                    <div className={styles.versionItemSubtitle}>Current Release</div>
                    <div className={styles.versionItemDate}>{releaseDate}</div>
                  </div>
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
              <input
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
