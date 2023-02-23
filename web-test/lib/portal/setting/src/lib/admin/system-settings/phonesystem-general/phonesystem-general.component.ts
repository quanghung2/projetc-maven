import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { OrgConfig, OrgConfigQuery, OrgConfigService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-phonesystem-general',
  templateUrl: './phonesystem-general.component.html',
  styleUrls: ['./phonesystem-general.component.scss']
})
export class PhonsystemGeneralComponent extends DestroySubscriberComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  form = this.fb.group({
    agentSLAThreshold: ['', Validators.required],
    pickupPrefix: ['', [Validators.required, Validators.maxLength(2)]],
    prefix: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4)]],
    parkingTime: ['', [Validators.required, Validators.min(300), Validators.max(14400)]]
  });
  remarkCtrl = new UntypedFormControl('', Validators.maxLength(30));
  defaultValueSlaThreshold = 10;
  numbersSlaThreshold = [3, 4, 5, 6, 7, 8, 9, 10];
  orgConfig: OrgConfig;
  loading: boolean;
  pickupPrefix: string;
  progressing: boolean;
  remarks: string[] = [];
  hintMsg = '';
  @ViewChild('remark') remark: ElementRef;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private toastService: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;
    // orgConfigService called from outside
    this.orgConfigQuery.orgConfig$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(orgConfig => {
          console.log(`data changed`);
          this.orgConfig = orgConfig;
          this.pickupPrefix = orgConfig?.pickupPrefix?.substring(1);
          this.hintMsg = `For example: if you want to pick up the call of the user 105, press *${this.pickupPrefix} 105#`;
          this.remarks = orgConfig?.remarks;

          this.setValueForm();
        }),
        tap(() => (this.loading = false))
      )
      .subscribe();

    this.orgConfigService.getConfig().subscribe();
  }

  setValueForm() {
    this.form.setValue({
      agentSLAThreshold:
        (this.numbersSlaThreshold.includes(this.orgConfig?.thresholdConfig?.agentSLAThreshold) &&
          this.orgConfig?.thresholdConfig?.agentSLAThreshold) ||
        this.defaultValueSlaThreshold,
      pickupPrefix: this.orgConfig?.pickupPrefix.substring(1) || '',
      prefix: this.orgConfig?.callParkingConfig?.prefix.substring(1) || '',
      parkingTime: this.orgConfig?.callParkingConfig?.parkingtime || ''
    });
  }

  update() {
    if (this.form.invalid) return;
    this.progressing = true;
    this.orgConfigService
      .updateConfig(this.mapConfigToUpdate())
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.hintMsg = `For example: if you want to pick up the call of the user 105, press *${this.pickupPrefix} 105#`;
          this.toastService.success('Popup config has been updated. This update will take effect after 5 minutes.');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  transferParkingTime(parkingTime: number) {
    if (!parkingTime) {
      return '';
    }

    if (parkingTime < 60) {
      return `${parkingTime} second${parkingTime > 1 ? 's' : ''}`;
    } else if (parkingTime < 3600) {
      const time = this.getTime(parkingTime, 60);
      return `${time.prefix} ${time.time} minute${time.time > 1 ? 's' : ''}`;
    } else {
      const time = this.getTime(parkingTime, 3600);
      return `${time.prefix} ${time.time} hour${time.time > 1 ? 's' : ''}`;
    }
  }

  getTime(parkingTime: number, unit: number) {
    let prefix = '';
    let time = parkingTime / unit;

    if (time % 1 !== 0) {
      prefix = '~';
      time = Math.round(time);
    }

    return { prefix, time };
  }

  addRemark() {
    const { valid, value } = this.remarkCtrl;
    if (this.remarks.length === 10) {
      this.toastService.error('Exceeded the maximum number of Remarks can be created (10)');
      return;
    }
    if (valid && this.remarks && value && !this.remarks.includes(value)) {
      this.remarks.push(value);
      this.remarkCtrl.setValue('');
    }
  }

  deleteRemark(remark: string) {
    if (!this.remarks) {
      return;
    }

    this.remarks.splice(this.remarks.indexOf(remark), 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.remarks, event.previousIndex, event.currentIndex);
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  private mapConfigToUpdate(): Partial<OrgConfig> {
    return {
      thresholdConfig: { agentSLAThreshold: this.form.controls['agentSLAThreshold'].value },
      pickupPrefix: '*' + this.form.controls['pickupPrefix'].value,
      callParkingConfig: {
        parkingtime: this.form.controls['parkingTime'].value,
        prefix: '*' + this.form.controls['prefix'].value
      },
      remarks: this.remarks
    };
  }
}
