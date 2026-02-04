export default function AuthCard({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 border border-white/40">
        <h2 className="text-2xl font-bold text-green-600 text-center">
          {title}
        </h2>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
