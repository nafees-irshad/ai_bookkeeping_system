export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] text-center font-sans">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-10 shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-950/50">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white font-gabarito">
          Welcome to <span className="text-indigo-600 dark:text-indigo-400">AccuBooks</span>
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-zinc-400 font-gabarito" data-subtext="true">
          Your smart AI-assisted bookkeeping and financial management workspace.
        </p>
      </div>
    </div>
  );
}
