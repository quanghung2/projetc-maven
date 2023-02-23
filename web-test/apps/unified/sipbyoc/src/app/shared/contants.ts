import { HashMap } from '@datorama/akita';

export enum ROUTE_LINK {
  account = 'account',
  security = 'security',
  incoming_setting = 'incoming_setting'
}

export interface RouteMap {
  urlPath: ROUTE_LINK;
  displayText: string;
  order: number;
}

export const MENU_ROUTE_MAPS: HashMap<RouteMap> = {
  account: { urlPath: ROUTE_LINK.account, displayText: 'Account', order: 1 },
  security: { urlPath: ROUTE_LINK.security, displayText: 'Security', order: 2 },
  incoming_setting: { urlPath: ROUTE_LINK.incoming_setting, displayText: 'Number Setting', order: 3 }
};

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';
