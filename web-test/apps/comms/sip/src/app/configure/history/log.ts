export class Compliance {
  action: string;
  dncStatus: string;
  consentStatus: string;
}

export class MonitorS3 {
  key: string;
  region: string;
  s3Bucket: string;
}

export class Log {
  callCharge: number;
  callStatus: string;
  callType: string;
  callerId: string;
  compliance: Compliance;
  monitorS3: MonitorS3;
  action: string;
  consentStatus: string;
  dncStatus: string;
  dest: string;
  dncCharge: number;
  endTime: string;
  id: string;
  key: string;
  orgUuid: string;
  receivedTime: string;
  startTime: string;
  time: string;
  txnUuid: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(obj, this);
    }
  }
}
