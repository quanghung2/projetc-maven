import { BundleStatus, OrderStatus } from '@b3networks/api/license';

export interface BundleFilter {
  queryString: string;
  status: null | BundleStatus;
  currentPage: number;
}

export interface OrderFilter {
  buyerUuid: string;
  status: OrderStatus;
  currentPage: number;
}

export interface AppState {
  bundleFilter: BundleFilter;
  orderFilter: OrderFilter;
}

export function createAppState(params: Partial<AppState>) {
  return params as AppState;
}
