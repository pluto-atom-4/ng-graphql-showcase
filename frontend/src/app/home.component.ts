import { Component, ChangeDetectionStrategy, signal, Injector, inject, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildProgressCardComponent } from './components/build-progress-card.component';
import { BuildDetailsComponent, ButtonComponent, CardComponent, BadgeComponent } from './components';
import { BuildService } from './services/build.service';
import { BuildStateWorkerService } from './services/build-state-worker.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface BuildCard {
  id: string;
  name: string;
}

/**
 * HomeComponent - Landing page with feature showcase and build cards.
 *
 * Displays:
 * - Header with title and link to dashboard
 * - Grid of build progress cards
 * - Component library showcase
 * - Build details modal
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BuildProgressCardComponent, BuildDetailsComponent, ButtonComponent, CardComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">
            Manufacturing Workflow Dashboard
          </h1>
          <p class="text-gray-600">
            Real-time build and test monitoring with Tailwind CSS + GraphQL
          </p>
          <div class="mt-4">
            <a href="/dashboard" class="text-blue-600 hover:text-blue-800 underline font-medium">
              Go to Build Dashboard →
            </a>
          </div>
        </div>

        <!-- Feature showcase -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <!-- Build cards: use @for with track to avoid re-rendering unchanged items -->
          @for (build of builds(); track build.id) {
            <app-build-progress-card
              [buildName]="build.name"
              [buildId]="build.id"
              (buildClicked)="onBuildClicked($event)"
            />
          }
        </div>

        <!-- Component showcase -->
        <app-card title="Component Library" description="Fully type-safe, ready to use">
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold mb-2">Button Variants</h3>
              <div class="flex flex-wrap gap-2">
                <app-button [label]="'Primary'" [variant]="'primary'" />
                <app-button [label]="'Secondary'" [variant]="'secondary'" />
                <app-button [label]="'Accent'" [variant]="'accent'" />
                <app-button [label]="'Ghost'" [variant]="'ghost'" />
                <app-button [label]="'Outline'" [variant]="'outline'" />
              </div>
            </div>

            <div>
              <h3 class="font-semibold mb-2">Status Badges</h3>
              <div class="flex flex-wrap gap-2">
                <app-badge label="Active" variant="success" />
                <app-badge label="Pending" variant="warning" />
                <app-badge label="Failed" variant="error" />
                <app-badge label="Info" variant="info" />
              </div>
            </div>

            <div class="text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p>
                <strong>Learn more:</strong> See <code class="bg-gray-200 px-2 py-1 rounded">frontend/README.md</code>
              </p>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Build Details Modal -->
      @if (selectedBuild()) {
        <app-build-details
          [build]="selectedBuild()!"
          (close)="closeModal()"
        />
      }
    </div>
  `,
})
export class HomeComponent {
  builds = signal<BuildCard[]>([]);
  selectedBuild = signal<any>(null);
  private injector = inject(Injector);
  private stateWorker = inject(BuildStateWorkerService);

  constructor(private buildService: BuildService) {
    this.loadBuilds();
  }

  private loadBuilds(): void {
    runInInjectionContext(this.injector, () => {
      this.buildService.getAllBuilds()
        .pipe(takeUntilDestroyed())
        .subscribe((buildList: BuildCard[]) => {
          this.builds.set(buildList);
        });
    });
  }

  onBuildClicked(buildId: string): void {
    // Subscribe via centralized state worker (combines query + real-time updates)
    this.stateWorker.subscribeToBuild(buildId);

    // Watch for updates to this build
    runInInjectionContext(this.injector, () => {
      this.stateWorker
        .getBuilds$()
        .pipe(
          takeUntilDestroyed(),
          map((buildMap) => buildMap.get(buildId) || null)
        )
        .subscribe((build) => {
          this.selectedBuild.set(build);
        });
    });
  }

  closeModal(): void {
    this.selectedBuild.set(null);
  }
}
