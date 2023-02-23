import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityProfileQuery,
  ImportMemberRequest,
  OrganizationPolicyQuery,
  OrgMemberService,
  ProfileOrg,
  Team,
  TeamQuery
} from '@b3networks/api/auth';
import { S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

enum ImportMemberType {
  'PORTAL_ACCESS' = 'PORTAL_ACCESS',
  'PORTAL_ACCESS_USERNAME' = 'PORTAL_ACCESS_USERNAME',
  'NO_PORTAL_ACCESS' = 'NO_PORTAL_ACCESS'
}

@Component({
  selector: 'pom-import-members',
  templateUrl: './import-members.component.html',
  styleUrls: ['./import-members.component.scss']
})
export class ImportMembersComponent implements OnInit {
  readonly Type = ImportMemberType;

  uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
  fileKeyPortalAccess: string;
  fileKeyPortalAccessUsername: string;
  fileKeyNoPortalAccess: string;
  fileNamePortalAccess: string;
  fileNamePortalAccessUsername: string;
  fileNameNoPortalAccess: string;
  createPinPortalAccess = false;
  createPinNoPortalAccess = false;
  uploadFileProgress = 0;
  progressing: boolean;
  uploading: boolean;
  selectedType = ImportMemberType.PORTAL_ACCESS;
  licenseEnabled: boolean;

  showPortalAccessUsername: boolean;
  profileOrg: ProfileOrg;
  isManagedTeam: boolean; // when admin assigned to manage a team
  teams: Team[] = [];
  teamUuidCtrl = new UntypedFormControl('');

  constructor(
    private s3Service: S3Service,
    private orgMemberService: OrgMemberService,
    private profileQuery: IdentityProfileQuery,
    private organizationPolicyQuery: OrganizationPolicyQuery,
    private teamQuery: TeamQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ImportMembersComponent>
  ) {}

  ngOnInit() {
    this.profileOrg = this.profileQuery.currentOrg;
    this.licenseEnabled = this.profileQuery.currentOrg.licenseEnabled;
    this.teams = this.teamQuery.getAll();
    const managedTeams = this.teams.filter(t => t.admins?.includes(this.profileQuery.getProfile().uuid));
    if (this.profileOrg.isAdmin && managedTeams.length) {
      this.isManagedTeam = true;
      this.teams = managedTeams;
      this.teamUuidCtrl.setValue(this.teams[0].uuid);
    }

    this.showPortalAccessUsername = this.organizationPolicyQuery.hasGrantedResource(
      X.orgUuid,
      IAM_SERVICES.ui,
      IAM_UI_ACTIONS.enable_interface,
      IAM_UI_RESOURCES.credential_username
    );
  }

  selectCsvFile(event) {
    this.progressing = true;
    this.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.s3Service
        .tempUpload(file)
        .pipe(finalize(() => (this.progressing = false)))
        .subscribe(
          res => {
            if (res.status === Status.PROCESSING) {
              this.uploadFileProgress = res.percentage;
            }
            if (res.status === Status.COMPLETED) {
              switch (this.selectedType) {
                case ImportMemberType.PORTAL_ACCESS:
                  this.fileNamePortalAccess = file.name;
                  this.fileKeyPortalAccess = res.key;
                  break;
                case ImportMemberType.PORTAL_ACCESS_USERNAME:
                  this.fileNamePortalAccessUsername = file.name;
                  this.fileKeyPortalAccessUsername = res.key;
                  break;
                case ImportMemberType.NO_PORTAL_ACCESS:
                  this.fileNameNoPortalAccess = file.name;
                  this.fileKeyNoPortalAccess = res.key;
                  break;
              }
            }
          },
          error => {
            this.toastService.error(
              error.message || 'The file could not be uploaded. Please try again in a few minutes'
            );
          }
        );
    }
  }

  uploadFile() {
    this.uploading = true;
    let stream;
    switch (this.selectedType) {
      case ImportMemberType.PORTAL_ACCESS:
        stream = this.orgMemberService.importMemberIncludeEmail(
          new ImportMemberRequest({
            fileKey: this.fileKeyPortalAccess,
            createPin: this.createPinPortalAccess
          })
        );
        break;
      case ImportMemberType.PORTAL_ACCESS_USERNAME:
        stream = this.orgMemberService.importMemberIncludeUsername(
          X.orgUuid,
          new ImportMemberRequest({
            fileKey: this.fileKeyPortalAccessUsername,
            teamUuids: this.teamUuidCtrl.value ? [this.teamUuidCtrl.value] : []
          })
        );
        break;
      case ImportMemberType.NO_PORTAL_ACCESS:
        stream = this.orgMemberService.importMember(
          X.orgUuid,
          new ImportMemberRequest({
            fileKey: this.fileKeyNoPortalAccess,
            createPin: this.createPinNoPortalAccess
          })
        );
        break;
    }

    stream.pipe(finalize(() => (this.uploading = false))).subscribe(
      resp => {
        if (resp) {
          resp.success
            ? this.toastService.success(resp.message)
            : resp.warning
            ? this.toastService.warning(resp.message)
            : this.toastService.error(resp.message);
          if (resp.success || resp.warning) {
            this.dialogRef.close({ ok: true });
          }
        } else {
          this.toastService.success(`Import members successfully`);
        }
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
