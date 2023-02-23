import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Organization, OrganizationService, UpdateCompanyRequest } from '@b3networks/api/auth';
import { DirectUpload, S3Service } from '@b3networks/api/file';
import { MessageConstants, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pos-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss']
})
export class PhotoComponent {
  @Input() organization: Organization;
  @Output() uploadPhotoEvent = new EventEmitter<DirectUpload>();

  uploading: boolean;

  constructor(
    private s3Service: S3Service,
    private toastService: ToastService,
    private organizationService: OrganizationService
  ) {}

  private isValidFileType(file: { name: string; type: string }) {
    return file.type.startsWith('image/');
  }

  update(logoUrl: string) {
    const req = {
      logoUrl: logoUrl,
      orgUuid: X.orgUuid,
      shortName: this.organization.shortName,
      name: this.organization.name,
      billingInfo: this.organization.billingInfo,
      timezoneUuid: this.organization.timezone
    } as UpdateCompanyRequest;

    this.organizationService
      .updateCompanyInfo(req)
      .pipe(finalize(() => {}))
      .subscribe(
        _ => {
          this.toastService.success('Organization information has been updated.');
        },
        error => {
          if (
            'org.organizationShortNameExists'.toLowerCase() === error.code.toLowerCase() ||
            'org.invalidOrganizationShortName' === error.code
          ) {
            this.toastService.warning(error.message);
          } else if ('org.InsufficientPrivilege' === error.code) {
            this.toastService.warning(`You don't have sufficient privileges to perform this action`);
          } else {
            this.toastService.warning(MessageConstants.GENERAL_ERROR);
          }
        }
      );
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!this.isValidFileType(file)) {
        return;
      }

      this.uploading = true;
      this.s3Service.directUploadPublicAsset(file, 'logo').subscribe(
        res => {
          this.uploadPhotoEvent.emit(res);
          if (!!res.publicUrl && res.status === 'completed') {
            const index = res.publicUrl.indexOf('?');
            const url = index > -1 ? res.publicUrl.slice(0, index) : res.publicUrl;
            this.update(url);
            this.uploading = false;
          }
        },
        err => {
          this.uploading = false;
          this.uploadPhotoEvent.emit({ status: 'completed', percentage: 0 });
          this.toastService.error(
            err.message || 'There was an error uploading the image. Please try again in a few minutes'
          );
        }
      );
    }
  }
}
