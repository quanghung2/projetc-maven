import { AuditData } from '@b3networks/api/audit';

export class BaseAuditComponent {
  constructor() {}

  capitalize(text: string) {
    if (!text || text.length == 0) {
      return '';
    } else if (text.length == 1) {
      return text.toUpperCase();
    } else {
      return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
    }
  }

  isDifferent(value1: any, value2: any) {
    let formatted1 = value1 == undefined || value1 == null ? '' : value1;
    let formatted2 = value2 == undefined || value2 == null ? '' : value2;
    return formatted1 != formatted2;
  }

  formatNumber(number: any, postFixString: string) {
    if (!number) {
      return undefined;
    } else {
      return number + ' ' + postFixString;
    }
  }

  formatBoolean(bool: any) {
    if (bool == null || bool == undefined) {
      return undefined;
    } else {
      return bool + '';
    }
  }

  formatMessage(message: string) {
    if (!message || message.length == 0) {
      return undefined;
    }

    return message.replace(/<[^<]+>/gm, '');
  }

  formatId(id: string, auditData: AuditData) {
    if (!id || id.length == 0) {
      return undefined;
    }

    let formattedId = auditData.labelMap[id];
    return !formattedId || formattedId.length == 0 ? 'Unknown' : formattedId;
  }

  normalize(text: string) {
    if (!text || text.length == 0) {
      return 'Unknown';
    } else {
      return text;
    }
  }
}
