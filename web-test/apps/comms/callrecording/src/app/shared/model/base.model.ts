export class BaseModel {
  constructor(options?: any) {
    if (options) {
      this.update(options);
    }
  }

  update(options?: any) {
    if (!options) {
      return null;
    }
    Object.keys(options).forEach(key => {
      if (this.hasOwnProperty(key) && options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    });
    return this;
  }
}
