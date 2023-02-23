export class Template {
  id: string;
  code: string;
  descriptor: string;
  label: string;
  type: string;
  config: object;
  constructor(obj?: Partial<Template>) {
    if (obj) {
      obj.id = obj.code;
      Object.assign(this, obj);
    }
  }
}
