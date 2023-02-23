export class GroupHolidays {
  groupUuid: string;
  groupName: string;
  dates: Dates[];

  constructor(obj: Partial<GroupHolidays>) {
    if (obj) {
      Object.assign(this, obj);
      if (!obj.dates) {
        this.dates = [];
      }
    }
  }
}

export interface Dates {
  date: string; // yyyy-MM-dd
  name: string;
}

export interface ReqGetGroupHolidays {
  groupUuid?: string;
  loadDates?: boolean; // default = true
}
