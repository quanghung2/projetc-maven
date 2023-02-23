export interface TestInput {
  key: string;
  title: string;
  dataType: string;
  arrayItemDataType: string;
  arrayItems: TestInput[];
}

export interface TestInputReq {
  path: string;
  value: string | number | boolean;
  arrayItems: TestInputReq[];
}
