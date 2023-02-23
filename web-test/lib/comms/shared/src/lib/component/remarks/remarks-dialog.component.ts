import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OrgConfig, OrgConfigQuery, OrgConfigService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-remarks-dialog',
  templateUrl: './remarks-dialog.component.html',
  styleUrls: ['./remarks-dialog.component.scss']
})
export class RemarksDialogComponent implements OnInit {
  @ViewChild('remark') remark: ElementRef;
  loading: boolean;
  remarks: string[] = [];
  remarkCtrl = new UntypedFormControl('', Validators.maxLength(30));

  constructor(
    public dialogRef: MatDialogRef<RemarksDialogComponent>,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.orgConfigQuery.busyRemarks$.subscribe(remarks => {
      if (remarks) {
        this.remarks = [...remarks];
      }
    });

    this.orgConfigQuery.selectLoading().subscribe(loading => {
      loading ? (this.loading = true) : (this.loading = false);
    });

    this.orgConfigService.getConfig().subscribe(
      _ => {},
      err => {
        this.toastService.error(err.message);
      }
    );
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
    if (!this.remarks) return;
    this.remarks.splice(this.remarks.indexOf(remark), 1);
  }

  save() {
    this.loading = true;
    this.orgConfigService
      .updateConfig(new OrgConfig({ remarks: this.remarks }))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('Busy remarks have been updated');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.remarks, event.previousIndex, event.currentIndex);
  }
}
