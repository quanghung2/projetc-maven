import { Component, ElementRef, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import {
  OrgConfig,
  OrgConfigQuery,
  OrgConfigService,
  QueueConfig,
  Transfer2GenieConfig
} from '@b3networks/api/callcenter';
import { SkillCatalog, SkillCatalogQuery } from '@b3networks/api/intelligence';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
@Component({
  selector: 'b3n-authentication-flow',
  templateUrl: './authentication-flow.component.html',
  styleUrls: ['./authentication-flow.component.scss']
})
export class AuthenticationFlowComponent extends DestroySubscriberComponent implements OnInit {
  listTransfer2GenieConfig: Transfer2GenieConfig[] = [];
  loading = false;
  queue: QueueConfig;
  skills: SkillCatalog[];
  _formAll: UntypedFormArray = this.fb.array([]);
  isValid = true;
  progressing: boolean;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private fb: UntypedFormBuilder,
    private spinnerService: LoadingSpinnerSerivce,
    private skillCatalogQuery: SkillCatalogQuery,
    private toastService: ToastService,
    private eleRef: ElementRef,
    private orgConfigService: OrgConfigService
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([this.skillCatalogQuery.selectLoading(), this.orgConfigQuery.selectLoading()]).subscribe(
      ([loading1, loading2]: [boolean, boolean]) => {
        if (loading1 || loading2) {
          this.spinnerService.showSpinner();
        } else {
          this.spinnerService.hideSpinner();
        }
      }
    );

    combineLatest([this.orgConfigQuery.orgConfig$, this.skillCatalogQuery.skillsStore$])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        ([config, skills]: [OrgConfig, SkillCatalog[]]) => {
          this.listTransfer2GenieConfig = [];
          this._formAll.clear();
          this.listTransfer2GenieConfig = this.createListTransfer(config.transfer2GenieConfig);
          this.skills = skills;
        },
        err => {
          this.toastService.error(err.message);
        }
      );

    this._formAll.statusChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      this.isValid = status === 'VALID';
    });
  }

  createListTransfer(transfer2GenieConfig: HashMap<Transfer2GenieConfig>) {
    const arrTransfer: Transfer2GenieConfig[] = [];
    if (transfer2GenieConfig && Object.keys(transfer2GenieConfig).length > 0) {
      const keys = Object.keys(transfer2GenieConfig);
      keys.forEach(value => {
        arrTransfer.push(new Transfer2GenieConfig(value, transfer2GenieConfig[value]));
      });
    } else {
      arrTransfer.push(new Transfer2GenieConfig(''));
    }
    return arrTransfer;
  }

  onAddMore() {
    const item = new Transfer2GenieConfig('');
    this.listTransfer2GenieConfig.push(item);
    setTimeout(() => {
      // scroll end
      this.eleRef.nativeElement.querySelector('.container-authen').scrollIntoView(false);
    }, 200);
  }

  onDeletedItem(index) {
    this.listTransfer2GenieConfig.splice(index, 1);
    this._formAll.removeAt(index);
    this._formAll.updateValueAndValidity();
  }

  update() {
    this.progressing = true;
    const transfer = this._formAll.value;
    const transfer2GenieConfig: HashMap<Transfer2GenieConfig> = {};
    transfer.forEach(item => {
      transfer2GenieConfig[item.codeAuthen] = item;
    });

    this.orgConfigService
      .updateConfig({ transfer2GenieConfig })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('CRM integration has been updated. This update will take effect after 5 minutes.');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
