export interface Staff {
  uuid: string;
  extKey: string;
}

export interface GetStaffReq {
  identityUuids: string[];
}
