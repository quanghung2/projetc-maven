export class Identity {
  uuid: string;

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
