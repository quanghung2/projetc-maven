export class Source {
  id: string;
  descriptor: string;
  statement: string;
  iam: boolean;
  esIndex: string;
  constructor(obj?: Partial<Source>) {
    if (obj) {
      obj.id = obj.descriptor;
      Object.assign(this, obj);
    }
  }
}
