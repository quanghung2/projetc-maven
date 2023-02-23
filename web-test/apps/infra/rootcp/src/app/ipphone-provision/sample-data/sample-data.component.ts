import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EnumProtocolSIP, EnumServerPortSIP } from '@b3networks/api/bizphone';
import { IPPhoneProvision, IpPhoneProvisionService, SampleData } from '@b3networks/api/ipphoneprovisioning';
import { STUN_SERVER } from '@b3networks/shared/common';
import { saveAs } from 'file-saver';

export interface SampleDataDialog {
  ipPhoneProvision: IPPhoneProvision;
  sampleData: SampleData;
}

@Component({
  selector: 'b3n-sample-data',
  templateUrl: './sample-data.component.html',
  styleUrls: ['./sample-data.component.scss']
})
export class SampleDataComponent implements OnInit {
  formGroup: UntypedFormGroup;
  uploading: boolean;

  codecList: KeyValue<string, string>[] = [
    { key: 'g711a', value: 'G711A' },
    { key: 'g711u', value: 'G711U' },
    { key: 'opus', value: 'Opus' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: SampleDataDialog,
    private dialogRef: MatDialogRef<SampleDataComponent>,
    private ipPhoneProvisionService: IpPhoneProvisionService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      username: this.data?.sampleData?.username,
      password: this.data?.sampleData?.password,
      domain: this.data?.sampleData?.domain,
      label: this.data?.sampleData?.label,
      timezone: this.data?.sampleData?.timezone,
      codec: this.data?.sampleData?.codec || 'g711a',
      tls:
        this.data?.sampleData?.protocol === EnumProtocolSIP.tls &&
        this.data?.sampleData?.port === EnumServerPortSIP.port5061,
      stun: ''
    });
  }

  download() {
    let req = this.formGroup.value as SampleData;
    if (req?.['tls']) {
      req = {
        ...req,
        protocol: EnumProtocolSIP.tls,
        port: EnumServerPortSIP.port5061
      };
    } else {
      req = {
        ...req,
        protocol: EnumProtocolSIP.tcp,
        port: EnumServerPortSIP.port5060
      };
    }

    if (req?.['stun']) {
      req = {
        ...req,
        stunServer: STUN_SERVER
      };
    } else {
      req = {
        ...req,
        stunServer: ''
      };
    }

    this.ipPhoneProvisionService
      .downloadSampleData(this.data.ipPhoneProvision.brand, this.data.ipPhoneProvision.model, req)
      .subscribe(resp => {
        const blob = new Blob([resp.body], { type: `${resp.body.type}` });
        saveAs(blob, `${this.data.ipPhoneProvision.brand}_${this.data.ipPhoneProvision.model}_sample_data.cfg`);
        this.dialogRef.close();
      });
  }
}
