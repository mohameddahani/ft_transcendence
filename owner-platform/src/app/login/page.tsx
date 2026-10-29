import LoginForm from "@/components/login/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export default function LoginPage() {
  return (
    <main className="relative flex items-center justify-center min-h-screen w-full bg-background px-4 py-8 transition-colors duration-200">
      {/* Theme toggle button positioned at top right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle
          showLabel
          className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant rounded-full px-3 py-1.5 shadow-sm hover:bg-surface-container-high transition-all text-on-surface font-medium text-xs sm:text-sm"
        />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant p-6 sm:p-layout-margin rounded-2xl shadow-xl dark:shadow-2xl transition-colors duration-200">
          <header className="mb-8 text-center">
            <h1 className="font-headline-md text-headline-md sm:text-[20px] font-bold text-primary dark:text-primary-fixed mb-1.5 transition-colors">
              Super Admin Portal
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold transition-colors">
              Platform Operations Log In
            </p>
          </header>

          <LoginForm />

          <footer className="mt-8 text-center">
            <a
              href="#"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors no-underline"
            >
              Forgot password?
            </a>
          </footer>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-60 select-none transition-colors">
          <span className="material-symbols-outlined !text-[16px]">verified_user</span>
          <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] font-medium">
            Encrypted Session Protocol V2.4
          </span>
        </div>
      </div>
    </main>
  );
}