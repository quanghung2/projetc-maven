export interface AppState {
  loading: boolean;
  assignedFeatureCodes: string[];
}

export function createAppState(params: Partial<AppState>) {
  return params as AppState;
}
