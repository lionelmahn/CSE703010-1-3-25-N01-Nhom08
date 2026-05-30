/**
 * Backwards-compat shim.
 *
 * The authenticated shell now lives in `src/components/layout/AppLayout.jsx`.
 * This re-export keeps `import MainLayout from '@/layout/MainLayout'` working
 * for any downstream code that may still reference it.
 */
export { default } from '@/components/layout/AppLayout';
