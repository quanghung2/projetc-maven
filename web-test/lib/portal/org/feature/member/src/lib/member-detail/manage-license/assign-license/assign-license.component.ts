import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member } from '@b3networks/api/auth';
import { GetLicenseReq, License, LicenseService, LicenseStatQuery } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, mergeMap, takeUntil, tap } from 'rxjs/operators';

export interface AssignLicenseInput {
  member: Member;
  assignedLicenses: License[];
}

@Component({
  selector: 'pom-assign-license',
  templateUrl: './assign-license.component.html',
  styleUrls: ['./assign-license.component.scss']
})
export class AssignLicenseComponent extends DestroySubscriberComponent implements OnInit {
  licenses$: Observable<License[]>;
  selectedLicenseCtr: UntypedFormControl = new UntypedFormControl(null, [Validators.required]);

  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AssignLicenseInput,
    private licenseService: LicenseService,
    private licenseStatQuery: LicenseStatQuery,
    private dialogRef: MatDialogRef<AssignLicenseComponent>,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.licenses$ = this.licenseStatQuery.perUserBaseLicenses$.pipe(
      takeUntil(this.destroySubscriber$),
      tap(data => console.log(data)),

      mergeMap(stats => {
        const assignedSKUS = this.data.assignedLicenses.map(l => l.sku);
        const streams = stats
          .filter(l => !assignedSKUS.includes(l.sku))
          .map(s =>
            s.hasResource
              ? this.licenseService
                  .getLicenses(<GetLicenseReq>{ skus: [s.sku], hasUser: false, hasResource: true }, {
                    page: 0,
                    perPage: 1000
                  })
                  .pipe(
                    map(p => p.content),
                    catchError(_ => of([]))
                  )
              : this.licenseService
                  .getLicenses(<GetLicenseReq>{ skus: [s.sku], hasUser: false }, {
                    page: 0,
                    perPage: 1
                  })
                  .pipe(
                    map(p => p.content),
                    catchError(_ => of([]))
                  )
          );
        return streams.length ? forkJoin(streams) : of([]);
      }),
      map(list => {
        return list
          .reduce((r, a) => {
            r.push(...a);
            return r;
          }, [])
          .sort((a, b) => a.displayText.localeCompare(b.displayText));
      }),
      tap(result => console.log(result))
    );
  }

  progress() {
    this.progressing = true;
    const license = this.selectedLicenseCtr.value as License;

    this.licenseService
      .assignUser(license.id, this.data.member.uuid)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastr.success(`Assign license successfully`);
          this.dialogRef.close(true);
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }
}
