# Implement a UI component using Github Copilot CLI

Research the best practice to implement a UI component from the session started by GitHub Copilot CLI.

## Workflow:

1. Scaffold: You use Copilot CLI to create a fresh standalone template.
2. Style: You or Copilot write plain HTML using intuitive daisyUI classes inside JetBraing.
3. Commit: You tap hotkeys to open lazygit, view the explicit structural modifications, and track your progress natively.

```
 [Copilot CLI / Neovim] ──> Generates Standalone Angular + daisyUI CSS classes
          │
          ▼
    [yazi / nvim] ───────> Paste headless logic for complex states (Modals/Tabs)
          │
          ▼
     [lazygit] ──────────> Instant keyboard staging and clean diff reviews
```

## Settings

To get daisyUI running in your Angular and Tailwind CSS project using pnpm, execute the following steps directly inside Konsole. This setup keeps everything in your terminal and configures Tailwind to detect your daisyUI components properly.

### 1. Terminal Installation (via pnpm)

Run this command in your project root to install daisyUI as a development dependency:

```bash
pnpm add -D daisyui@latest

```

### 2. Configure Tailwind CSS

Open your Tailwind configuration file `tailwind.config.js`. Add daisyUI to your `plugins` array.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Ensures Angular templates and standalone components are scanned
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"), // Inject daisyUI classes into your Tailwind ecosystem
  ],
  // Optional: daisyUI configuration options
  daisyui: {
    themes: ["light", "dark"], // Enables built-in themes out of the box
    darkTheme: "dark", // Sets the default fallback for system dark mode
  },
};
```

### 3. Verify Your Main CSS File

Open your global stylesheet (`src/styles.css` or `src/styles.scss`) and make sure the core Tailwind directives are present. daisyUI hooks directly into these:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Test it Instantly via Neovim

Create or open an Angular standalone component template file and add a snippet to verify it works. Because daisyUI relies on semantic classes, your template code remains short and highly scannable for both you and your AI plugins:

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-test-ui",
  standalone: true,
  template: `
    <div
      class="p-6 max-w-sm mx-auto bg-base-100 rounded-xl shadow-md space-y-4"
    >
      <h2 class="text-xl font-medium text-base-content">
        daisyUI Terminal Test
      </h2>
      <p class="text-sm text-neutral-content">
        If this button looks styled, your setup is successful!
      </p>

      <!-- daisyUI semantic button classes -->
      <button class="btn btn-primary">Click Me</button>
      <button class="btn btn-outline btn-secondary ml-2">Secondary</button>
    </div>
  `,
})
export class TestUiComponent {}
```

## Highly efficient system prompt snippets that you can feed into GitHub Copilot CLI.

Highly efficient system prompt snippets that you can feed into GitHub Copilot CLI or your Neovim AI plugin to guarantee it always outputs pure daisyUI classes instead of verbose raw Tailwind.

Here are the system prompt snippets optimized for your terminal workflow. You can save these directly into your project files or feed them into GitHub Copilot CLI to guarantee the AI generates code that uses your exact tech stack.

### 1. The Global Project Context Prompt (Save as .github/copilot-instructions.md)

GitHub Copilot natively reads a `.github/copilot-instructions.md` file if it exists in your project repository. Creating this file ensures that every session automatically adheres to your environment rules without you needing to type them repeatedly.

```markdown
# Tech Stack Constraints

- Framework: Angular (Latest, Standalone Components only)
- Reactivity: Use Angular Signals (`signal()`, `computed()`) for state. No RxJS unless explicitly requested.
- Styling: Tailwind CSS paired with daisyUI semantic classes.

# UI Code Generation Rules

1. Never write verbose, multi-line utility classes if a daisyUI class exists (e.g., use `btn btn-primary` instead of `bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded`).
2. Write everything as inline templates and inline styles inside a single `.component.ts` file to keep the component atomic and easily readable in terminal buffers.
3. Use semantic color names from daisyUI (`text-base-content`, `bg-base-100`, `btn-secondary`) to ensure system theme compatibility (light/dark mode).
4. Do not invent arbitrary tailwind values (e.g., `w-[327px]`). Stick to layout spacing tokens (`w-80`, `p-4`).
```

### 2. The Neovim Inline Fragment Prompt (For yagi)

When you are actively editing an Angular template and want to generate a UI block on the fly, pass this short, high-density prompt directly to your visual selection or active line.

```text
Generate an Angular template using daisyUI classes. Use semantic components like `card`, `alert`, or `modal` where appropriate. Keep markup clean, compact, and bound to Angular Signals state.
```

### 3. The Copilot CLI Scaffolding Prompt (For Konsole terminal commands)

When you are standing up a brand new UI layout from your terminal prompt before launching Neovim, use this structured query format with your gh copilot tool.

```bash
# Example syntax to run in Konsole
gh copilot suggest "Generate an Angular standalone component command for a user settings form using daisyUI semantic form inputs, inline templates, and signals for form tracking"
```
