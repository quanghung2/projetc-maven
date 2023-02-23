export class Server {
  _idKey: number;
  advertiseIp: string;
  apiPort: number;
  apiProtocol: string;
  apiSecure: boolean;
  cluster: string;
  domain: string;
  ip: string;
  mgntIp: string;
  nodeName: string;
  version: string;

  constructor(obj?: Partial<Server>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
