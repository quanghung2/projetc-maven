export class Cluster {
  cluster: string;

  constructor(obj?: Partial<Cluster>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
