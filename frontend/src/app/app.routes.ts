import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { DashboardPageComponent } from './dashboard/containers/dashboard-page/dashboard-page.component';

/**
 * Application routing configuration.
 *
 * Routes:
 * - '' (root) → HomeComponent (landing page with feature showcase)
 * - 'dashboard' → DashboardPageComponent (build monitoring dashboard)
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    data: { title: 'Dashboard' },
  },
];
