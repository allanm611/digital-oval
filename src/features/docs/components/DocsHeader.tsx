/**
 * DocsHeader
 * Fixed navbar at top with logo and Documentation navigation
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import styles from './DocsHeader.module.css';
import logo from '../../../assets/logo.png';

export function DocsHeader() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const isDocsActive = location.pathname.startsWith('/documentation');

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left: Logo + Brand + Documentation label */}
        <div className={styles.leftSection}>
          <Link to="/documentation/intro" className={styles.brand}>
            <img src={logo} alt="Sentra CVM" className={styles.logo} />
            <span className={styles.brandName}>Sentra CVM</span>
          </Link>
          <span className={styles.docLabel}>Documentation</span>
        </div>

        {/* Right: Search + Nav */}
        <div className={styles.rightSection}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
