export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1 px-6 py-6 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} Crumbs. Built for Cookie Chain&apos;s
          &quot;Build a cApp&quot; hackathon.
        </p>
        <p>
          Every game action is a real transaction on Cookie Chain, no
          mocked or fake calls.
        </p>
      </div>
    </footer>
  );
}
