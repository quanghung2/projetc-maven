import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { ComplianceService, ModalMessage, ModalService } from '../../shared';
import { ComplianceModalComponent } from '../compliance-modal.component';

declare var jQuery: any;
declare var X: any;

@Component({
  selector: 'app-compliance-setting-modal',
  templateUrl: './compliance-setting-modal.component.html',
  styleUrls: ['./compliance-setting-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ComplianceSettingModalComponent implements OnInit {
  @ViewChild('tabElements', { static: true }) tabElements: ElementRef;

  public awsRegions = [
    {
      code: 'us-east-1',
      name: 'US East (N. Virginia)'
    },
    {
      code: 'us-east-2',
      name: 'US East (Ohio)'
    },
    {
      code: 'us-west-1',
      name: 'US West (N. California)'
    },
    {
      code: 'ca-central-1',
      name: 'Canada (Central)'
    },
    {
      code: 'eu-central-1',
      name: 'EU (Frankfurt)'
    },
    {
      code: 'eu-west-1',
      name: 'EU (Ireland)'
    },
    {
      code: 'eu-west-2',
      name: 'EU (London)'
    },
    {
      code: 'eu-west-3',
      name: 'EU (Paris)'
    },
    {
      code: 'ap-northeast-1',
      name: 'Asia Pacific (Tokyo)'
    },
    {
      code: 'ap-northeast-2',
      name: 'Asia Pacific (Seoul)'
    },
    {
      code: 'ap-southeast-1',
      name: 'Asia Pacific (Singapore)'
    },
    {
      code: 'ap-southeast-2',
      name: 'Asia Pacific (Sydney)'
    },
    {
      code: 'ap-south-1',
      name: 'Asia Pacific (Mumbai)'
    },
    {
      code: 'sa-east-1',
      name: 'South America (São Paulo)'
    }
  ];

  public isLoading: boolean = false;
  public settings: any = {
    ftpConfig: {},
    incoming: {},
    awsConfig: {},
    crypto: {},
    postbackRecordedUrl: '',
    b3networksSignPublicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----

    mQENBFtCx/YBCADYCqdPhjMV2m4fjXasCThy0FyvnR4f9y0Aq2fyE//9Ss+2t92h
    8yX1XSlcZ4x6ZURAfaKFRG4Mn4FTh3ojCBiP/wq1UmhaTVpraPlkW9ZqS6HaRUsU
    IAlZEjZOLY9LvWMQMyxlwj8I5hKvnc1mOnbPc0ZduV8k+uWTHk/HBEvZDHtstGXb
    cqNp2hH2fLc2e0FIVN3OoxeYig7jw64GBCsyPl+Yh7gUh1YBQH1z46Y20X+gawMT
    RarD8r6IDDyFY1EYQTlrIHzFp5plDDAIPmW4TtXyYYP5ICLi2oOh90/vGj3eeaIj
    84Q3U9xw4WDU3rZEqzxR0ZVifk+AWpWTcKZ9ABEBAAG0I0IzTmV0d29ya3MgPHN1
    cHBvcnRAYjNuZXR3b3Jrcy5jb20+iQFOBBMBCAA4FiEEbcTK/eC3R5rJ0LZnNnQ1
    s+icjqYFAltCx/YCGwMFCwkIBwIGFQoJCAsCBBYCAwECHgECF4AACgkQNnQ1s+ic
    jqafXwf8C4Nb87+vhFE/vR+Yx1h1w8OldIxGr7ValrIvfUTnNxF6u7p3oD5yekvp
    iMIMs7+LYoumfx9/YKuyLjQr/p26ARgPMUic/I/eag27nonMT8ToKcxHOqjV5bB/
    a2CG2Xmn5tz9ymlUjsWivn2FBuLIQBoYWCOIrghCAZAzaOSVyyTdwHOf9xSxT5T4
    oS+5oHZBelSwULzfjjSe+5IEEi186InElj6iEUmS16HguUmQsvvzNdTJ5LpCGcYC
    /s+TIikc3vKwxib6gLjxk5rEyQjRDlNS5QeVQ8bHXp7WQj0hGbNT5Lso40GyZnKG
    DclRju/ukcz4SqIA6HolArcf9XX4zLkBDQRbQsf2AQgA2tzSzofO8YTuzeqFTdqL
    5V5gXlbdul/N76auqyhVY4Aqln+ND3RBld5QMdnDRNjlbYFEA8THcM9CyDMltxay
    3qL8B5OngeegDXKvn9mbI8fGuoc8ucxlA11miCbLTaD0BG8LYnBkx/JZIGQBXCvB
    zQIDycLB0bPn1EO1X3k91N58VCOd5d/nY/G/5JCKn+FnENbr6RxekfjR72IYDBTj
    Cm3eYeavxFnVJdk27TMLTkfv10U2wFFeOmMUV9GIEw1iUocbmLDMid9UgspwAjlN
    3LJN3U7BY7in9t8tYGOR2bp54uvcziv9wbuZ7MYyq6XE/COTO3H0Hp5kvXuxBHHF
    eQARAQABiQE2BBgBCAAgFiEEbcTK/eC3R5rJ0LZnNnQ1s+icjqYFAltCx/YCGwwA
    CgkQNnQ1s+icjqZ/XAf9HdeovSQqJRUveM/1XIB6k1bk2ohQ6KmTDwFr6iCXBeGE
    2pSHIazz5EwTkRtpgdq4SI3hX7JkEMfWzoxyjACBgPxoWqw3VRnNFNh7Kk+wrdh8
    GVtx2T86BuwLma+ZSiAqdgMnPdok5oPJQxm5p+a8aVNmSts0Iyrd2k1iKRhNTSGr
    Prcbs9MWdKyrEmIJfMuFb4/XVBkTM22HgYVWs1tMlUg45RxzKU2/KK5Aj3PO7n0j
    plPOyGmcdFccZ1yUXh0IPLBKipkBpmYVdJngJGrwYdme2nkmxazbn6Hho8IoC5pB
    xjda2n7Sq8BDNWcCP5lfHVZO6JUNOQfQV6ET3wnJLg==
    =QQk5
    -----END PGP PUBLIC KEY BLOCK-----    
    `
  };

  constructor(private complianceService: ComplianceService, private modalService: ModalService) {}

  ngOnInit() {
    jQuery('#region-dropdown').dropdown();
  }

  ngAfterViewInit() {
    jQuery(this.tabElements.nativeElement)
      .find('.ui.tabular .item')
      .tab({
        onLoad: () => {
          ModalComponent.on('refresh');
        }
      });

    this.getSettings();
  }

  getSettings() {
    let self = this;
    this.isLoading = true;
    this.complianceService.getSettings().then(
      (res: any) => {
        if (res.sftp != undefined && res.sftp.ftpConfig != undefined) {
          this.settings.ftpConfig = res.sftp.ftpConfig;
          if (res.sftp.postbackRecordedUrl != '') {
            this.settings.postbackRecordedUrl = res.sftp.postbackRecordedUrl;
          }
        }

        if (res.aws != undefined && res.aws.awsConfig != undefined) {
          this.settings.awsConfig = res.aws.awsConfig;
          if (res.aws.postbackRecordedUrl != '') {
            this.settings.postbackRecordedUrl = res.aws.postbackRecordedUrl;
          }
        }

        if (res.crypto != undefined) {
          this.settings.crypto = res.crypto;
        }
        this.isLoading = false;
      },
      res => {
        X.showWarn('Failed to fetch Organization Config');
      }
    );
  }

  onUpdate(event) {
    this.isLoading = true;
    this.complianceService.setSettings(this.settings).then(
      (res: any) => {
        this.isLoading = false;
        this.settings.ftpConfig = res.ftpConfig;
        X.showSuccess('Update successfully');
        // this.openComplianceModal();
      },
      res => {
        this.isLoading = false;
        X.showWarn('Fail to update');
      }
    );
    this.complianceService.setAwsSettings(this.settings);
    this.complianceService.setCryptoSettings(this.settings.crypto);
    event.stopPropagation();
    event.preventDefault();
  }

  openComplianceModal() {
    let message = new ModalMessage(ComplianceModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }
}
