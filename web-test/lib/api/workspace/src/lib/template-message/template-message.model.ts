export class Template {
  id: string;
  content: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
