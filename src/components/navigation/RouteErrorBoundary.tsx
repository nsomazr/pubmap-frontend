import { AlertCircle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  /** When any value changes (e.g. route path), recover from a previous render error. */
  resetKeys?: readonly unknown[];
};
type State = { error: Error | null };

function resetKeysChanged(prev: readonly unknown[] | undefined, next: readonly unknown[] | undefined): boolean {
  const a = prev ?? [];
  const b = next ?? [];
  if (a.length !== b.length) return true;
  return a.some((value, index) => !Object.is(value, b[index]));
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk") ||
    msg.includes("load failed")
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GRE] Route render failed", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkIssue = isChunkLoadError(error);

    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#eef1f8] p-6">
        <div className="gre-dashboard-card max-w-md space-y-4 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-ink">This page could not load</h1>
            <p className="mt-2 text-sm text-slate-600">
              {chunkIssue
                ? "A newer version of GRE may be available. Refresh to load the latest app files, then try again."
                : "Something went wrong while opening this page. You can retry or return to the map."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={chunkIssue ? this.handleHardReload : this.handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              {chunkIssue ? "Refresh app" : "Try again"}
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ error: null })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to map
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
