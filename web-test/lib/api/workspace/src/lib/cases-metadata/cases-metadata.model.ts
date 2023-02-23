export class CaseMetaData {
  productList: MetaData[];
  caseSeverityList: MetaData[];
  caseTypeList: MetaData[];
  suppliers: Supplier[];

  // ui
  loaded: boolean;
}

export interface MetaData {
  id: number;
  name: string;
  colorHex?: string;
}

export interface Supplier {
  logo: number;
  name: string;
  uuid?: string;
}
