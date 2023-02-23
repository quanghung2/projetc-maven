export class Accessible {
  id: string;
  code: string;
  type: string;
  accessor: string;
  showInReportApp: boolean;
  label?: string;
  constructor(obj?: Partial<Accessible>) {
    if (obj) {
      obj.id = obj.code;
      Object.assign(this, obj);
    }
  }
}
