export enum MATCHING {
  lpm = 'lpm',
  em = 'em',
  eq = 'eq',
  ne = 'ne',
  gt = 'gt',
  lt = 'lt',
  ge = 'ge',
  le = 'le'
}

export enum Context {
  inside = 'inside',
  outside = 'outside'
}

export enum Direction {
  inbound = 'inbound',
  outbound = 'outbound'
}

export interface DeleteClidRoutingReq {
  planname?: string;
  context?: string;
  clid?: string;
  dnis?: string;
  matching?: MATCHING;
  tag?: string;
}

export interface DeleteDnisRoutingReq {
  planname?: string;
  context?: string;
  dnis?: string;
  matching?: MATCHING;
}

export interface CRURoutingReq {
  planname?: string;
  context?: string;
}

export class Routing {
  tag?: string;
  clid?: string;
  dnis?: string;
  matching: MATCHING;
  peer1: string;
  peer2: string;
  load: string;
}

export interface Route {
  primary: string;
  secondary: string;
  load: number;
}

export interface Table {
  action: string;
  name: string;
  variable?: string;
  routes?: Route;
  records?: Record[];
}

export interface Record {
  matching: MATCHING;
  value: string;
  action: 'refer' | 'route' | 'block';
  routes: Route;
}
