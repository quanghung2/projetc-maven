import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { ExtensionUtilsService, LatestExtKeyInfo } from '@b3networks/api/callcenter';
import { Page } from '@b3networks/api/common';
import {
  CreateResourcesReq,
  GetLicenseReq,
  License,
  LicenseFeatureCode,
  LicenseService,
  LicenseStatQuery,
  LicenseStatistic
} from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

export interface ProvisionExtInput {
  licenseStatistic: LicenseStatistic;
  mappingConfig: HashMap<number>;
}

declare interface DefaultConfig {
  startFrom: number;
  numberOfUser: number;
}

interface ResourceInfo {
  licenseId: number;
  key: string;
}

interface DetailsConfig {
  resources: ResourceInfo[];
}

@Component({
  selector: 'b3n-provision-ext',
  templateUrl: './provision-ext.component.html',
  styleUrls: ['./provision-ext.component.scss']
})
export class ProvisionExtComponent implements OnInit {
  MAX_PROVISION_BULK = 25;
  provisioning: boolean;

  defaultFG: UntypedFormGroup;
  detailsFG: UntypedFormGroup;

  unprovisionedLicensePage: Page<License>;
  baseAddonStats: LicenseStatistic[] = [];

  readonly OBJECT_KEY_FUNC = Object.keys;

  get resourceFA(): UntypedFormArray {
    return this.detailsFG.get('resources') as UntypedFormArray;
  }

  //step 1
  resourceDS: MatTableDataSource<any> = new MatTableDataSource();
  displayedColumns = ['number', 'actions'];
  @ViewChild('resourcePaginator') resourcePaginator: MatPaginator;

  // extension provision step
  @ViewChild('provisionSteps') provisionSteps: MatStepper | null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProvisionExtInput,
    private dialogRef: MatDialogRef<ProvisionExtComponent>,
    private licenseService: LicenseService,
    private extUtilService: ExtensionUtilsService,
    private licenseStatQuery: LicenseStatQuery,
    private toastr: ToastService,
    private fb: UntypedFormBuilder
  ) {
    this.initControls();
  }

  ngOnInit(): void {
    forkJoin([
      this.licenseService.getLicenses(<GetLicenseReq>{ hasResource: false, skus: [this.data.licenseStatistic.sku] }, {
        page: 0,
        perPage: this.MAX_PROVISION_BULK
      }),
      this.extUtilService.getLatestExtKey().pipe(catchError(_ => of(<LatestExtKeyInfo>{})))
    ]).subscribe(([page, resp]) => {
      this.unprovisionedLicensePage = page;

      const numberOfUserCt = this.defaultFG.get('numberOfUser') as UntypedFormControl;
      numberOfUserCt.setValue(page.totalCount);
      numberOfUserCt.setValidators([Validators.required, Validators.min(1), Validators.max(page.totalCount)]);

      const startFromCt = this.defaultFG.get('startFrom') as UntypedFormControl;
      startFromCt.setValue(+resp.biggestKey + 1 || 100);
      startFromCt.setValidators([Validators.required, Validators.min(100), Validators.max(99999)]);
    });

    Object.keys(this.data.mappingConfig).forEach(addonSku => {
      const addonStat = this.licenseStatQuery.getEntity(addonSku);
      if (
        addonStat &&
        (addonStat.featureCodes.includes(LicenseFeatureCode.ip_phone) ||
          addonStat.featureCodes.includes(LicenseFeatureCode.phone_desktop))
      ) {
      }
    });
  }

  buildResource(defaultConfig) {
    if (this.data.licenseStatistic.isExtension) {
      for (let i = 0; i < defaultConfig.numberOfUser; i++) {
        this.resourceFA.push(
          this.fb.group({
            key: [+defaultConfig.startFrom + i, [Validators.required, Validators.min(100), Validators.max(99999)]],
            licenseId: this.unprovisionedLicensePage.content[i].id
          })
        );
        this.resourceDS.data = this.resourceFA.controls;
        this.resourceDS.paginator = this.resourcePaginator;
      }
    } else {
      this.resourceFA.push(
        this.fb.group({
          key: [+defaultConfig.startFrom, [Validators.required, Validators.min(100), Validators.max(99999)]],
          licenseId: this.unprovisionedLicensePage.content[0].id
        })
      );
      this.resourceDS.data = this.resourceFA.controls;
      this.resourceDS.paginator = this.resourcePaginator;
    }
  }

  go2DetailsStep() {
    const defaultConfig = this.defaultFG.value as DefaultConfig;
    this.resourceFA.clear();

    this.buildResource(defaultConfig);

    if (this.provisionSteps) {
      this.provisionSteps.next();
    }
  }

  removeResource(index: number) {
    console.log(index);
    this.resourceFA.removeAt(index);
    this.resourceDS.data = this.resourceFA.controls;
  }

  provision() {
    this.provisioning = true;

    // if (this.data.licenseStatistic.isCallGroup) {
    this.go2DetailsStep();
    // }

    const resources = this.resourceFA.value as ResourceInfo[];
    if (resources.length) {
      const req = <CreateResourcesReq>{
        type: this.data.licenseStatistic.isExtension ? 'extensions' : 'extensionGroups',
        extKeys: resources.map(r => r.key)
      };
      console.log(req);
      this.licenseService
        .createBulkResources(req)
        .pipe(finalize(() => (this.provisioning = false)))
        .subscribe(
          result => {
            const failedMessage = result.failedItems.map(f => `${f.extKey} ${f.error}`).join('\n');

            if (result.createdItems.length === resources.length) {
              this.toastr.success(`Provisioned successfully for ${result.createdItems.length} users`);
            } else if (result.createdItems.length > 0) {
              this.toastr.warning(
                `Provisioned successfully ${result.createdItems.length} users but failed ${result.failedItems.length} users due to:\n ${failedMessage}`
              );
            } else {
              this.toastr.warning(`Failed due to \n ${failedMessage}`);
            }
            this.dialogRef.close(result.createdItems.length > 0);
          },
          error => {
            this.toastr.warning(error.message);
          }
        );
    }

    // this.licenseService
    //   .createResource(+this.data.licenseStatistic.sku, <CreateExtReq>{ extKey: this.extKey.toString() }, 'extension')
    //   .subscribe(
    //     __ => {},
    //     error => {
    //       this.assigning = false;
    //       this.toastr.error(error.message);
    //     }
    //   );
  }

  private initControls() {
    this.defaultFG = this.fb.group({
      numberOfUser: this.fb.control(null, [Validators.required, Validators.min(1)]),
      startFrom: this.fb.control(100, [Validators.required, Validators.max(99999)])
    });

    this.detailsFG = this.fb.group({
      resources: this.fb.array([])
    });
  }
}
