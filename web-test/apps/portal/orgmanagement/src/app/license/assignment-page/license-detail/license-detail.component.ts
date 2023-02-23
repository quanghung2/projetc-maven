import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import {
  AddonLicenseMapping,
  License,
  LicenseService,
  LicenseStatistic,
  LicenseStatQuery
} from '@b3networks/api/license';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ManageAddonComponent, ManageAddonInput } from '../manage-addon/manage-addon.component';
import { ManageUserComponent, ManageUserInput } from '../manage-user/manage-user.component';
import { UpdateExtDialogData, UpdateExtensionComponent } from '../update-extension/update-extension.component';

export interface LicenseDetailEvent {
  close: boolean;
}

@Component({
  selector: 'b3n-license-detail',
  templateUrl: './license-detail.component.html',
  styleUrls: ['./license-detail.component.scss']
})
export class LicenseDetailComponent implements OnInit {
  readonly OBJECT_KEYS_FUNC = Object.keys;

  private _mappingConfig: HashMap<number>;
  private _numberMappingConfig: HashMap<number>;
  private _addonMappingConfig: HashMap<number>;
  private _simMappingConfig: HashMap<number>;
  private _extension: ExtensionBase;

  license: License;
  addonLicenses: License[];
  addonLicenseMappings: AddonLicenseMapping[];
  numberLicenses: License[];
  numberLicensesWOSim: License[];
  numberLicensesWSim: License[];
  simSku: string;

  extension$: Observable<ExtensionBase>;

  @Input() set licenseInput(license: License) {
    this.license = license;
    if (license) {
      this.addonLicenses = this.license?.mappings.filter(li => !li.isNumber);
      this.addonLicenseMappings = this.license?.addonLicenseMappings?.filter(a => !a.isNumber);
      this.numberLicenses = this.license?.mappings.filter(li => li.isNumber);
      this.numberLicensesWOSim = this.license?.mappings.filter(li => li.isNumber && !li.resource.info?.isDevice);
      this.numberLicensesWSim = this.license?.mappings.filter(li => li.isNumber && li.resource.info?.isDevice);
      if (license.isExtension) {
        this.extension$ = this.extensionQuery
          .selectExtension(license.resourceKey)
          .pipe(tap(ext => (this._extension = ext)));
      }
    }
  }

  @Input() set mappingConfig(mapping: HashMap<number>) {
    this._numberMappingConfig = {};
    this._addonMappingConfig = {};
    this._simMappingConfig = {};

    const numberLicenseStat = this.licenseStatsQuery.getNumberLicense();
    const simLicenseStat = this.licenseStatsQuery.getSimLicense();

    if (simLicenseStat && mapping && mapping[simLicenseStat.sku]) {
      this._simMappingConfig[simLicenseStat.sku] = mapping[simLicenseStat.sku];
    }

    if (numberLicenseStat && mapping && mapping[numberLicenseStat.sku]) {
      this._numberMappingConfig[numberLicenseStat.sku] = mapping[numberLicenseStat.sku];
    }

    Object.keys(mapping)
      .filter(key => simLicenseStat?.sku !== key && numberLicenseStat?.sku !== key)
      .forEach(key => (this._addonMappingConfig[key] = mapping[key]));

    this._mappingConfig = mapping;

    if (simLicenseStat) {
      this.simSku = simLicenseStat.sku;
    }
  }

  @Input() teamUuid: string;
  @Input() addonStats: LicenseStatistic[];

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  get mappingConfig() {
    return this._mappingConfig;
  }

  get addonMappingConfig() {
    return this._addonMappingConfig;
  }

  get numberMappingConfig() {
    return this._numberMappingConfig;
  }

  get simMappingConifg() {
    return this._simMappingConfig;
  }

  @Output() licenseChanged = new EventEmitter<LicenseDetailEvent>();

  constructor(
    private licenseStatsQuery: LicenseStatQuery,
    private extensionQuery: ExtensionQuery,
    private licenseService: LicenseService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  manageUser() {
    this.dialog
      .open(ManageUserComponent, {
        width: '500px',
        disableClose: true,
        data: <ManageUserInput>{ license: this.license, teamUuid: this.teamUuid }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.licenseChanged.emit({ close: true });
        }
      });
  }

  manageAddon(type: 'addons' | 'numbers' | 'sim') {
    this.dialog
      .open(ManageAddonComponent, {
        width: '680px',
        disableClose: true,
        data: <ManageAddonInput>{
          license: this.license,
          mappingConfig: this.mappingConfig,
          type,
          addonStats: this.addonStats,
          simSku: this.simSku
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.licenseChanged.emit();
        }
      });
  }

  deleteExt() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: `Delete Phone System`,
          message: `Are you sure to delete a phone system <strong>${this.license.resource.key}</strong>? All related configurations will be cleaned up and this action cannot be undone.`,
          confirmLabel: 'Delete',
          color: 'warn'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.licenseService.deleteExt(this.license.resource.key).subscribe(
            _ => {
              this.toastService.success('Delete extension successfully');
              this.licenseChanged.emit({ close: true });
            },
            err => {
              this.toastService.error(err.message);
            }
          );
        }
      });
  }

  async editExtension() {
    this.dialog
      .open(UpdateExtensionComponent, {
        width: '400px',
        data: <UpdateExtDialogData>{
          license: this.license,
          extension: this._extension
        }
      })
      .afterClosed()
      .subscribe((res: { updatedKey: boolean; updated: boolean }) => {
        if (res?.updatedKey) {
          this.licenseChanged.emit();
        }
      });
  }
}
