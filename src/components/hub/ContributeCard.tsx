import GitHubIcon from "./GitHubIcon";

const REPO_URL = "https://github.com/OxTEJIRI/Crumbs";

export default function ContributeCard() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      className="flex h-full flex-col gap-3 rounded-3xl border border-primary/20 bg-surface p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <GitHubIcon className="h-10 w-10" />
      <h3 className="font-display text-xl font-semibold">Contribute</h3>
      <p className="flex-1 text-sm text-muted">
        Crumbs is open source. Browse the code, file an issue, or open a
        pull request.
      </p>
      <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-primary">
        View on GitHub
      </span>
    </a>
  );
}
