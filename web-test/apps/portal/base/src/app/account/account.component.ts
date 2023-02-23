import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfile, UpdatePersonalRequest } from '@b3networks/api/auth';
import { S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, takeUntil } from 'rxjs/operators';
import { LogoutDlg } from '../shared/modal/logout/logout.component';

const MAX_FILE_SIZE = 5 * 1024 * 1000;

@Component({
  selector: 'b3n-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends DestroySubscriberComponent implements OnInit {
  links: KeyValue<string, string>[] = [
    { key: 'profile', value: 'Information' },
    { key: 'security', value: 'Security And Credentials' },
    { key: 'activity', value: 'Activity' },
    { key: 'trusted-browsers', value: 'Trusted Browsers' }
  ];
  uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
  profile: IdentityProfile;
  uploadIndicator = false;
  photoUrl: string;
  progressing: boolean;
  displayName: string;

  constructor(
    private dialog: MatDialog,
    private s3Service: S3Service,
    private toastService: ToastService,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService
  ) {
    super();
  }

  ngOnInit() {
    this.sessionQuery.profile$
      .pipe(
        filter(p => p != null && !!p.uuid),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(profile => {
        this.profile = profile;
        this.photoUrl = profile.photoSrc;
        this.displayName = profile.displayName;
      });
  }

  logout() {
    this.dialog.open(LogoutDlg, {
      width: '500px',
      position: {
        top: '40px'
      }
    });
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!this.isValidFileType(file)) {
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.toastService.error(`Exceeded the maximum file size (5MB)`, 4000);
        return;
      }
      this.uploadIndicator = true;

      this.s3Service.directUploadPublicAsset(file, 'avatar').subscribe({
        next: res => {
          this.uploadEvent = res;
          if (res.publicUrl && res.status === Status.COMPLETED) {
            this.uploadIndicator = false;
            this.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
            const index = res.publicUrl.indexOf('?');
            this.photoUrl = index > -1 ? res.publicUrl.slice(0, index) : res.publicUrl;
            this.updatePersonal();
          }
        },
        error: err => {
          this.uploadIndicator = false;
          this.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
          this.toastService.error(
            err.message || 'There was an error uploading the image. Please try again in a few minutes'
          );
        }
      });
    }
  }

  updatePersonal() {
    this.progressing = true;

    const payload = {} as UpdatePersonalRequest;
    payload.photoUrl = this.photoUrl;

    this.sessionService.updatePersonalInfo(payload).subscribe({
      next: () => {
        this.progressing = false;
        this.toastService.success('Your profile has been successfully updated.');
      },
      error: error => {
        this.progressing = false;
        const err = error.error;
        if (err.code === 'auth.emailAlreadyRegistered') {
          this.toastService.warning('Email already registered in the system. Please use a different one.');
        } else {
          this.toastService.warning(MessageConstants.GENERAL_ERROR);
        }
      }
    });
  }

  private isValidFileType(file: { name: string; type: string }) {
    const typeAllow = ['jpg', 'jpeg', 'png', 'ico'];
    return file.type.startsWith('image/') && typeAllow.includes(file.type.split('/')[1]);
  }
}
