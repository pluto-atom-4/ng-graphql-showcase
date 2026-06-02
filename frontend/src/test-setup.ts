// frontend/src/test-setup.ts
import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({
  zoneless: false, // Set to true if you migrate to Angular 19 signals-only zoneless tracking
});

