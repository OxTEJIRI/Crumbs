import GitHubIcon from "./GitHubIcon";

const REPO_URL = "https://github.com/OxTEJIRI/Crumbs";

export default function ContributeCard() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 shadow-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-80"
      />
      <div className="relative">
        <GitHubIcon className="h-10 w-10" />
      </div>
      <h3 className="relative font-display text-xl font-semibold tracking-tight">
        Contribute
      </h3>
      <p className="relative flex-1 text-sm text-muted">
        Crumbs is open source. Browse the code, file an issue, or open a
        pull request.
      </p>
      <span className="relative w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-primary">
        View on GitHub
      </span>
    </a>
  );
}
