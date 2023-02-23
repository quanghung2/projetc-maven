import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgMemberService } from '@b3networks/api/auth';
import { FileService } from '@b3networks/api/file';
import { MemberStatus } from '@b3networks/api/member';
import { DestroySubscriberComponent, downloadData, getFilenameFromHeader } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { interval } from 'rxjs';
import { first, switchMap, takeUntil, tap } from 'rxjs/operators';
import { InputExportMemberData } from '../action-bar/action-bar.component';

@Component({
  selector: 'pom-export-members',
  templateUrl: './export-members.component.html',
  styleUrls: ['./export-members.component.scss']
})
export class ExportMembersComponent extends DestroySubscriberComponent implements OnInit {
  fileUrl = '';
  fetchingError: boolean;
  message: string;

  constructor(
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private fileService: FileService,
    public dialogRef: MatDialogRef<ExportMembersComponent>,
    @Inject(MAT_DIALOG_DATA) private data: InputExportMemberData
  ) {
    super();
  }

  ngOnInit() {
    this.data.status === MemberStatus.ACTIVE ? this.exportActiveMember() : this.exportPendingMember();
  }

  exportActiveMember() {
    let job: string;

    this.orgMemberService
      .triggerExportMember(this.data.isLicenseOrg, this.data.teamUuid)
      .pipe(
        tap(triggerMember => (job = triggerMember.jobId)),
        switchMap(_ => {
          return interval(5000);
        }),
        takeUntil(this.destroySubscriber$),
        switchMap(_ => this.orgMemberService.getExportMember(job, this.data.isLicenseOrg)),
        first(exportMember => !!exportMember.tempKey)
      )
      .subscribe(
        exportMember => {
          this.fileService.downloadTempFile(exportMember.tempKey).subscribe(res => {
            downloadData(res.body, getFilenameFromHeader(res.headers));
            this.dialogRef.close();
          });
        },
        error => {
          this.fetchingError = true;
          this.message = error.message || 'Cannot export members. Please try again later.';
        }
      );
  }

  exportPendingMember() {
    let job: string;

    this.orgMemberService
      .exportPendingMember()
      .pipe(
        tap(triggerMember => (job = triggerMember.jobId)),
        switchMap(_ => {
          return interval(5000);
        }),
        takeUntil(this.destroySubscriber$),
        switchMap(_ => this.orgMemberService.getExportUrlForPendingMember(job)),
        first(exportMember => !!exportMember.tempKey)
      )
      .subscribe(
        exportMember =>
          this.fileService.downloadTempFile(exportMember.tempKey).subscribe(res => {
            downloadData(res.body, getFilenameFromHeader(res.headers));
            this.dialogRef.close();
          }),
        error => {
          this.fetchingError = true;
          this.message = error.message || 'Cannot export members. Please try again later.';
        }
      );
  }
}
