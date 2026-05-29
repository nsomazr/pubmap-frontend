import { Fragment, createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { RouteNavigationComplete } from "../components/navigation/navigationProgress";

const CHUNK_RETRY_DELAY_MS = 400;

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk") ||
    msg.includes("load failed")
  );
}

async function loadWithRetry<T>(loader: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;
      if (!isChunkLoadError(error) || attempt === attempts - 1) break;
      await new Promise((resolve) => window.setTimeout(resolve, CHUNK_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

/** Lazy-load a page module with retries (avoids blank screen after deploy or flaky networks). */
export function lazyPage<M extends Record<string, ComponentType<unknown>>>(
  loader: () => Promise<M>,
  exportName: keyof M
): LazyExoticComponent<ComponentType<unknown>> {
  return lazy(() =>
    loadWithRetry(loader).then((mod) => {
      const component = mod[exportName];
      if (!component) {
        throw new Error(`lazyPage: export "${String(exportName)}" was not found on the module.`);
      }
      const Page = component as ComponentType<unknown>;
      function PageWithNavigationReady(props: Record<string, unknown>) {
        return createElement(
          Fragment,
          null,
          createElement(RouteNavigationComplete),
          createElement(Page, props)
        );
      }
      return { default: PageWithNavigationReady as ComponentType<unknown> };
    })
  );
}
