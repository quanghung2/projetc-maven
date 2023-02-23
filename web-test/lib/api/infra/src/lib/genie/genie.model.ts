export interface Flow {
  name: string;
  flows: string[];
  executing: boolean[];
}

export interface GenieExecuteReq {
  flow: string;
  category: string;
  input?: any;
}

export interface GenieExecuteRes {
  code: string;
  params: string[];
  md: string;
}

export interface Param {
  name: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  filteredOptions?: string[];
}

export interface OpenDialogFillParamsReq {
  flow: string;
  category: string;
  params: Param[];
}
