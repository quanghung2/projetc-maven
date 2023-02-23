export interface CardConfig {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

export class Card {
  uuid: string;
  dashboardUuid: string;
  questionUuid: string;
  name: string;
  config: CardConfig;
  createdAt: Date;
  updatedAt: Date;

  static fromResp(obj?: any) {
    const instance = Object.assign(new Card(), obj);
    if (!instance.config) {
      instance.config = { x: 0, y: 0, cols: 1, rows: 1 };
    }
    return instance;
  }
}
