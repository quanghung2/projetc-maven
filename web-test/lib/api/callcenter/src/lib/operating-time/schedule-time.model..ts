export class ScheduleTime {
  thDay: string;
  isWorking: boolean;
  amFrom: Date;
  amTo: Date;
  pmFrom: Date;
  pmTo: Date;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
