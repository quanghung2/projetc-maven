import {
  addDays,
  addMonths,
  addWeeks,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { TimeRangeKey } from './time-range.enum';
import { TimeRange } from './time-range.model';

export class TimeRangeHelper {
  public static buildTimeRangeFromKey(key: TimeRangeKey, timezone: string): TimeRange {
    const timeRange: TimeRange = <TimeRange>{
      startDate: '',
      endDate: ''
    };
    timeRange.endDate = format(
      addDays(startOfDay(utcToZonedTime(new Date(), timezone)), 1),
      "yyyy-MM-dd'T'HH:mm:ssxxx",
      {
        timeZone: timezone
      }
    );

    switch (key) {
      case TimeRangeKey['5m']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subMinutes(utcToZonedTime(new Date(), timezone), 5), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['15m']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subMinutes(utcToZonedTime(new Date(), timezone), 15), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['30m']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subMinutes(utcToZonedTime(new Date(), timezone), 30), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['1h']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subHours(utcToZonedTime(new Date(), timezone), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['4h']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subHours(utcToZonedTime(new Date(), timezone), 4), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['12h']:
        timeRange.endDate = format(utcToZonedTime(new Date(), timezone), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.startDate = format(subHours(utcToZonedTime(new Date(), timezone), 12), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey['24h']:
        timeRange.startDate = format(startOfDay(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.endDate = format(
          addDays(startOfDay(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.today:
        timeRange.startDate = format(startOfDay(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey.yesterday:
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        timeRange.endDate = format(startOfDay(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey.last7days:
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), 6),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.last30days:
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), 29),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.last60days:
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), 59),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.last90days:
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), 89),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.lastWeek:
        timeRange.startDate = format(
          subWeeks(addDays(startOfWeek(utcToZonedTime(new Date(), timezone)), 1), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        timeRange.endDate = format(startOfWeek(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey.lastMonth:
        timeRange.startDate = format(
          subMonths(startOfMonth(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        timeRange.endDate = format(startOfMonth(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        break;
      case TimeRangeKey.last6months:
        timeRange.startDate = format(
          subMonths(startOfDay(utcToZonedTime(new Date(), timezone)), 6),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.last1year:
        timeRange.startDate = format(
          subYears(startOfDay(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.thisWeek:
        timeRange.startDate = format(
          addDays(startOfWeek(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        timeRange.endDate = format(
          addDays(addWeeks(startOfWeek(utcToZonedTime(new Date(), timezone)), 1), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case TimeRangeKey.thisMonth:
        timeRange.startDate = format(startOfMonth(utcToZonedTime(new Date(), timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        });
        timeRange.endDate = format(
          addMonths(startOfMonth(utcToZonedTime(new Date(), timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
    }

    return timeRange;
  }

  public static buildDynamicTimeRangeFromKey(key: string, timezone: string): TimeRange {
    const timeRange: TimeRange = <TimeRange>{
      startDate: '',
      endDate: ''
    };

    timeRange.endDate = format(
      addDays(startOfDay(utcToZonedTime(new Date(), timezone)), 1),
      "yyyy-MM-dd'T'HH:mm:ssxxx",
      {
        timeZone: timezone
      }
    );

    const [count, type] = key.split(/([0-9]+)/).filter(t => !!t);

    switch (type) {
      case 'd':
        timeRange.startDate = format(
          subDays(startOfDay(utcToZonedTime(new Date(), timezone)), +count - 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
      case 'M':
        timeRange.startDate = format(
          subMonths(startOfDay(utcToZonedTime(new Date(), timezone)), +count),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: timezone
          }
        );
        break;
    }

    return timeRange;
  }

  public static buildCustomDate(date: Date, timezone: string): TimeRange {
    const timeRange: TimeRange = <TimeRange>{
      startDate: '',
      endDate: ''
    };

    timeRange.startDate = format(startOfDay(utcToZonedTime(date, timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: timezone
    });

    timeRange.endDate = format(addDays(startOfDay(utcToZonedTime(date, timezone)), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: timezone
    });

    return timeRange;
  }

  public static buildSpecificDate(startDate: Date, endDate: Date, timezone: string): TimeRange {
    const timeRange: TimeRange = <TimeRange>{
      startDate: '',
      endDate: ''
    };

    timeRange.startDate = format(startOfDay(utcToZonedTime(startDate, timezone)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: timezone
    });

    timeRange.endDate = format(addDays(startOfDay(utcToZonedTime(endDate, timezone)), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: timezone
    });

    return timeRange;
  }

  public static getPeriod(key: TimeRangeKey) {
    let period: string;
    switch (key) {
      case TimeRangeKey['15m']:
      case TimeRangeKey['30m']:
      case TimeRangeKey['1h']:
      case TimeRangeKey['1d']:
        period = key.valueOf();
        break;
      case TimeRangeKey['4h']:
      case TimeRangeKey['12h']:
        period = '1h';
        break;
      case TimeRangeKey['today']:
      case TimeRangeKey['24h']:
      case TimeRangeKey['yesterday']:
      case TimeRangeKey.lastWeek:
      case TimeRangeKey.last7days:
      case TimeRangeKey.last30days:
      case TimeRangeKey.last60days:
      case TimeRangeKey.last90days:
      case TimeRangeKey.thisWeek:
      case TimeRangeKey.thisMonth:
        period = '1d';
        break;
      case TimeRangeKey.lastMonth:
      default:
        period = '1M';
        break;
    }

    return period;
  }
}
