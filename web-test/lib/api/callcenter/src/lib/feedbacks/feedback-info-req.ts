export class FeedbackInfoReq {
  rate: number;
  message: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
