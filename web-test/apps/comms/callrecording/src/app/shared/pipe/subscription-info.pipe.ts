import { Pipe, PipeTransform } from '@angular/core';
import { AppType, CRSubscription } from '../model';

@Pipe({
  name: 'subscriptionInfo'
})
export class SubscriptionInfoPipe implements PipeTransform {
  transform(subscription: CRSubscription, label: string, reload: boolean): string {
    let result = '';
    switch (label) {
      case 'RECORDING_TYPE':
        result = this.parseRecordingType(subscription);
        break;
      case 'ASSIGNED_TYPE':
        result = this.parseAssignedPlan(subscription);
        break;
      case 'STATUS':
        result = this.parseStatusRecord(subscription);
        break;
      default:
        result = '-';
    }

    return result;
  }

  parseRecordingType(sub: CRSubscription) {
    if (sub.plan == undefined) {
      return '???';
    }
    if (sub.plan.name == 'number_of_bp_ext' && sub.plan.numOfConcurrentCall > 0) {
      return sub.plan.numOfConcurrentCall + ' Users';
    }
    if (sub.plan.numOfConcurrentCall == 0 || sub.plan.numOfConcurrentCall >= 30) {
      return 'Business Ultimate';
    }
    if (sub.plan.numOfConcurrentCall >= 10) {
      return 'Business Plus';
    }
    if (sub.plan.numOfConcurrentCall >= 5) {
      return 'Business';
    }
    if (sub.plan.numOfConcurrentCall >= 2) {
      return 'Professional';
    }
    return 'Wrong plan';
  }

  parseAssignedPlan(sub: CRSubscription) {
    if (sub.assignedPlan < 0 || sub.assignedPlan >= 30) {
      return 'Business Ultimate';
    }
    if (sub.assignedPlan >= 10) {
      return 'Business Plus';
    }
    if (sub.assignedPlan >= 5) {
      return 'Business';
    }
    if (sub.assignedPlan >= 2) {
      return 'Professional';
    }
    return 'Wrong plan';
  }

  parseStatusRecord(subscription: CRSubscription) {
    try {
      if (subscription.assignedTo == undefined || subscription.assignedConfig == undefined) {
        return '-';
      }

      let config = subscription.assignedConfig;

      if (subscription.assignedApp == AppType.VIRTUAL_LINE) {
        if (config.isAppV2) {
          return config.enableCallRecording ? 'Record all' : 'Do not record';
        }

        config = config.incomings;
        let monitors = [config.OFFICE_HOURS, config.AFTER_OFFICE_HOURS, config.PUBLIC_HOLIDAY];

        if (monitors.filter(monitor => monitor.needMonitor != 'RECORD_ALL').length == 0) {
          return 'Record all';
        } else {
          for (let i = 0; i < monitors.length; i++) {
            let monitor = monitors[i];
            if (monitor.extensions != undefined && monitor.extensions.length > 0) {
              monitor.extensions.forEach(ext => {
                monitors.push(ext);
              });
            }
          }

          if (monitors.length > 3) {
            let count = monitors
              .slice(3)
              .filter(monitor => monitor.needMonitor == 'RECORD_ALL' && monitor.extensions == undefined).length;
            if (count > 0) {
              return `${count} extensions recorded`;
            }
          }
        }
        return 'Do not record';
      } else if (subscription.assignedApp == AppType.DIRECT_LINE) {
        if (config.isMonitor == true) {
          return 'Record all';
        }

        return 'Do not record';
      } else if (subscription.assignedApp == AppType.SIP) {
        if (config == undefined || config.code == 'app-sipv2.incomingconfigNotFound') {
          return 'SIP account not found';
        }

        let incoming = false;
        let outgoing = false;
        if (config.incoming != undefined && config.incoming.status == 'enabled') {
          incoming = true;
        }

        if (config.outgoing != undefined && config.outgoing.status == 'enabled') {
          outgoing = true;
        }

        if (incoming && outgoing) {
          return 'Record all';
        }

        if (incoming) {
          return 'Record incoming';
        }

        if (outgoing) {
          return 'Record outgoing';
        }

        return 'Do not record';
      }
    } catch (e) {
      console.error(e);
    }

    return 'Do not record';
  }
}
