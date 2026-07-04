// Compatibility shim that lets the existing route files keep their TanStack
// Router-style API (Link with `to`+`params`, useNavigate({to,...}), Route.useParams,
// createFileRoute, etc.) while running on top of react-router-dom in a plain SPA.
import * as React from "react";
import {
  Link as RRLink,
  useNavigate as useRRNavigate,
  useParams as useRRParams,
  useLocation,
  Outlet as RROutlet,
  Navigate as RRNavigate,
  type LinkProps as RRLinkProps,
} from "react-router-dom";

type Params = Record<string, string | number | undefined>;

function buildPath(to: string, params?: Params): string {
  if (!params) return to;
  return to.replace(/\$(\w+)/g, (_, k) => encodeURIComponent(String(params[k] ?? "")));
}

function buildSearch(search?: Record<string, unknown>): string {
  if (!search) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export interface LinkProps extends Omit<RRLinkProps, "to"> {
  to: string;
  params?: Params;
  search?: Record<string, unknown>;
}

export function Link({ to, params, search, children, ...rest }: LinkProps) {
  const path = buildPath(to, params) + buildSearch(search);
  return (
    <RRLink to={path} {...rest}>
      {children}
    </RRLink>
  );
}

type NavigateArg =
  | string
  | {
      to: string;
      params?: Params;
      search?: Record<string, unknown>;
      replace?: boolean;
    };

export function useNavigate() {
  const nav = useRRNavigate();
  return React.useCallback(
    (arg: NavigateArg) => {
      if (typeof arg === "string") {
        nav(arg);
        return;
      }
      const path = buildPath(arg.to, arg.params) + buildSearch(arg.search);
      nav(path, { replace: arg.replace });
    },
    [nav],
  );
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useRRParams() as T;
}

export function useSearch<T extends Record<string, string> = Record<string, string>>(): T {
  const loc = useLocation();
  return React.useMemo(() => {
    const out: Record<string, string> = {};
    new URLSearchParams(loc.search).forEach((v, k) => {
      out[k] = v;
    });
    return out as T;
  }, [loc.search]);
}

export function useRouterState<T>({
  select,
}: {
  select: (s: { location: { pathname: string; search: string; hash: string } }) => T;
}): T {
  const loc = useLocation();
  return select({ location: { pathname: loc.pathname, search: loc.search, hash: loc.hash } });
}

export function useRouter() {
  return {
    invalidate: () => {
      /* no-op in SPA */
    },
  };
}

export const Outlet = RROutlet;
export const Navigate = RRNavigate;
export const HeadContent = () => null;
export const Scripts = () => null;

type MetaTag = Record<string, string | undefined>;
interface HeadResult {
  meta?: MetaTag[];
  links?: Array<Record<string, string | undefined>>;
}

function applyHead(result: HeadResult | undefined) {
  if (!result || typeof document === "undefined") return;
  const meta = result.meta ?? [];
  for (const tag of meta) {
    if (tag.title) {
      document.title = tag.title;
      continue;
    }
    const key = tag.name || tag.property || tag.charSet;
    if (!key) continue;
    const selector = tag.name
      ? `meta[name="${tag.name}"]`
      : tag.property
        ? `meta[property="${tag.property}"]`
        : `meta[charset]`;
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      if (tag.name) el.setAttribute("name", tag.name);
      if (tag.property) el.setAttribute("property", tag.property);
      if (tag.charSet) el.setAttribute("charset", tag.charSet);
      document.head.appendChild(el);
    }
    if (tag.content) el.setAttribute("content", tag.content);
  }
}

export interface RouteLike {
  component: React.ComponentType<unknown>;
  head?: () => HeadResult;
  useParams: typeof useParams;
  useSearch: typeof useSearch;
  useRouteContext: () => Record<string, unknown>;
}

function wrapComponent(cfg: {
  component?: React.ComponentType<unknown>;
  head?: () => HeadResult;
}): React.ComponentType<unknown> {
  const Inner: React.ComponentType<unknown> = cfg.component ?? (() => null);
  const Wrapped: React.ComponentType<unknown> = () => {
    React.useEffect(() => {
      try {
        applyHead(cfg.head?.());
      } catch {
        /* ignore */
      }
    }, []);
    return <Inner />;
  };
  (Wrapped as { displayName?: string }).displayName =
    (Inner as { displayName?: string }).displayName || Inner.name || "RouteComponent";
  return Wrapped;
}

export function createFileRoute(_path: string) {
  return (cfg: {
    component?: React.ComponentType<unknown>;
    head?: () => HeadResult;
    [k: string]: unknown;
  }): RouteLike => {
    const Wrapped = wrapComponent(cfg);
    return {
      component: Wrapped,
      head: cfg.head,
      useParams,
      useSearch,
      useRouteContext: () => ({}),
    };
  };
}

export function createRootRouteWithContext<_C>() {
  return (cfg: {
    component?: React.ComponentType<unknown>;
    head?: () => HeadResult;
    notFoundComponent?: React.ComponentType<unknown>;
    errorComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
    [k: string]: unknown;
  }) => ({
    ...cfg,
    component: wrapComponent(cfg),
  });
}
