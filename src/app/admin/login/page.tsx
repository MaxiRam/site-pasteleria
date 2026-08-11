import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Panel de administración
      </h1>
      <LoginForm />
    </div>
  );
}
