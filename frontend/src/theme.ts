// A thin hook over the shell's theme store so the viz components (which paint canvases and charts) can
// react to light/dark. The shell owns the toggle and persistence; this just observes.

import { useThemeStore, type Theme } from '@fasl-work/caos-app-shell';

export function useTheme(): { theme: Theme } {
  const theme = useThemeStore((s) => s.theme);
  return { theme };
}
