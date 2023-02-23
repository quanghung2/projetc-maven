export interface AppState {
  loading: boolean;
  showSidebar: boolean;
}

export function createAppState(params: Partial<AppState>) {
  return { loading: false, showSidebar: false } as AppState;
}
