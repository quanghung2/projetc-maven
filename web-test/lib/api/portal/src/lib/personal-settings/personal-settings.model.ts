import { CallcenterAppSettings } from './callcenter-setting.model';
import { DashboardV2AppSetting } from './dashboard-setting-v2.model';
import { DashboardAppSetting } from './dashboard-setting.model';
import { MemberSettingsAppSettings } from './member-setting.model';
import { UnifiedWorkspaceSetting } from './unified-workspace-setting-model';
import {CommunicationAppSettings} from "./communication-setting.model";

export type PersonalAppSettings =
  | CallcenterAppSettings
  | DashboardAppSetting
  | UnifiedWorkspaceSetting
  | MemberSettingsAppSettings
  | DashboardV2AppSetting
  | CommunicationAppSettings;

export interface PersonalSettings {
  darkMode: boolean;
  apps: Array<PersonalAppSettings>;
}
