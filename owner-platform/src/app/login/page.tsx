import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen w-full max-w-[400px] mx-auto px-layout-margin">
      <div className="w-full">
        <div className="bg-[#1e1e1e] border border-outline-variant p-layout-margin rounded-lg shadow-none">
          <header className="mb-10 text-center">
            <h1 className="font-headline-md text-headline-md font-bold text-primary mb-unit">
              Super Admin Portal
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
              Platform Operations Log In
            </p>
          </header>

          <LoginForm />

          <footer className="mt-8 text-center">
            <a
              href="#"
              className="font-body-sm text-body-sm text-outline hover:text-primary transition-colors no-underline"
            >
              Forgot password?
            </a>
          </footer>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-30 select-none">
          <span className="material-symbols-outlined !text-[14px]">verified_user</span>
          <span className="font-label-caps text-[9px] uppercase tracking-[0.2em]">
            Encrypted Session Protocol V2.4
          </span>
        </div>
      </div>
    </main>
  );
}