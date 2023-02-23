import { HashMap } from '@datorama/akita';

export interface Seller {
  uuid: string;
  name: string;
  plan: string;
}

export interface RoutingPlanRes {
  data: RoutingPlan[];
  success: boolean;
}

export interface RoutingPlan {
  destination: string;
  load: string;
  plan: string;
  primary_route: string;
  route_type: string;
  secondary_route: string;
  source: string;
}

export interface CreateServerReq {
  apiPort: number;
  apiProtocol: string;
  apiSecure: boolean;
  version: string;
  cluster: string;
  domain: string;
  mgntIp: string;
  supplierUuid: string;
  supplierDefaultRoute: boolean;
}

export interface MetadataHealthCheck {
  lastedit: string;
  tags: string[];
}

export interface HealthCheck {
  status: 'OK' | 'NOTOK';
  url?: string;
  version?: string;
}

export interface ResultHealthCheck {
  health: HealthCheck[];
  name: string;
  object: HashMap<String>;
  type: 'marathon' | 'elastalert';
}

export class StatusHealthCheck {
  id: string;
  metadata: MetadataHealthCheck;
  name: string;
  results: ResultHealthCheck[];
  status: 'OK' | 'NOTOK';

  constructor(obj?: Partial<StatusHealthCheck>) {
    if (obj) {
      Object.assign(this, obj);
      this.status = this.results.every(r => r.health.every(h => h.status === 'OK')) ? 'OK' : 'NOTOK';
    }
  }
}

export interface MonitorSetting {
  name: string;
  object: HashMap<String>;
  rule: HashMap<number>;
  type: 'marathon' | 'elastalert';
}

export interface SettingHealthCheck {
  id: string;
  metadata: MetadataHealthCheck;
  monitor: MonitorSetting[];
  name: string;
}
