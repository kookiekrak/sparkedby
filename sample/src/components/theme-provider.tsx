import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure theme is only applied after client-side hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export const ThemeContext = createContext<{
  theme: string | undefined;
  setTheme: (theme: string) => void;
}>({
  theme: undefined,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
