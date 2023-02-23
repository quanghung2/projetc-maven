export class TimeInterval {
  private _fromHour: number = null;
  public get fromHour(): number {
    return this._fromHour;
  }

  private _fromMinute: number = null;
  public get fromMinute(): number {
    return this._fromMinute;
  }

  private _toHour: number = null;
  public get toHour(): number {
    return this._toHour;
  }

  private _toMinute: number = null;
  public get toMinute(): number {
    return this._toMinute;
  }

  private _str: string = null;

  constructor() {}

  static parse(obj: string): TimeInterval | null {
    try {
      const intervalRegex = /^(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})$/;
      const m = intervalRegex.exec(obj);
      if (m != null) {
        const fromHour = parseInt(m[1], 10);
        const fromMinute = parseInt(m[2], 10);
        const toHour = parseInt(m[3], 10);
        const toMinute = parseInt(m[4], 10);
        return TimeInterval.of(fromHour, fromMinute, toHour, toMinute);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
    return null;
  }

  static of(fromHour: number, fromMinute: number, toHour: number, toMinute: number): TimeInterval {
    const t = new TimeInterval();
    t._fromHour = fromHour;
    t._fromMinute = fromMinute;
    t._toHour = toHour;
    t._toMinute = toMinute;
    t._str = t.getFromString() + '-' + t.getToString();
    return t;
  }

  toString(): string {
    return this._str;
  }

  getFromString(): string {
    if (this.fromHour != null && this.fromMinute != null) {
      return `${this.fromHour.toString().padStart(2, '0')}:${this.fromMinute.toString().padStart(2, '0')}`;
    }
    return null;
  }

  getToString(): string {
    if (this.toHour != null && this.toMinute != null) {
      return `${this.toHour.toString().padStart(2, '0')}:${this.toMinute.toString().padStart(2, '0')}`;
    }
    return null;
  }

  equals(t: TimeInterval) {
    return (
      this.fromHour === t.fromHour &&
      this.fromMinute === t.fromMinute &&
      this.toHour === t.toHour &&
      this.toMinute === t.toMinute
    );
  }

  isValid(): boolean {
    return this.fromHour != null && this.fromMinute != null && this.toHour != null && this.toMinute != null;
  }

  isOverlapped(t: TimeInterval) {
    const from = this.fromHour * 60 + this.fromMinute;
    const to = this.toHour * 60 + this.toMinute;

    const tFrom = t.fromHour * 60 + t.fromMinute;
    const tTo = t.toHour * 60 + t.toMinute;

    return from < tTo && tFrom < to;
  }

  clone(): TimeInterval {
    const t = new TimeInterval();
    t._fromHour = this._fromHour;
    t._fromMinute = this._fromMinute;
    t._toHour = this._toHour;
    t._toMinute = this._toMinute;
    t._str = this._str;

    return t;
  }
}
