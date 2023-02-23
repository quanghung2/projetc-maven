import { Component, OnInit } from '@angular/core';
import { NewComplianceService } from '../../shared/service/new-compliance.service';

declare let X: any;

@Component({
  selector: 'app-encrypt',
  templateUrl: './encrypt.component.html',
  styleUrls: ['./encrypt.component.css']
})
export class EncryptComponent implements OnInit {
  public encryptConfig: EncryptConfig;

  public editing: boolean;
  public loading: boolean;
  public saving: boolean;

  constructor(private complianceService: NewComplianceService) {}

  ngOnInit() {
    this.encryptConfig = new EncryptConfig();
    this.editing = false;
    this.loading = true;
    this.saving = false;

    this.complianceService
      .getEncryptSetting()
      .then(data => {
        this.encryptConfig = Object.assign(new EncryptConfig(), data);
        this.loading = false;
      })
      .catch((err: any) => {
        this.loading = false;
        console.error(err);
        X.showWarn('Cannot get encrypt information. Please try again later.');
      });
  }

  public saveEncrypt() {
    if (this.encryptConfig && this.encryptConfig.encryptPublicKey) {
      this.saving = true;

      this.complianceService
        .saveEncryptSetting(this.encryptConfig)
        .then(data => {
          this.encryptConfig = Object.assign(new EncryptConfig(), data);
          X.showSuccess('Saved encryption.');
          this.editing = false;
          this.loading = false;
        })
        .catch((err: any) => {
          this.editing = false;
          this.loading = false;
          console.error(err);
          X.showWarn('Error when saving encryption. Please try again later.');
        });
    }
  }
}

export class EncryptConfig {
  constructor(
    public uuid?: string,
    public encryptPublicKey?: string,
    public inUsed?: boolean,
    public createdTime?: any
  ) {}
}
