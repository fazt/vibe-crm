let getWorkspaceIdFn: () => string | null = () => null;

export function registerWorkspaceIdGetter(getter: () => string | null) {
  getWorkspaceIdFn = getter;
}

export function getWorkspaceId(): string | null {
  return getWorkspaceIdFn();
}
