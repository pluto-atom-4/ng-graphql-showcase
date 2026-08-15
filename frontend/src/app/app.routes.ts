import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';

/**
 * Application routing configuration.
 *
 * Routes:
 * - '' (root) → HomeComponent (landing page with feature showcase)
 * - 'dashboard' → DashboardPageComponent (build monitoring dashboard, lazy-loaded)
 *
 * Note: Dashboard route uses lazy-loading to reduce main bundle size.
 * The dashboard chunk is only loaded when user navigates to /dashboard.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/containers/dashboard-page/dashboard-page.component')
        .then(m => m.DashboardPageComponent),
    data: { title: 'Dashboard' },
  },
];
