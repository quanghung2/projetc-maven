import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Dashboard2, Dashboard2Map, DashboardV2Service, DASHBOARD_TYPE, Management } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest, firstValueFrom } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';

export interface StoreAccessInput {
  management: Management;
  dashboard2s: Dashboard2[];
}

type SelectDashboardForm = FormGroup<{
  dashboardUuids: FormControl<string[]>;
  search: FormControl<string>;
  type: FormControl<number>;
}>;

@Component({
  selector: 'b3n-store-access',
  templateUrl: './store-access.component.html',
  styleUrls: ['./store-access.component.scss']
})
export class StoreAccessComponent extends DestroySubscriberComponent implements OnInit {
  form: SelectDashboardForm;
  dashboard2sFilter: Dashboard2[] = [];
  dashboard2Map: Dashboard2Map = {};
  hasCustom: boolean;
  selectAll: boolean;
  loading: boolean;

  readonly DASHBOARD_TYPE = DASHBOARD_TYPE;

  constructor(
    public dialogRef: MatDialogRef<StoreAccessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreAccessInput,
    private fb: FormBuilder,
    private dashboardV2Service: DashboardV2Service,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.initForm();
    this.initData();
  }

  initForm() {
    this.form = this.fb.group({
      dashboardUuids: [[] as string[]],
      search: [''],
      type: [this.DASHBOARD_TYPE[0].key]
    });

    combineLatest([this.search.valueChanges.pipe(startWith('')), this.type.valueChanges.pipe(startWith(1))])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([search, type]) => {
          const value = (search as string).toLowerCase().trim();
          this.dashboard2sFilter = this.data.dashboard2s.filter(d => {
            const searchCondition = () => d.name?.toLowerCase().trim().includes(value);
            let filterCondition: () => void;

            switch (type) {
              case 1:
                filterCondition = null;
                break;

              case 2:
                filterCondition = () => d.isDefault;
                break;

              case 3:
                filterCondition = () => !d.isDefault;
                break;
            }

            return filterCondition ? searchCondition() && filterCondition() : searchCondition();
          });
        })
      )
      .subscribe();
  }

  async initData() {
    this.dashboard2sFilter = cloneDeep(this.data.dashboard2s);
    this.data.dashboard2s.forEach(d => {
      this.dashboard2Map[d.uuid] = {
        selected: false
      };
      this.hasCustom = !!this.data.dashboard2s.find(d => !d.isDefault);
    });

    const selectedUuids = [];

    if (this.data.management.userAccessAll) {
      this.selectAll = true;

      for (const uuid in this.dashboard2Map) {
        this.dashboard2Map[uuid].selected = true;
        selectedUuids.push(uuid);
      }
    } else {
      this.selectAll = false;

      for (const uuid in this.dashboard2Map) {
        if (this.data.management.dashboardUuids.includes(uuid)) {
          this.dashboard2Map[uuid].selected = true;
          selectedUuids.push(uuid);
        }
      }
    }

    this.dashboardUuids.setValue(selectedUuids);
  }

  toggleSelectAll() {
    if (this.selectAll) {
      for (const uuid in this.dashboard2Map) {
        this.dashboard2Map[uuid].selected = false;
      }

      this.dashboardUuids.setValue([]);
    } else {
      const selectedUuids = [];

      for (const uuid in this.dashboard2Map) {
        this.dashboard2Map[uuid].selected = true;
        selectedUuids.push(uuid);
      }

      this.dashboardUuids.setValue(selectedUuids);
    }

    this.selectAll = !this.selectAll;
  }

  dashboardOptionClick(uuid: string) {
    this.dashboard2Map[uuid].selected = !this.dashboard2Map[uuid].selected;
    const selectedUuids = [];

    for (const uuid in this.dashboard2Map) {
      if (this.dashboard2Map[uuid].selected) {
        selectedUuids.push(uuid);
      }
    }

    this.selectAll = selectedUuids.length === this.data.dashboard2s.length;
    this.dashboardUuids.setValue(selectedUuids);
  }

  async save() {
    this.loading = true;
    const dashboardUuids = this.selectAll ? ['*'] : this.dashboardUuids.value;

    try {
      await firstValueFrom(
        this.dashboardV2Service.changeExtManagement(this.data.management.identityUuid, dashboardUuids)
      );
      this.toastService.success(`Update dashboard access for ${this.data.management.extLabel} successfully`);
      this.dialogRef.close(true);
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.loading = false;
    }
  }

  get dashboardUuids() {
    return this.form.controls['dashboardUuids'];
  }

  get search() {
    return this.form.controls['search'];
  }

  get type() {
    return this.form.controls['type'];
  }
}
