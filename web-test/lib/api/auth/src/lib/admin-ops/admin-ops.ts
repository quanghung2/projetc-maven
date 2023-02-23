export enum PromoteEntityType {
  org = 'ORGANIZATION',
  domain = 'DOMAIN',
  identity = 'IDENTITY'
}

export interface PromoteReq {
  entityUuid: string;
  entityType: PromoteEntityType;
}
