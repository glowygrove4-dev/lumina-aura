import { useTheme, type Theme } from "./ThemeProvider";

const themes: { id: Theme; label: string }[] = [
  { id: "dark", label: "Noir" },
  { id: "light", label: "Ivoire" },
  { id: "gold", label: "Or" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="glass fixed right-6 top-6 z-50 flex items-center gap-1 rounded-full p-1 text-[11px] uppercase tracking-[0.2em]">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`rounded-full px-3 py-1.5 transition-all duration-500 ${
            theme === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={theme === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
