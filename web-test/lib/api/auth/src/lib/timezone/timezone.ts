export class Timezone {
  uuid: string;
  country: string;

  get displayText(): string {
    return `(${this.uuid}) ${this.country}`;
  }

  constructor(data?: Timezone) {
    if (data) {
      for (const key in data) {
        this[key] = data[key];
      }
    }
  }
}
