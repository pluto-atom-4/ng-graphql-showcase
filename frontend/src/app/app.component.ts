import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8">
      <h1>Hello Angular</h1>
      <p>Workflow Viewer Integration Complete</p>
    </div>
  `,
})
export class AppComponent {}
