import { MatDateFormats } from '@matheo/datepicker/core';

export const B3N_NATIVE_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
    datetimeInput: null,
    timeInput: null,
    monthInput: null,
    yearInput: null
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    datetimeInput: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric'
    },

    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthInput: { month: 'short', year: 'numeric' },
    yearInput: { year: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthLabel: { month: 'short' },
    monthDayLabel: { month: 'short', day: 'numeric' },
    monthDayA11yLabel: { month: 'long', day: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
    timeLabel: { hours: 'numeric', minutes: 'numeric' }
  }
};
