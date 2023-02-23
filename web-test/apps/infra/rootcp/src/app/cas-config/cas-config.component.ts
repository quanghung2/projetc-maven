import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CASConfig, CASConfigService, getStandardCasConfig, ResCASConfig } from '@b3networks/api/infra';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { StoreCASConfigComponent, StoreCASConfigData } from './store-cas-config/store-cas-config.component';

export enum CAS_CONFIG {
  keyFilter = 'filter',
  keyConfig = 'config',
  valueFilter = 'Filter rules',
  valueConfig = 'CAS server config'
}

export enum ACTION_CAS_CONFIG {
  Add = 'Add',
  Update = 'Update',
  Delete = 'Delete',
  Get = 'Get'
}

@Component({
  selector: 'b3n-cas-config',
  templateUrl: './cas-config.component.html',
  styleUrls: ['./cas-config.component.scss']
})
export class CASConfigComponent implements OnInit {
  formCASConfig: UntypedFormGroup;
  loading: boolean;
  dataCASConfig: ResCASConfig = {};
  cloneDataCASConfig: ResCASConfig = {};
  readonly CASModules: CASConfig[] = [
    { key: CAS_CONFIG.keyFilter, value: CAS_CONFIG.valueFilter },
    { key: CAS_CONFIG.keyConfig, value: CAS_CONFIG.valueConfig }
  ];
  readonly ACTION_CAS_CONFIG = ACTION_CAS_CONFIG;

  constructor(
    private casConfigService: CASConfigService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formCASConfig = this.fb.group({
      appModule: [CAS_CONFIG.keyFilter],
      searchAppConfig: ['']
    });

    this.getCASConfig(CAS_CONFIG.keyFilter);

    this.formCASConfig.controls['appModule'].valueChanges.subscribe((appModule: string) => {
      this.getCASConfig(appModule);
    });

    this.formCASConfig.controls['searchAppConfig'].valueChanges.subscribe((searchAppConfig: string) => {
      const result = Object.keys(this.cloneDataCASConfig)
        .filter(item => item.toLowerCase().includes(searchAppConfig.trim().toLowerCase()))
        .reduce((obj, key) => {
          return Object.assign(obj, {
            [key]: this.cloneDataCASConfig[key]
          });
        }, {});

      this.dataCASConfig = result;
    });
  }

  comparer(a: CASConfig, b: CASConfig): boolean {
    return a && b ? a.value === b.value : a === b;
  }

  getCASConfig(module: string, action = ACTION_CAS_CONFIG.Get) {
    this.loading = true;
    this.casConfigService
      .getConfig(module)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          const result = module === CAS_CONFIG.keyFilter ? res['DO_NOT_SEND'] : res;
          this.dataCASConfig = this.sortCASConfig(result);
          this.cloneDataCASConfig = this.dataCASConfig;
          this.formCASConfig.controls['searchAppConfig'].setValue('');
          this.toastService.success(`${action} ${module} success`);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  createConfig() {
    this.handlerConfig();
  }

  deleteConfig(data: CASConfig, action = ACTION_CAS_CONFIG.Delete) {
    this.handlerConfig(data, action);
  }

  updateConfig(data: CASConfig, action = ACTION_CAS_CONFIG.Update) {
    this.handlerConfig(data, action);
  }

  handlerConfig(data: CASConfig = undefined, action = ACTION_CAS_CONFIG.Add) {
    if (action === ACTION_CAS_CONFIG.Delete) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '450px',
          data: <ConfirmDialogInput>{
            title: `${action} CAS Module`,
            message: `This action will delete <b>${data.key}</b> from CAS Module. Are you sure to delete?`,
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            delete this.cloneDataCASConfig[data.key];
            this.onUpdateConfig(action);
          }
        });

      return;
    }

    this.dialog
      .open(StoreCASConfigComponent, {
        width: '500px',
        disableClose: true,
        data: <StoreCASConfigData>{
          listData: this.cloneDataCASConfig,
          appModule: this.appModule,
          currentData: data,
          action: action
        }
      })
      .afterClosed()
      .subscribe((data: ResCASConfig) => {
        if (data) {
          this.onUpdateConfig(action, data);
        }
      });
  }

  onUpdateConfig(action: ACTION_CAS_CONFIG, dataUpdate: ResCASConfig = {}) {
    this.loading = true;
    const data = Object.assign(dataUpdate, this.cloneDataCASConfig);
    this.casConfigService
      .updateConfig(this.appModule, data)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          this.getCASConfig(this.appModule, action);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  sortCASConfig(CASConfig: ResCASConfig) {
    return Object.keys(CASConfig)
      .sort()
      .reduce((obj, key) => {
        obj[key] = CASConfig[key];
        return obj;
      }, {});
  }

  showDataCasConfig(item: ResCASConfig) {
    return getStandardCasConfig(item, this.appModule);
  }

  get appModule() {
    return this.formCASConfig.value.appModule;
  }
}
