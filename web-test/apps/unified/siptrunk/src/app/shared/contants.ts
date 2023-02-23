import { HashMap } from '@datorama/akita';

export enum ROUTE_LINK {
  overview = 'overview',
  config_detail = 'config-detail',
  networking_info = 'networking-info',
  security = 'security',
  high_availability = 'high-availability'
}

export interface RouteMap {
  urlPath: ROUTE_LINK;
  displayText: string;
  order: number;
}

export const MENU_ROUTE_MAPS: HashMap<RouteMap> = {
  overview: { urlPath: ROUTE_LINK.overview, displayText: 'Overview', order: 1 },
  config_detail: { urlPath: ROUTE_LINK.config_detail, displayText: 'Configuration', order: 2 },
  networking_info: { urlPath: ROUTE_LINK.networking_info, displayText: 'Networking Info', order: 3 },
  security: { urlPath: ROUTE_LINK.security, displayText: 'Security', order: 4 },
  high_availability: { urlPath: ROUTE_LINK.high_availability, displayText: 'High Availability', order: 5 }
};

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';
