import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '@b3networks/api/auth';
import {
  GetLicenseReq,
  License,
  LicenseResource,
  LicenseService,
  LicenseStatistic,
  LicenseStatQuery
} from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AssignLicenseComponent, AssignLicenseInput } from './assign-license/assign-license.component';

@Component({
  selector: 'pom-manage-license',
  templateUrl: './manage-license.component.html',
  styleUrls: ['./manage-license.component.scss']
})
export class ManageLicenseComponent implements OnInit, OnChanges {
  private _memberID: string;
  @Input() member: Member;

  licenses$: Observable<License[]>;
  addonMapping$: Observable<HashMap<LicenseStatistic>>;
  resourcesMapping: HashMap<LicenseResource> = {};

  constructor(
    private licenseService: LicenseService,
    private licenseStatQuery: LicenseStatQuery,
    private toastr: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.addonMapping$ = this.licenseStatQuery.addonLicenses$.pipe(
      map(addons =>
        addons.reduce((hash, addon) => {
          hash[addon.sku] = addon;
          return hash;
        }, {})
      )
    );
  }

  ngOnChanges() {
    if (this.member && this._memberID !== this.member.uuid) {
      this._memberID = this.member.uuid;
      this.loadData();
    }
  }

  assignLicenses(assignedLicenses: License[]) {
    this.dialog
      .open(AssignLicenseComponent, {
        width: '500px',
        // disableClose: true,
        data: <AssignLicenseInput>{
          member: this.member,
          assignedLicenses: assignedLicenses
        }
      })
      .afterClosed()
      .subscribe(assigned => {
        if (assigned) {
          this.loadData();
        }
      });
  }

  unassign(license: License) {
    this.licenseService.unassignUser(license.id).subscribe(
      _ => {
        this.toastr.success(`Unassign license successfully`);
      },
      error => {
        this.toastr.warning(error.message);
      }
    );
  }

  private loadData() {
    this.licenses$ = this.licenseService
      .getLicenses(<GetLicenseReq>{ identityUuid: this._memberID, type: 'BASE' }, { page: 0, perPage: 100 })
      .pipe(
        tap(page => {
          const result = page.content.filter(l => l.type === 'BASE');

          const ids = result
            .reduce((list, obj) => {
              list.push(...obj.mappings);
              return list;
            }, [])
            .filter(l => l.isNumber)
            .map(l => l.id);

          if (ids.length) {
            this.licenseService.getResource(ids).subscribe(resources => {
              console.log(resources);
              this.resourcesMapping = resources.reduce((hash, obj) => {
                hash[obj.licenseId] = obj;
                return hash;
              }, {});
            });
          }
        }),
        map(page => page.content.filter(l => l.type === 'BASE'))
      );
  }
}
