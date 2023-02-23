import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoteService, NoteTemplate } from '@b3networks/api/data';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { filter, finalize, take } from 'rxjs/operators';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { format } from 'date-fns-tz';
import { addDays, startOfDay } from 'date-fns';

@Component({
  selector: 'b3n-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent extends DestroySubscriberComponent implements OnInit {
  maxEnd = new Date();
  maxStart = new Date();
  minEnd: string;
  minStart: string;

  downloadFrom: UntypedFormGroup;
  timezone: string;
  downloading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NoteTemplate,
    private noteService: NoteService,
    private fb: UntypedFormBuilder,
    private profileQuery: IdentityProfileQuery,
    private dialogRef: MatDialogRef<DownloadComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    console.log(this.data);
    this.getTimezone();
    this.initForm();
    this.listenChange();
  }

  getTimezone() {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.timezone = org.utcOffset;
      });
  }

  initForm() {
    this.downloadFrom = this.fb.group({
      start: ['', Validators.required],
      end: ['', Validators.required]
    });
  }

  listenChange() {
    this.downloadFrom.valueChanges.subscribe(value => {
      this.minEnd = value['start'];
      this.maxStart = value['end'];
    });
  }

  download() {
    this.downloading = true;
    const start = format(startOfDay(new Date(this.downloadFrom.value.start)), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timezone
    });
    const end = format(addDays(startOfDay(new Date(this.downloadFrom.value.end)), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timezone
    });
    this.noteService
      .download(this.data.templateUuid, start, end)
      .pipe(finalize(() => (this.downloading = false)))
      .subscribe(res => {
        this.dialogRef.close();
        const fileName = `${this.data.title} Notes Log ${format(
          this.downloadFrom.value.start,
          'yyyyMMdd'
        )}_0000_TO_${format(this.downloadFrom.value.end, 'yyyyMMdd')}_0000`;
        const downloadFile = new Blob([res.body], { type: `${res.body.type}` });
        const downloadUrl = URL.createObjectURL(downloadFile);

        donwloadFromUrl(downloadUrl, fileName, () => {
          URL.revokeObjectURL(downloadUrl);
        });
      });
  }
}
