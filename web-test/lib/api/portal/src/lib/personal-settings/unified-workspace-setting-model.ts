import { AppSettings } from './callcenter-setting.model';

export interface UnifiedWorkspaceSetting extends AppSettings {
  showRightSidebar: boolean;
  unifiedHistory: {
    ignoreColumns: string[];
  };
}
