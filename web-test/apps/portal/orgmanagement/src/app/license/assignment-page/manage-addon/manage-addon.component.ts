import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { License, LicenseService, LicenseStatistic } from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ManageAddonInput {
  license: License;
  mappingConfig: HashMap<number>;
  type: 'addons' | 'numbers' | 'sim';
  addonStats: LicenseStatistic[];
  simSku: string;
}

interface AddonLicense {
  id: number;
  sku: string;
  displayText: string;
  mapped: boolean;
  unassigning: boolean;
  license: License;
}

interface MappedLicenseAddon {
  sku: string;
  displayText: string;
  addonLicenses: [
    {
      addonLicense: AddonLicense;
      index: number;
    }
  ];
  quantity: number;
}

@Component({
  selector: 'b3n-manage-addon',
  templateUrl: './manage-addon.component.html',
  styleUrls: ['./manage-addon.component.scss']
})
export class ManageAddonComponent implements OnInit {
  license: License;
  mappingConfig: HashMap<number>;
  availableAddons: License[];
  mappedLicenses: AddonLicense[] = [];
  loading: boolean;
  progressing: boolean;
  addonSkus: string[] = [];
  totalCount: number;
  availableAddonStats: LicenseStatistic[];
  availableAddonStatsFilter: LicenseStatistic[];
  mappedLicenseAddons: MappedLicenseAddon[];
  simBelongToBase: boolean;

