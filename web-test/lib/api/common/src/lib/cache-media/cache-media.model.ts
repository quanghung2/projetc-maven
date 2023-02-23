export class CacheMedia {
  key: string;
  url: string;
  time: number;

  constructor(obj: Partial<CacheMedia>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
