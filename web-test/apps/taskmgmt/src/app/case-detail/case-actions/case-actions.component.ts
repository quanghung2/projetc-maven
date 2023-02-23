import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import {
  CaseDetail,
  CaseIdentity,
  CaseQuery,
  CaseService,
  Collaborator,
  CollaboratorRole,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { B3_ORG_UUID, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { filter, finalize, map, mergeMap, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-case-actions',
  templateUrl: './case-actions.component.html',
  styleUrls: ['./case-actions.component.scss']
})
export class CaseActionsComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly B3_ORG_UUID = B3_ORG_UUID;

  private _collaborators: Collaborator[];

  @Input() me: User;
  @Input() case: CaseDetail;

  isOwnerOfCase: boolean;
  isB3Org: boolean;
  isSharedWithB3: boolean;

  isReporter: boolean;
  isWatchingCase: boolean;

  watchers$: Observable<User[]>;
  collaborators$: Observable<Collaborator[]>;

  // TODO will rework later
  shareOrg = null;
  checkingUuid = false;
  firstCheckoutUUid = false;
  checkOrgShare = false;

  searchOrg: FormControl = this.fb.control('');

  constructor(
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private userQuery: UserQuery,
    private organizationService: OrganizationService,
    private toastr: ToastService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    super();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['me'] || changes['case']) && this.me && this.case) {
      this.isReporter = this.case.createdByIdentity === this.me?.uuid;
    }
  }

  ngOnInit(): void {
    this.isOwnerOfCase = this.case.ownerOrgUuid === X.orgUuid;
    this.isB3Org = X.orgUuid === B3_ORG_UUID;

    this.watchers$ = this.caseQuery.selectActiveId().pipe(
      tap(() => {
        const iden: { id; sid; ownerOrgUuid } = this.caseQuery.getActive();
        this.caseService.getWatchers(iden).subscribe();
      }),
      switchMap(id => this.caseQuery.selectEntity(id as number, 'watchers')),
      filter(l => l != null),
      tap(l => {
        this.isWatchingCase = l.some(i => i === this.me?.uuid);
      }),
      mergeMap(l => this.userQuery.selectAllUserByIdentityIds(l)),
      tap(r => console.log(r))
    );

    this.collaborators$ = this.caseQuery.selectActiveId().pipe(
      tap(() => {
        const iden: { id; sid; ownerOrgUuid } = this.caseQuery.getActive();
        this.caseService.getCollaborators(iden).subscribe();
      }),
      switchMap(id => this.caseQuery.selectEntity(id as number, 'collaborators')),
      filter(l => l != null),
      map(l => l.filter(i => i.role === CollaboratorRole.participant)),
      tap(l => {
        if (!this.isB3Org) {
          this.isSharedWithB3 = l.some(i => i.orgUuid === B3_ORG_UUID);
        }
      })
    );
  }

  findOrg() {
    this.shareOrg = null;
    this.checkingUuid = true;
    this.checkOrgShare = false;
    const foundOrg = this._collaborators?.find(o => o === this.searchOrg.value);
    if (!foundOrg) {
      this.organizationService
        .checkOrgUuid(this.searchOrg.value)
        .pipe(
          finalize(() => {
            this.checkingUuid = false;
            this.firstCheckoutUUid = true;
          })
        )
        .subscribe(org => {
          if (org) {
            this.checkOrgShare = true;
            this.shareOrg = { sourceName: org['domain'], domain: org['name'] };
          }
        });
    } else {
      this.checkingUuid = false;
      this.firstCheckoutUUid = true;
      this.toastr.error('organization shared');
    }
  }

  toggleWatching(isWatching: boolean) {
    let stream;
    if (isWatching) {
      stream = this.caseService.unwatchCase(this.case as CaseIdentity, this.me.uuid);
    } else {
      stream = this.caseService.watchCase(this.case as CaseIdentity, this.me.uuid);
    }
    stream.subscribe({
      next: () => {
        this.toastr.success(isWatching ? 'Unwatch successfully' : 'Start watching successfully');
      },
      error: e => {
        this.toastr.warning(e.message);
      }
    });
  }

  confirmShareToB3() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Share case',
          message: `Are you sure you want to share case to B3Networks`,
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.caseService.updateCollaborator(this.case, B3_ORG_UUID, 'add').subscribe({
            next: () => {
              this.toastr.success('Shared successfully');
            },
            error: error => {
              this.checkOrgShare = false;
              this.toastr.error(error.message);
            }
          });
        }
      });
  }

  confirmUnshare(orgUuid: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Unshare organization',
          message: `Are you sure to unshare case with this organization`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.caseService.updateCollaborator(this.case, orgUuid, 'remove').subscribe({
            next: () => {
              this.toastr.success('Unshared successfully');
            },
            error: error => {
              this.toastr.error(error.message);
            }
          });
        }
      });
  }

  shareCase() {
    this.caseService.updateCollaborator(this.case, this.searchOrg.value, 'add').subscribe({
      next: () => {
        this.shareOrg = null;
        this.firstCheckoutUUid = false;
        this.searchOrg.setValue('');
        this.toastr.success('Shared successfully');
      },
      error: error => {
        this.checkOrgShare = false;
        this.toastr.error(error.message);
      }
    });
  }
}
