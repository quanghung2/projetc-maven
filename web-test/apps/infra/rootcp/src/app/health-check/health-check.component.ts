import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CpService, SettingHealthCheck, StatusHealthCheck } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import Fuse from 'fuse.js';
import { cloneDeep } from 'lodash';
import { combineLatest, forkJoin } from 'rxjs';
import { debounceTime, finalize, startWith } from 'rxjs/operators';
import { SettingDialogComponent } from './setting-dialog/setting-dialog.component';

@Component({
  selector: 'b3n-health-check',
  templateUrl: './health-check.component.html',
  styleUrls: ['./health-check.component.scss']
})
export class HealthCheckComponent implements OnInit, OnDestroy {
  tagCtrl = new FormControl();
  searchCtrl = new FormControl();
  loading: boolean;
  statuses: StatusHealthCheck[];
  filteredStatuses: StatusHealthCheck[] = [];
  selectedStatus: StatusHealthCheck;

  sourceTags: string[] = [];
  filteredTags: string[];
  tagFilterCtrl = new FormControl();

  times = [
    { value: 30, display: '30 seconds' },
    { value: 60, display: '1 minute' },
    { value: 300, display: '5 minutes' }
  ];
  timeCtrl = new FormControl(60);
  autoReloadStatus;
  lastUpdated: Date;
  settings: SettingHealthCheck[];

  constructor(private dialog: MatDialog, private cpService: CpService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin([this.cpService.getStatus(), this.cpService.getSetting()])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(([statuses, settings]) => {
        this.settings = settings;
        this.setDataStatus(statuses);
        this.setAutoRefresh();
      });

    this.tagFilterCtrl.valueChanges.subscribe((str: string) => {
      this.filteredTags = this.sourceTags.filter(t => t.indexOf(str.toLowerCase()) >= 0);
    });

    combineLatest([this.tagCtrl.valueChanges, this.searchCtrl.valueChanges.pipe(startWith(''))])
      .pipe(debounceTime(300))
      .subscribe(([tags, searchStr]) => {
        const str = searchStr.trim().toLowerCase();
        let result = [];
        result = this.statuses.filter(
          s => [...new Set([...tags, ...s.metadata.tags])].length < tags.length + s.metadata.tags.length
        );
        if (str) {
          const options = { keys: ['name'], threshold: 0.3, includeScore: true };
          const fuse = new Fuse(result, options);
          this.filteredStatuses = fuse.search(str).map(r => r.item);
        } else {
          this.filteredStatuses = result;
        }
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.autoReloadStatus);
  }

  refresh() {
    clearInterval(this.autoReloadStatus);
    this.cpService.getStatus().subscribe(statuses => {
      this.setDataStatus(statuses);
      this.setAutoRefresh();
    });
  }

  toggleSelectAll(selectAllValue: boolean) {
    if (selectAllValue) {
      this.tagCtrl.patchValue(this.sourceTags);
    } else {
      this.tagCtrl.patchValue([]);
    }
  }

  openDialog(status?: StatusHealthCheck) {
    if (status) {
      const setting = this.settings.find(s => s.id === status.id);
      if (setting) {
        this.openDialogSetting(setting);
      } else {
        this.toastService.error('Setting not found');
      }
    } else {
      this.openDialogSetting();
    }
  }

  private setDataStatus(statuses: StatusHealthCheck[]) {
    this.statuses = statuses;
    this.sourceTags = [...new Set(statuses.reduce((a, { metadata }) => [...a, ...metadata.tags], []))];
    this.lastUpdated = new Date();
    this.filteredTags = this.sourceTags;
    this.tagCtrl.patchValue(this.filteredTags);
    if (this.selectedStatus) {
      const newSelectedStatus = statuses.find(s => s.id === this.selectedStatus.id);
      if (newSelectedStatus) {
        this.selectedStatus = newSelectedStatus;
      }
    }
  }

  private setAutoRefresh() {
    this.autoReloadStatus = setInterval(() => {
      this.cpService.getStatus().subscribe(statuses => {
        this.setDataStatus(statuses);
      });
    }, this.timeCtrl.value * 1000);
  }

  private openDialogSetting(setting?: SettingHealthCheck) {
    this.dialog
      .open(SettingDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: cloneDeep(setting)
      })
      .afterClosed()
      .subscribe((res: SettingHealthCheck[]) => {
        if (res) {
          this.settings = res;
          this.refresh();
        }
      });
  }
}
