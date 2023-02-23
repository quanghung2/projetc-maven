export interface AdminApplication {
  alwaysVisible: boolean;
  appId: string;
  name: string;
}

export interface AdminApp {
  appId: string;
  name: string;
  visibilityType: string;
  visibilityExceptions: string[];
}
