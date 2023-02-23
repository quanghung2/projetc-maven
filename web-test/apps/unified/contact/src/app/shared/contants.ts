import { HashMap } from '@datorama/akita';

export enum ROUTE_LINK {
  company = 'company',
  personal = 'personal'
}

export interface RouteMap {
  urlPath: ROUTE_LINK;
  displayText: string;
  order: number;
}

export const MENU_ROUTE_MAPS: HashMap<RouteMap> = {
  company: { urlPath: ROUTE_LINK.company, displayText: 'Company Blacklist/Whitelist', order: 1 },
  personal: { urlPath: ROUTE_LINK.personal, displayText: 'Personal Whitelist', order: 2 }
};

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';
