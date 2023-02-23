export class AccessControlConfig {
  constructor(
    public id?: string,
    public orgUuid?: string,
    public ruleConfig?: ComplianceAccessRule,
    public localPath?: string
  ) {}
}

export class ComplianceAccessRule {
  constructor(
    public uuid?: string,
    public directory?: string,
    public callerIds: string[] = [],
    public accessIdentities: string[] = [],
    public subs: ComplianceAccessRule[] = [],
    public newCallerId: string = '',
    public newIdentity: string = '',
    public selected: boolean = false
  ) {}
}
