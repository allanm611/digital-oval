import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@headlessui/react', 'lucide-react'],

          // Feature chunks
          'feature-campaigns': [
            './src/features/campaigns/pages/CampaignsPage',
            './src/features/campaigns/pages/CreateCampaignPage',
            './src/features/campaigns/pages/CampaignDetailsPage',
            './src/features/campaigns/pages/CampaignsAnalyticsPage',
          ],
          'feature-offers': [
            './src/features/offers/pages/OffersPage',
            './src/features/offers/pages/CreateOfferPage',
            './src/features/offers/pages/OfferDetailsPage',
          ],
          'feature-analytics': [
            './src/features/dashboard/pages/CampaignReportsPage',
            './src/features/dashboard/pages/OfferReportsPage',
            './src/features/dashboard/pages/OverallDashboardPerformancePage',
          ],

          // Heavy dependencies
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx'],
          'vendor-geo': ['world-countries', 'i18n-iso-countries'],
        }
      }
    }
  }
});
