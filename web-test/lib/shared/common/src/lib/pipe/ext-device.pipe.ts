import { Pipe, PipeTransform } from '@angular/core';

enum DeviceType {
  IP_PHONE = 'IP_PHONE',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  SIP_GATEWAY = 'SIP_GATEWAY',
  WEBRTC = 'WEBRTC',
  MSTEAM = 'MSTEAM',
  MSISDN = 'MSISDN',
  DELEGATED = 'DELEGATED'
}

@Pipe({
  name: 'extDevice'
})
export class ExtDevicePipe implements PipeTransform {
  transform(device: any): string {
    switch (device) {
      case DeviceType.DESKTOP:
        return 'Desktop';
      case DeviceType.IP_PHONE:
      case 'ip_phone':
        return 'IP Phone';
      case DeviceType.MOBILE:
        return 'Mobile';
      case DeviceType.SIP_GATEWAY:
        return 'SIP Gateway';
      case DeviceType.WEBRTC:
        return 'Web Phone';
      case DeviceType.MSTEAM:
        return 'Microsoft Teams';
      case DeviceType.MSISDN:
        return 'SIM';
      case DeviceType.DELEGATED:
        return 'Delegated';
      default:
        return device;
    }
  }
}
