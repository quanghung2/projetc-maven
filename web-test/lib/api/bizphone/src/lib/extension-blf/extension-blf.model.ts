export class ExtensionBLF {
  monitees: string[];
  moniteesExtKeys: string[];
  monitor: string;
  monitorExtKey: string;

  get extListSorted() {
    return this.moniteesExtKeys
      .map(x => +x)
      .sort((a, b) => a - b)
      .join(', ');
  }

  constructor(obj?: Partial<ExtensionBLF>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
