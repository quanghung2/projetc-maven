export interface ExtensionData {
  key: string;
  label: string;
  type: string;
  extensionType: string;
}

export interface ExtensionNumber {
  number: string;
  isDevice: boolean;
  extensionData: ExtensionData;
}

export interface AssignedNumber {
  number: string;
  status: AssignedNumberStatus;
}

export enum AssignedNumberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
