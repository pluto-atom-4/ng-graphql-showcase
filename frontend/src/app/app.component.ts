import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * AppComponent - Root layout component with router outlet.
 *
 * Provides the main application shell and routes content
 * based on the current route.
 *
 * Routes:
 * - '' (root) → HomeComponent
 * - '/dashboard' → DashboardPageComponent
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