  @ViewChild('licenseSelection') licenseSelection: MatSelect;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManageAddonInput,
    private dialogRef: MatDialogRef<ManageAddonComponent>,
    private licenseService: LicenseService,
    private toastr: ToastService
  ) {}

  ngOnInit() {
    this.addonSkus = this.data.addonStats
      .filter(item => {
        switch (this.data.type) {
          case 'sim':
            return item.isNumber || item.sku === this.data.simSku;

          case 'numbers':
            return item.isNumber;

          case 'addons':
            return !item.isNumber;

          default:
            return item;
        }
      })
      .map(item => item.sku);

    this.license = this.data.license;
    this.mappingConfig = this.data.mappingConfig;
    this.mappedLicenses = this.license.mappings
      .filter(item => {
        switch (this.data.type) {
          case 'sim':
            return item.isNumber || item.sku === this.data.simSku;

          case 'numbers':
            return item.isNumber;

          case 'addons':
            return !item.isNumber;

          default:
            return item;
        }
      })
      .map(
        m =>
          <AddonLicense>{
            id: m.id,
            sku: m.sku,
            displayText: m.displayText,
            mapped: true,
            license: m
          }
      );

    this.simBelongToBase = !!this.mappingConfig[this.data.simSku];
    this.getAvailableAddonLicenses();
  }

  add2AssigningLicensesMapping(addon: License | LicenseStatistic) {
    if (addon instanceof LicenseStatistic) {
      addon = this.availableAddons.find(a => a.sku === addon.sku);
    }

    this.add2AssigningLicenses(addon);
  }

  add2AssigningLicenses(addon: License) {
    const currentCount = this.mappedLicenses.filter(m => m.sku === addon.sku && !m.unassigning).length;
    if (currentCount >= this.mappingConfig[addon.sku] || !this.mappingConfig[addon.sku]) {
      this.toastr.warning(`Exceeded quota for addon license (${addon.skuName})`);
      this.licenseSelection.value = null;
      return;
    }

    const index = this.availableAddons.findIndex(l => l.id === addon.id);
    this.availableAddons.splice(index, 1);
    this.refreshAvailableAddons();

    const mappedIndex = this.mappedLicenses.findIndex(m => m.id === addon.id);
    if (mappedIndex === -1) {
      this.mappedLicenses.push(<AddonLicense>{
        id: addon.id,
        sku: addon.sku,
        displayText: addon.displayText,
        license: addon
      });
    } else {
      this.mappedLicenses[mappedIndex].unassigning = false;
    }
    this.licenseSelection.value = null;

    this.refreshMappedLicenseAddons();
    this.refreshAvailableAddonsFilter();
  }

  assignable(mappedLicenseAddon: MappedLicenseAddon) {
    return this.availableAddonStats.find(a => a.sku === mappedLicenseAddon.sku).available;
  }

  assignMapping(mappedLicenseAddon: MappedLicenseAddon) {
    const addon = this.availableAddons.find(a => a.sku === mappedLicenseAddon.sku);
    this.add2AssigningLicenses(addon);
  }

  unassignMapping(mappedLicenseAddon: MappedLicenseAddon) {
    const { addonLicenses, quantity } = mappedLicenseAddon;
    const { addonLicense, index } = addonLicenses[quantity - 1];

    mappedLicenseAddon.quantity--;

    this.unassign(addonLicense, index);
  }

  /**
   * Remove assigned license
   * @param license
   */
  unassign(license: AddonLicense, index: number) {
    if (license.mapped) {
      license.unassigning = true;
    } else {
      this.mappedLicenses.splice(index, 1);
    }
    this.availableAddons?.push(license.license);
    this.availableAddons?.sort((a, b) =>
      a.displayText > b.displayText ? 1 : a.displayText === b.displayText ? 0 : -1
    );

    this.refreshAvailableAddons();
    this.refreshAvailableAddonsFilter();
  }

  async update() {
    const unassignStreams: Observable<void>[] = [];
    const assigningStreams: Observable<void>[] = [];
    const errors: string[] = [];
    this.mappedLicenses
      .filter(l => l.mapped && l.unassigning)
      .forEach(l => {
        unassignStreams.push(
          this.licenseService.unassignAddon(this.license.id, l.id).pipe(
            catchError(error => {
              errors.push(`Failed to un-assign ${this.license.displayText} due to ${error.message}`);
              return of(null);
            })
          )
        );
      });

    this.mappedLicenses
      .filter(l => !l.mapped)
      .forEach(l => {
        assigningStreams.push(
          this.licenseService.assignAddon(this.license.id, l.id).pipe(
            catchError(error => {
              errors.push(`Failed to assign ${this.license.displayText} due to ${error.message}`);
              return of(null);
            })
          )
        );
      });

    if (!unassignStreams.length && !assigningStreams.length) {
      this.toastr.warning(`No changed`);
      return;
    }

    if (this.data.type === 'sim') {
      let assignedLoop = 0;
      let unassignedLoop = 0;

      const simAddon = this.availableAddonStats[0];
      const maxUnassignedSim = unassignStreams.length;
      const maxAssignedSim = assigningStreams.length;
      const simLicense =
        this.availableAddons.find(a => a.sku === this.data.simSku) ??
        this.mappedLicenses.find(m => m.sku === this.data.simSku);

      if (simAddon) {
        while (simLicense && assignedLoop < simAddon.quantity && maxAssignedSim) {
          assigningStreams.push(
            this.licenseService.assignAddon(this.license.id, simLicense.id).pipe(
              catchError(error => {
                errors.push(`Failed to assign ${this.license.displayText} due to ${error.message}`);
                return of(null);
              })
            )
          );

          assignedLoop++;
        }
      }

      while (simLicense && unassignedLoop < maxUnassignedSim) {
        unassignStreams.push(
          this.licenseService.unassignAddon(this.license.id, simLicense.id).pipe(
            catchError(error => {
              errors.push(`Failed to un-assign ${this.license.displayText} due to ${error.message}`);
              return of(null);
            })
          )
        );

        unassignedLoop++;
      }
    }

    try {
      this.progressing = true;

      // NOTE: must mapping sync for backend can process
      for (const s of unassignStreams) {
        await s.toPromise();
      }
      for (const s of assigningStreams) {
        await s.toPromise();
      }

      this.progressing = false;

      if (errors.length) {
        if (unassignStreams.length + assigningStreams.length === errors.length) {
          this.toastr.warning(`Update addon licenses unsuccessful`);
        } else {
          this.toastr.warning(errors.join('\n'), 5000);
        }
      } else {
        this.toastr.success(`Update addon licenses successful`);
      }

      this.dialogRef.close(true);
    } catch (error) {
      this.toastr.error(error?.['message']);
    }
  }

  licenseTrackByFunc(index, item: License | AddonLicense | MappedLicenseAddon) {
    return item != null ? item['id'] || item['sku'] : null;
  }

  async getAvailableAddonLicenses() {
    this.loading = true;
    let page = 0;
    const res: License[] = [];

    do {
      await (this.data.type === 'sim'
        ? this.licenseService.getAvailableAddonsWithFilter([this.license.sku], this.addonSkus, true, false, {
            page,
            perPage: 100
          })
        : this.licenseService.getAvailableAddons([this.license.sku], this.addonSkus, { page, perPage: 100 })
      )
        .toPromise()
        .then(data => {
          if (!this.totalCount) {
            this.totalCount = data.total;
          }

          res.push(...data.data);
          page++;
        });
    } while (res.length < this.totalCount);

    if (this.data.type === 'sim') {
      const license = await this.licenseService.getAvailableAddons([], [this.data.simSku]).toPromise();
      res.push(...license.data);
    }

    const addonSkuNumber: HashMap<number> = this.mappedLicenses.reduce(function (r, a) {
      r[a.sku] = r[a.sku] || 0;
      ++r[a.sku];
      return r;
    }, {});

    this.availableAddons = [];

    res
      .filter(item => {
        let condition: boolean;
        const info = item.resource?.info;

        switch (this.data.type) {
          case 'sim':
            condition = (item.isNumber && info?.isDevice) || item.sku === this.data.simSku;
            break;

          case 'numbers':
            condition = this.simBelongToBase ? item.isNumber && !info?.isDevice : item.isNumber;
            break;

          case 'addons':
            condition = !item.isNumber;
            break;

          default:
            condition = true;
            break;
        }

        return item.sku in this.mappingConfig && condition;
      })
      .sort((a, b) => a.displayText.localeCompare(b.displayText))
      .forEach(a => {
        addonSkuNumber[a.sku] = addonSkuNumber[a.sku] || 0;
        if (addonSkuNumber[a.sku] < this.mappingConfig[a.sku] || a.isNumber) {
          this.availableAddons.push(a);
          ++addonSkuNumber[a.sku];
        }
      });

    this.refreshMappedLicenseAddons();
    this.refreshAvailableAddons();
    this.refreshAvailableAddonsFilter();
    this.loading = false;
  }

  refreshAvailableAddons() {
    if (this.data.type === 'numbers') {
      return;
    }

    let availableAddonStatsTmp = [...this.data.addonStats];

    if (this.data.type === 'sim') {
      availableAddonStatsTmp = availableAddonStatsTmp.filter(item => item.sku === this.data.simSku);
    }

    this.availableAddonStats = availableAddonStatsTmp.reduce<LicenseStatistic[]>((prev, curr) => {
      const newAddonStat = cloneDeep(curr);
      const availableAddon = this.availableAddons.filter(a => a.sku === curr.sku);

      newAddonStat.available = !!availableAddon?.length;
      newAddonStat.quantity = availableAddon.length;

      prev.push(newAddonStat);

      return prev;
    }, []);
  }

  refreshAvailableAddonsFilter() {
    if (this.data.type !== 'addons') {
      return;
    }

    this.availableAddonStatsFilter = this.availableAddonStats
      .filter(a => a.available && a.sku !== this.data.simSku)
      .filter(a => {
        return this.mappedLicenseAddons.every(m => m.sku !== a.sku || m.quantity === 0);
      });
  }

  refreshMappedLicenseAddons() {
    if (this.data.type !== 'addons') {
      return;
    }

    this.mappedLicenseAddons = this.mappedLicenses.reduce<MappedLicenseAddon[]>((prev, curr, i) => {
      let mappedLicenseAddon: MappedLicenseAddon = prev.find(p => p.sku === curr.sku);

      if (!mappedLicenseAddon) {
        mappedLicenseAddon = {
          sku: curr.sku,
          displayText: curr.displayText,
          addonLicenses: [
            {
              addonLicense: curr,
              index: i
            }
          ],
          quantity: curr.unassigning ? 0 : 1
        };

        prev.push(mappedLicenseAddon);
      } else {
        mappedLicenseAddon.addonLicenses.push({
          addonLicense: curr,
          index: i
        });

        mappedLicenseAddon.quantity += curr.unassigning ? 0 : 1;
      }

      return prev;
    }, []);
  }

  quantityKeyDown(e: KeyboardEvent) {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  }

  changeQuantity(
    currentQuantity: number,
    newQuantity: number | string,
    mappedLicenseAddon: MappedLicenseAddon,
    input: HTMLInputElement
  ) {
    if (newQuantity === '') {
      return;
    }

    if (newQuantity < 0) {
      input.value = currentQuantity.toString();
      return;
    }

    let quantity = newQuantity > currentQuantity ? +newQuantity - currentQuantity : currentQuantity - +newQuantity;

    if (newQuantity > currentQuantity) {
      while (quantity > 0) {
        if (this.assignable(mappedLicenseAddon)) {
          this.assignMapping(mappedLicenseAddon);
        } else {
          break;
        }

        quantity--;
      }
    } else {
      while (quantity > 0) {
        this.unassignMapping(mappedLicenseAddon);
        quantity--;
      }
    }

    const finalQuantity = newQuantity > currentQuantity ? +newQuantity - quantity : newQuantity >= 0 ? +newQuantity : 0;

    mappedLicenseAddon.quantity = finalQuantity;
    input.value = finalQuantity.toString();
  }

  async configSIM(number: AddonLicense) {
    const sim = this.mappedLicenses.find(l => l.sku === this.data.simSku);

    let errorMsg = '';
    let obs$: Observable<void>;

    if (number.license.resource?.info?.physicalSimStatus) {
      obs$ = this.licenseService.unassignAddon(this.license.id, sim.id).pipe(
        catchError(error => {
          errorMsg = `Failed to un-assign ${this.license.displayText} due to ${error.message}`;
          return of(null);
        })
      );
    } else {
      const simLicense =
        this.availableAddons.find(a => a.sku === this.data.simSku) ??
        this.mappedLicenses.find(m => m.sku === this.data.simSku);

      if (simLicense) {
        obs$ = this.licenseService.assignAddon(this.license.id, simLicense.id).pipe(
          catchError(error => {
            errorMsg = `Failed to assign ${this.license.displayText} due to ${error.message}`;
            return of(null);
          })
        );
      } else {
        this.toastr.warning(`There's no SIM available`);
        return;
      }
    }

    try {
      this.progressing = true;

      await obs$.toPromise();

      this.progressing = false;

      errorMsg ? this.toastr.warning(errorMsg) : this.toastr.success(`${sim ? 'Unlink' : 'Link'} SIM successfully`);

      this.dialogRef.close(true);
    } catch (error) {
      this.toastr.error(error?.['message']);
    }
  }
}
