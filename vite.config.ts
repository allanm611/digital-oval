import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/node_modules/**']
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-ui': ['@headlessui/react', 'lucide-react'],

          // Feature chunks
          'feature-analytics': [
            './src/features/reports-analytics/pages/CampaignReportsPage',
            './src/features/reports-analytics/pages/OfferReportsPage',
            './src/features/dashboard/pages/OverallDashboardPerformancePage',
          ],

          // Heavy dependencies
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx'],
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    }
  }
});
