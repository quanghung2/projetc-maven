import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RenewalConfig, RenewalConfigService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-renewal-date-config',
  templateUrl: './renewal-date-config.component.html',
  styleUrls: ['./renewal-date-config.component.scss']
})
export class RenewalDateConfigComponent extends DestroySubscriberComponent implements OnInit {
  form: UntypedFormGroup;
  renewalConfigs: RenewalConfig[] = [];
  renewalConfigsFilter: RenewalConfig[] = [];
  loading: boolean;
  saving: boolean;

  constructor(
    private renewalConfigService: RenewalConfigService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.initForm();
    this.initData();
  }

  async initData() {
    try {
      this.loading = true;
      this.renewalConfigs = await this.renewalConfigService.getRenewalConfigs().toPromise();
      this.renewalConfigsFilter = [...this.renewalConfigs];
      this.loading = false;
    } catch (e) {
      this.toastService.warning(e['message']);
    }
  }

  initForm() {
    this.form = this.fb.group({
      domain: ['', [Validators.required]],
      renewDaysBefore: ['', [Validators.required, Validators.min(0)]]
    });

    this.form.controls['domain'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(res => {
          if (typeof res === 'string') {
            const value = (res as string).toLowerCase().trim();
            this.renewalConfigsFilter = this.renewalConfigs.filter(r => r.domain.toLowerCase().trim().includes(value));
          } else {
            this.renewDaysBefore.setValue(res.renewDaysBefore);
          }
        })
      )
      .subscribe();
  }

  displayFn(renewalConfigs: RenewalConfig) {
    return renewalConfigs ? renewalConfigs.domain : null;
  }

  save() {
    this.saving = true;
    const { domain, renewDaysBefore } = this.form.value;
    const body: Partial<RenewalConfig> = {};
    body.renewDaysBefore = renewDaysBefore;

    if (typeof domain === 'string') {
      const renewalConfig = this.renewalConfigs.find(r => r.domain === domain.trim());

      if (renewalConfig) {
        body.domain = domain;
      } else {
        this.toastService.warning('Domain is invalid');
        this.saving = false;
        return;
      }
    } else {
      body.domain = domain.domain;
    }

    this.renewalConfigService
      .updateRenewalConfig(body as RenewalConfig)
      .subscribe(
        () => {
          this.toastService.success('Updated successfully');
          this.initData();
        },
        e => {
          this.toastService.warning(e.message);
        }
      )
      .add(() => (this.saving = false));
  }

  get renewDaysBefore() {
    return this.form.controls['renewDaysBefore'];
  }
}
