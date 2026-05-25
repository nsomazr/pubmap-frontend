import type { NavigateFunction } from "react-router-dom";

let appNavigateFn: NavigateFunction | null = null;

export function registerAppNavigate(fn: NavigateFunction | null) {
  appNavigateFn = fn;
}

export function appNavigate(to: string) {
  if (appNavigateFn) {
    appNavigateFn(to);
    return;
  }
  window.location.assign(to);
}
