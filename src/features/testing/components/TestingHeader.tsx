/**
 * TestingHeader
 * Fixed navbar for the standalone health-check feature.
 */

import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import logo from '../../../assets/logo.png';
import styles from './TestingHeader.module.css';

export function TestingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.leftSection}>
          <Link to="/health-check" className={styles.brand}>
            <img src={logo} alt="Sentra CVM" className={styles.logo} />
            <span className={styles.brandName}>Sentra CVM</span>
          </Link>
          <span className={styles.featureLabel}>Health Check</span>
        </div>

        <div className={styles.rightSection}>
          <Link to="/landingpage" className={styles.dashboardLink}>
            <LayoutDashboard size={16} />
            Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
