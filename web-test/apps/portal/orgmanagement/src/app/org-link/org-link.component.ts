import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  IdentityProfile,
  IdentityProfileQuery,
  OrgLink,
  OrgLinkMember,
  OrgLinkQuery,
  OrgLinkService
} from '@b3networks/api/auth';
import { DEFAULT_ORG_LOGO, DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { OrgLinkDetailsComponent } from './org-link-details/org-link-details.component';
import { OrgLinkInviteComponent } from './org-link-invite/org-link-invite.component';

@Component({
  selector: 'b3n-org-link',
  templateUrl: './org-link.component.html',
  styleUrls: ['./org-link.component.scss']
})
export class OrgLinkComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  DEFAULT_ORG_LOGO = DEFAULT_ORG_LOGO;
  MAX_MEMBER_NUMBER = 4;

  profile: IdentityProfile;
  form: UntypedFormGroup;
  orgLinks: OrgLink[];
  orgLinksFilter: OrgLink[];
  displayedColumns: string[] = ['uuid', 'members', 'created', 'status', 'action'];
  dataSource: MatTableDataSource<OrgLink>;
  addNew: boolean;
  loading = true;
  pageSize = 5;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private orgLinkService: OrgLinkService,
    private identityProfileQuery: IdentityProfileQuery,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private orgLinkQuery: OrgLinkQuery,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {
    super();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const width = event.target.innerWidth;

    if (width <= 950) {
      this.MAX_MEMBER_NUMBER = 1;
    } else if (width <= 1150) {
      this.MAX_MEMBER_NUMBER = 2;
    } else if (width <= 1350) {
      this.MAX_MEMBER_NUMBER = 3;
    } else {
      this.MAX_MEMBER_NUMBER = 4;
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit() {
    this.identityProfileQuery.profile$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profile => !!profile),
        tap(profile => {
          this.profile = profile;
          this.orgLinkService.getGroups(profile.uuid).subscribe();
        })
      )
      .subscribe();

    this.orgLinkQuery
      .selectAll()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(orgLinks => {
          if (!orgLinks || !orgLinks.length) {
            return;
          }

          this.orgLinks = orgLinks.reduce((prev, curr) => {
            const orgLink: OrgLink = cloneDeep(curr);
            const defaultOrgMember: OrgLinkMember = orgLink.organizations.find(
              o => o.uuid === this.profile.organizations[0].orgUuid
            );
            const pendingAcceptOrgMember = orgLink.organizations.find(o => o.name === null);

            orgLink.status = pendingAcceptOrgMember ? 'Pending' : 'Accepted';
            orgLink.isDefaultMemberAccepted = defaultOrgMember.name !== null;

            if (!defaultOrgMember.name && !!defaultOrgMember.rejectedAt) {
              return prev;
            }

            prev.push(orgLink);

            return prev;
          }, []);

          this.orgLinksFilter = cloneDeep(this.orgLinks);
          this.dataSource = new MatTableDataSource(this.orgLinksFilter);
          this.dataSource.paginator = this.paginator;
        }),
        tap(() => {
          setTimeout(() => {
            this.loading = false;
          }, 100);

          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      name: [''],
      status: ['']
    });

    combineLatest([
      <Observable<string>>this.form.controls['name'].valueChanges.pipe(startWith('')),
      <Observable<string>>this.form.controls['status'].valueChanges.pipe(startWith(''))
    ])
      .pipe(
        map(([name, status]) => [name.trim().toLowerCase(), status.trim().toLowerCase()]),
        tap(([name, status]) => {
          if (!this.orgLinks) {
            return;
          }

          this.orgLinksFilter = this.orgLinks.filter(
            o => o.name.trim().toLowerCase().includes(name) && o.status.trim().toLowerCase().includes(status)
          );
          this.dataSource = new MatTableDataSource(this.orgLinksFilter);
          this.dataSource.paginator = this.paginator;
        })
      )
      .subscribe();
  }

  accept(linkUuid: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Accept join request',
          message: 'Are you sure you want to join this group?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.orgLinkService.acceptGroup(this.profile.uuid, linkUuid).subscribe(
            _ => {
              this.toastService.success('Accept successfully');
              this.orgLinkService.getGroups(this.profile.uuid).subscribe();
            },
            err => this.toastService.warning(err.message)
          );
        }
      });
  }

  deny(linkUuid: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Deny join request',
          message: 'Are you sure you want to reject this group?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.orgLinkService.denyGroup(this.profile.uuid, linkUuid).subscribe(
            _ => {
              this.toastService.success('Deny successfully');
              this.orgLinkService.getGroups(this.profile.uuid).subscribe();
            },
            err => this.toastService.warning(err.message)
          );
        }
      });
  }

  openOrgLinkDetails(orgLinkMembers: OrgLinkMember[], linkUuid: string): void {
    this.dialog.open(OrgLinkDetailsComponent, {
      data: { orgLinkMembers, profileUuid: this.profile.uuid, linkUuid },
      panelClass: 'org-link-details__wrapper',
      autoFocus: false,
      disableClose: true
    });
  }

  openOrgLinkInvite() {
    this.dialog
      .open(OrgLinkInviteComponent, {
        data: {
          profileUuid: this.profile.uuid,
          type: 'Create'
        },
        disableClose: true,
        width: '350px'
      })
      .afterClosed()
      .pipe(
        tap(addNew => {
          if (addNew) {
            this.dataSource.paginator.lastPage();
          }
        })
      )
      .subscribe();
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  get orgUuid() {
    return this.form.controls['orgUuid'];
  }
}
