export interface AllowedCallerId {
  private: string[];
  identity: string[];
  org: string[];
  delegation: string[];
  auto: string[];
  groupCallerId: string[];
  byocNumbers: string[];
}

export interface DelegatedCallerId {
  extKey: string;
  number: string;
}

export interface UpdateExtDevice {
  serverPort: string;
  protocol: string;
  codec: string;
  stunServer: string;
  enableIpv6: boolean;
  isPrimary?: boolean;
}
