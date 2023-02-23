export class Pattern {
  name: string;
  number: string;
  constructor(obj?: Partial<Pattern>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class RangeLimitation {
  min: number;
  max: number;
  constructor(obj?: Partial<RangeLimitation>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Limitation {
  cps: RangeLimitation;
  capacity: RangeLimitation;
  manipulation: ManipulationLimitation;
  max_peer_rule_size: number;

  constructor(obj?: Partial<Limitation>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class PreConfig {
  nodename: string;
  cluster: EdgeCluster;
  directions: string[];
  codecs: string[];
  headers: string[];
  contexts: string[];
  limitation: Limitation;
  pattern: Pattern;
  manipulation: string[];
  constructor(obj?: Partial<PreConfig>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface AwsEdgeServer {
  node: string;
  context: string;
  name: string;
  private_ip: string;
  public_ip: string;
  sip_port: number;
  sips_port: number;
}

export interface EdgeCluster {
  awsedge1: AwsEdgeServer[];
  awsedge2: AwsEdgeServer[];
}
export interface ManipulationLimitation {
  max_antiactions_zize: number;
  max_conditions_size: number;
  max_statements_size: number;
  max_values_zise: number;
}
