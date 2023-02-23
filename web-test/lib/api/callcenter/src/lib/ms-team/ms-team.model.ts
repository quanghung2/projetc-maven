export interface TeamInfo {
  id: number | string;
  teamId: string;
  anyNodeDomain: string;
  dnsTxtRecordKey: string;
  dnsTxtRecordValue: string;
}

export interface TeamExtensionReq {
  msTeamUsername: string;
  extKey?: string;
  ddi?: string[];
}

export class TeamExtension {
  id: {
    orgUuid: string;
    extKey: string;
  };
  didNumbers: string[] = [];
  teamUsername: string;

  get extKey() {
    return this.id.extKey;
  }

  get ddi() {
    return this.didNumbers[0];
  }

  constructor(json?: Partial<TeamExtension>) {
    if (json) {
      Object.assign(this, json);
    }
  }
}
