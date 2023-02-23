import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeviceType, EnumProtocolSIP, ExtDevice } from '@b3networks/api/bizphone';
import { ExtensionService, UpdateExtDevice } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ResetPasswordComponent, ResetPasswordInput } from './reset-password/reset-password.component';
export interface DeviceDialogInput {
  device: ExtDevice;
  extKey: string;
}

export interface CodecList {
  key: string;
  value: string;
}
@Component({
  selector: 'b3n-devices-dialog',
  templateUrl: './devices-dialog.component.html',
  styleUrls: ['./devices-dialog.component.scss']
})
export class DevicesDialogComponent implements OnInit {
  device: ExtDevice;
  extKey: string;
  readonly DeviceType = DeviceType;
  readonly EnumProtocolSIP = EnumProtocolSIP;

  codecList: CodecList[] = [
    { key: 'g711a', value: 'G711A' },
    { key: 'g711u', value: 'G711U' },
    { key: 'opus', value: 'Opus' }
  ];

  constructor(
    private dialog: MatDialog,
    private toastr: ToastService,
    private extensionService: ExtensionService,
    public dialogRef: MatDialogRef<DevicesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeviceDialogInput
  ) {
    this.device = data.device;
    this.extKey = data.extKey;
  }

  ngOnInit(): void {}

  toggleTLS(device: ExtDevice) {
    device.sipAccount.isEnabledTLS ? device.sipAccount.disableTLS() : device.sipAccount.enableTLS();
  }

  toggleSTUN(device: ExtDevice) {
    device.sipAccount.isEnabledSTUN ? device.sipAccount.disableSTUN() : device.sipAccount.enableSTUN();
  }

  toggleIPv6(device: ExtDevice) {
    device.sipAccount.enableIpv6 ? device.sipAccount.disableIPv6() : device.sipAccount.enableIPv6();
  }

  update() {
    const req = <UpdateExtDevice>{
      protocol: this.device.sipAccount.protocol,
      serverPort: this.device.sipAccount.serverPort,
      stunServer: this.device.sipAccount.stunServer,
      codec: this.device.sipAccount.codec,
      enableIpv6: this.device.sipAccount.enableIpv6
    };

    if (this.device.sipAccount.sipDomainName == 'sip7') {
      if (this.EnumProtocolSIP.tls && req.codec == 'opus') {
        if (this.device.sipAccount.protocol == this.EnumProtocolSIP.tls) {
          req.serverPort = '5081';
        } else if (this.device.sipAccount.protocol == this.EnumProtocolSIP.tcp) {
          req.serverPort = '5080';
        }
      } else {
        if (this.device.sipAccount.protocol == this.EnumProtocolSIP.tls) {
          req.serverPort = '5061';
        } else if (this.device.sipAccount.protocol == this.EnumProtocolSIP.tcp) {
          req.serverPort = '5060';
        }
      }
    }

    this.extensionService
      .updateExtDevice(
        { extKey: this.extKey, deviceType: this.device.deviceType, sipUsername: this.device.sipAccount.username },
        req
      )
      .subscribe(
        _ => {
          this.toastr.success('Update configure ' + this.device.deviceType + ' device successfully');
          this.dialogRef.close();
        },
        error => {
          this.toastr.error(error.message);
        }
      );
  }

  resetSipPassword() {
    this.dialog.open(ResetPasswordComponent, {
      data: <ResetPasswordInput>{
        extKey: this.extKey,
        sipUserName: this.device.sipAccount.username,
        deviceType: this.device.deviceType
      },
      disableClose: true,
      width: '400px'
    });
  }
}
