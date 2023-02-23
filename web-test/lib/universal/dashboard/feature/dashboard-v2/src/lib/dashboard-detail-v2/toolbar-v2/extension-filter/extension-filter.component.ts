import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DashboardV2Service, EXTENSION_WIDTH, QuestionV2SourceFilter } from '@b3networks/api/dashboard';
import { DashboardV2AppSettingFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { filter, first, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-extension-filter',
  templateUrl: './extension-filter.component.html',
  styleUrls: ['./extension-filter.component.scss']
})
export class ExtensionFilterComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('extensionsDropdown') extensionsDropdown: MatSelect;
  @Input() form: UntypedFormGroup;
  @Input() storedFilter: DashboardV2AppSettingFilter;

  selectAllExtension: boolean;
  hasExtensionFilterV2: boolean;
  fetchedExtension: boolean;
  allExtensions: ExtensionBase[] = [];
  allExtensionsFilter: ExtensionBase[] = [];
  allExtensionsKeys: string[] = [];
  selectedExtensionsMap: HashMap<boolean> = {};

  constructor(
    private dashboardV2Service: DashboardV2Service,
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQuery,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit() {
    this.handleExtensionFilter();
  }

  toggleSelectAllExtension(checked: boolean) {
    this.extensions.setValue(checked ? this.allExtensionsKeys : []);
    this.allExtensions.forEach(e => {
      this.selectedExtensionsMap[e.extKey] = checked;
    });
  }

  handleExtensionFilter() {
    this.dashboardV2Service.extensionFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(async extensionFilterHash => {
          if (
            !this.hasExtensionFilterV2 &&
            !this.extensions?.value?.length &&
            this.fetchedExtension &&
            this.allExtensionsKeys.length &&
            extensionFilterHash
          ) {
            this.extensions.setValue(this.allExtensionsKeys);
          }

          this.checkHasExtensionFilterV2(extensionFilterHash);

          if (this.hasExtensionFilterV2 && !this.fetchedExtension) {
            this.fetchedExtension = true;
            const fetchingExtension = this.dashboardV2Service.fetchingExtension$.getValue();

            if (!this.extensionQuery.getHasCache() && !fetchingExtension) {
              this.dashboardV2Service.fetchingExtension$.next(true);
              await this.extensionService.getAllExtenison().toPromise();
              this.dashboardV2Service.fetchingExtension$.next(false);
            }

            this.extensionQuery.allAssignedExtensions$
              .pipe(
                filter(allExtensions => !!allExtensions?.length),
                first(),
                tap(allExtensions => {
                  this.allExtensions = allExtensions;
                  this.allExtensionsFilter = cloneDeep(this.allExtensions);
                  this.allExtensions.forEach(e => {
                    this.selectedExtensionsMap[e.extKey] = false;
                  });

                  this.listenControls();
                  this.allExtensionsKeys = this.allExtensions.map(e => e.extKey);
                  this.setValueFromStoredFilter();
                })
              )
              .subscribe();
          }
        })
      )
      .subscribe();
  }

  listenControls() {
    this.extensions.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(extensions => {
          if (extensions[0] === -1) {
            this.extensionsDropdown.close();
            this.extensions.setValue([]);
          } else {
            this.selectAllExtension = extensions?.length === this.allExtensions.length;
            this.dashboardV2Service.extensionKeys$.next(extensions);
          }
        })
      )
      .subscribe();

    this.searchExt.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(search => {
          const value = (search as string).toLowerCase().trim();
          this.allExtensionsFilter = this.allExtensions.filter(e => {
            return e.extKey?.includes(value) || e.extLabel?.toLowerCase().includes(value);
          });
        })
      )
      .subscribe();
  }

  setValueFromStoredFilter() {
    if (this.storedFilter?.extensions) {
      this.storedFilter.extensions.forEach(extKey => {
        if (this.selectedExtensionsMap[extKey] !== undefined) {
          this.selectedExtensionsMap[extKey] = true;
        }
      });

      this.extensions.setValue(this.storedFilter.extensions);
    } else {
      this.extensions.setValue(this.allExtensionsKeys);
    }

    if (this.storedFilter?.searchExt) {
      this.searchExt.setValue(this.storedFilter.searchExt);
    }
  }

  checkHasExtensionFilterV2(extensionFilterHash: HashMap<boolean>) {
    this.hasExtensionFilterV2 = false;
    const keys = Object.keys(extensionFilterHash);

    keys.every(uuid => {
      if (extensionFilterHash[uuid]) {
        this.hasExtensionFilterV2 = true;
        this.dashboardV2Service.setFiltersWidthHash(QuestionV2SourceFilter.EXTENSION, EXTENSION_WIDTH);
        return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  optionClick(extKey: string) {
    this.selectedExtensionsMap[extKey] = !this.selectedExtensionsMap[extKey];
    const selectedExtensions = Object.keys(this.selectedExtensionsMap).filter(extKey => {
      return !!this.selectedExtensionsMap[extKey];
    });
    this.extensions.setValue(selectedExtensions);
  }

  get extensions() {
    return this.form?.controls['extensions'];
  }

  get searchExt() {
    return this.form?.controls['searchExt'];
  }
}
