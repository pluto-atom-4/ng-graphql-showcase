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
    <!-- Skip-to-main link (visible on focus for keyboard users) -->
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
      Skip to main content
    </a>
    <main id="main" role="main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    /* Screen reader only: hidden by default, visible on focus */
    :host ::ng-deep .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    :host ::ng-deep .focus\\:not-sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: 0.5rem 1rem;
      margin: 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `]
})
export class AppComponent {}
