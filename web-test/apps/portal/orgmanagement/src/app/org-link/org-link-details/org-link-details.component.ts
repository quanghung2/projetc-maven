import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CreateGroupBody, OrgLinkMember, OrgLinkService } from '@b3networks/api/auth';
import { DEFAULT_ORG_LOGO } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface OrgLinkDetailsData {
  orgLinkMembers: OrgLinkMember[];
  profileUuid: string;
  linkUuid: string;
}

@Component({
  selector: 'b3n-org-link-details',
  templateUrl: './org-link-details.component.html',
  styleUrls: ['./org-link-details.component.scss']
})
export class OrgLinkDetailsComponent implements OnInit, AfterViewInit {
  DEFAULT_ORG_LOGO = DEFAULT_ORG_LOGO;
  dataSource: MatTableDataSource<OrgLinkMember>;
  displayedColumns: string[] = ['logo', 'uuid', 'name', 'role'];
  pageSize = 5;
  showAddForm = false;
  form: UntypedFormGroup;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<OrgLinkDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrgLinkDetailsData,
    private fb: UntypedFormBuilder,
    private orgLinkService: OrgLinkService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.dataSource = new MatTableDataSource(this.data.orgLinkMembers);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  initForm() {
    this.form = this.fb.group({
      orgUuid: ['', Validators.required]
    });
  }

  invite() {
    const body: CreateGroupBody = {
      organizationUuid: this.orgUuid.value,
      organizationGroupUuid: this.data.linkUuid
    };

    this.orgLinkService.createGroup(this.data.profileUuid, body).subscribe(
      _ => {
        const newMember: OrgLinkMember = new OrgLinkMember({ uuid: this.orgUuid.value, role: 'MEMBER' });

        this.data.orgLinkMembers.push(newMember);
        this.dataSource = new MatTableDataSource(this.data.orgLinkMembers);
        this.dataSource.paginator = this.paginator;
        this.toastService.success('Invite successfully');
        this.showAddForm = false;

        setTimeout(() => {
          this.dataSource.paginator.lastPage();
        }, 0);
      },
      err => this.toastService.warning(err.message)
    );
  }

  get orgUuid() {
    return this.form.controls['orgUuid'];
  }
}
