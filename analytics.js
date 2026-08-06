/**
 * Vercel Web Analytics Integration
 * 
 * This script initializes Vercel Web Analytics for the Matrix Engine Studio application.
 * It uses the @vercel/analytics package to track page views and user interactions.
 */

import { inject } from './node_modules/@vercel/analytics/dist/index.mjs';

// Initialize Vercel Web Analytics
inject({
    mode: 'auto', // Automatically detect environment (production/development)
    debug: false  // Set to true during development to see debug logs
});

console.log('Vercel Web Analytics initialized');
