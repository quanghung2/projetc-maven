import { AppSettings } from './callcenter-setting.model';

export interface MemberSettingsAppSettings extends AppSettings {
  unifiedHistory: {
    ignoreColumns: string[];
  };
}
