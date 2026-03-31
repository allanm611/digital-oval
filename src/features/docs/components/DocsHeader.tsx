/**
 * DocsHeader
 * Fixed navbar at top with logo and Documentation navigation
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SearchModal } from './SearchModal';
import styles from './DocsHeader.module.css';
import logo from '../../../assets/logo.png';

export function DocsHeader() {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isDocsActive = location.pathname.startsWith('/documentation');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Left: Logo + Brand + Documentation label */}
          <div className={styles.leftSection}>
            <Link to="/landing" className={styles.brand}>
              <img src={logo} alt="Sentra CVM" className={styles.logo} />
              <span className={styles.brandName}>Sentra CVM</span>
            </Link>
            <span className={styles.docLabel}>Documentation</span>
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
