export class Merge {
  static putAll(source: any, update: any) {
    Object.keys(update).forEach(key => {
      if (update.hasOwnProperty(key)) {
        source[key] = update[key];
      }
    });
  }
  static update(source: any, update: any) {
    Object.keys(update).forEach(key => {
      if (source.hasOwnProperty(key) && update.hasOwnProperty(key)) {
        source[key] = update[key];
      }
    });
  }
}
