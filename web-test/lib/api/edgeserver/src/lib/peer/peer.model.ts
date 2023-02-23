export class Profile {
  codec: string;
  security: string;
  clidtrs: string[];
  dnistrs: string[];
  manipulationrs: string[];
  relay: string;

  constructor(obj?: Partial<Profile>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface Signalling {
  ip: string;
  port: string;
  transport: string;
}
export interface Outparam {
  username?: string;
  password?: string;
  ping?: number;
}

export interface Peer {
  name: string;
  medias?: string[];
  profile: Profile;
  nodes: string[];
  outparam?: Outparam;
  enable: boolean;
  direction?: string;
  interface?: string;
  signallings: Signalling[];
  dtmf_inband: boolean;
}
