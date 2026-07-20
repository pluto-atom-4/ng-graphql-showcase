import { Component, ChangeDetectionStrategy, signal, Injector, inject, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildProgressCardComponent } from './components/build-progress-card.component';
import { BuildDetailsComponent, ButtonComponent, CardComponent, BadgeComponent } from './components';
import { GetBuildQuery } from './api/generated/graphql';
import { BuildService } from './services/build.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type BuildDetail = NonNullable<GetBuildQuery['build']>;

interface BuildCard {
  id: string;
  name: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BuildProgressCardComponent, BuildDetailsComponent, ButtonComponent, CardComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-base-content mb-2">
            Manufacturing Workflow Dashboard
          </h1>
          <p class="text-gray-600">
            Real-time build and test monitoring with daisyUI + GraphQL
          </p>
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
        <app-card title="daisyUI Component Library" description="Fully type-safe, ready to use">
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

            <div class="text-sm text-gray-600 pt-4 border-t border-base-300">
              <p>
                <strong>Learn more:</strong> See <code class="bg-base-300 px-2 py-1 rounded">docs/daisyui-developer-guide.md</code>
              </p>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Build Details Modal -->
      @if (selectedBuild()) {
        <app-build-details
          [build]="selectedBuild()!"
          [onClose]="closeModal"
        />
      }
    </div>
  `,
})
export class AppComponent {
  builds = signal<BuildCard[]>([]);
  selectedBuild = signal<BuildDetail | null>(null);
  private injector = inject(Injector);

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
    runInInjectionContext(this.injector, () => {
      this.buildService
        .getBuildById(buildId)
        .pipe(takeUntilDestroyed())
        .subscribe((build) => {
          this.selectedBuild.set(build);
        });
    });
  }

  closeModal = (): void => {
    this.selectedBuild.set(null);
  };
}
