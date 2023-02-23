import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { CallerIdService as CallerIdServiceSms } from '@b3networks/api/sms';
import { ToastService } from '@b3networks/shared/ui/toast';
import readXlsxFile from 'read-excel-file';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'b3n-sms-blacklist-dialog',
  templateUrl: './sms-blacklist-dialog.component.html',
  styleUrls: ['./sms-blacklist-dialog.component.scss']
})
export class SmsBlacklistDialogComponent implements OnInit {
  keywords: string[] = [];
  importing: boolean;
  updating: boolean;
  progress: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputAction: 'add' | 'remove',
    private dialogRef: MatDialogRef<SmsBlacklistDialogComponent>,
    private callerIdService: CallerIdService,
    private callerIdServiceSms: CallerIdServiceSms,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  uploadFile(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0] as File;
      const reader = new FileReader();
      this.keywords.length = 0;
      this.importing = true;
      reader.addEventListener('load', e => {
        readXlsxFile(file).then(rows => {
          rows.forEach(row => {
            this.keywords.push(row[0].toString());
          });
        });
        this.importing = false;
      });
      reader.readAsText(file, 'UTF-8');
    }
  }

  private async _update() {
    this.updating = true;
    const perPage = 500;
    const totalPage = Math.ceil(this.keywords.length / perPage);
    for (let page = 0; page < totalPage; page++) {
      await forkJoin([
        this.callerIdService.updateGlobalBlacklist({
          action: this.inputAction,
          keywords: this.keywords.slice(page * perPage, (page + 1) * perPage)
        }),
        this.callerIdServiceSms.updateGlobalBlacklist({
          action: this.inputAction,
          keywords: this.keywords.slice(page * perPage, (page + 1) * perPage)
        })
      ]).toPromise();
      this.progress = page / totalPage;
    }
    this.updating = false;
    this.toastService.success('SMS blacklist has been updated');
    this.dialogRef.close();
  }

  update() {
    if (this.keywords.length > 0) {
      this._update();
    }
  }
}
