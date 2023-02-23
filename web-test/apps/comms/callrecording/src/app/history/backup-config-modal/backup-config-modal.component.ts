import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HistoryService } from '../../shared/service';
import { BackupFile } from '../../shared/model/backup-file.model';

declare var jQuery: any;
declare var X: any;
declare var _: any;
@Component({
  selector: 'app-backup-config-modal',
  templateUrl: './backup-config-modal.component.html',
  styleUrls: ['./backup-config-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class BackupConfigModalComponent implements OnInit {
  @ViewChild('fromDateElement', { static: true }) fromDateElement: ElementRef;
  @ViewChild('toDateElement', { static: true }) toDateElement: ElementRef;

  public backupConfig: any = {};
  private fromDate: number;
  private toDate: number;
  private downloadLinks: any = {};
  private downloadLinkKeys: any[] = [];
  public fetchingUrls: boolean = false;
  public deleting: boolean = false;
  public backupFiles: BackupFile[];

  constructor(private historyService: HistoryService) {}

  ngOnInit() {
    setTimeout(() => {
      jQuery(this.fromDateElement.nativeElement)
        .find('.ui.calendar:first')
        .calendar({
          type: 'date',
          onChange: (date, text, mode) => {
            try {
              this.fromDate = date.getTime();
            } catch (e) {}
          }
        });

      jQuery(this.toDateElement.nativeElement)
        .find('.ui.calendar:first')
        .calendar({
          type: 'date',
          startCalendar: jQuery('#backup-from-date'),
          onChange: (date, text, mode) => {
            this.toDate = date.getTime();
          }
        });
    }, 100);

    this.backupFiles = [];
    this.historyService.getBackupConfig().then(data => {
      this.backupConfig = data;
    });
  }

  changeBackupStatus(enable: boolean) {
    this.historyService.updateBackupConfig(enable).then(data => (this.backupConfig = data));
  }

  fetchDownloadUrls() {
    this.fetchingUrls = true;
    this.historyService
      .fetchDownloadLinks(this.fromDate, this.toDate)
      .then(data => {
        this.fetchingUrls = false;
        this.downloadLinkKeys = Object.keys(data).sort();
        this.downloadLinks = data;
      })
      .catch(err => {
        this.fetchingUrls = false;
        X.showWarn('Failed to fetch download URLs');
      });
  }

  fetchBackUpFiles() {
    this.fetchingUrls = true;
    this.historyService
      .fetchBackupFiles(this.fromDate, this.toDate)
      .then((data: any) => {
        this.fetchingUrls = false;
        this.backupFiles = data;
      })
      .catch(err => {
        this.fetchingUrls = false;
        X.showWarn('Failed to fetch backup files');
      });
  }

  deleteFiles() {
    this.deleting = true;
    this.historyService
      .deleteBulk(this.fromDate, this.toDate)
      .then(data => {
        this.deleting = false;
      })
      .catch(err => {
        this.deleting = false;
        X.showWarn('Fail to delete recording files');
      });
  }
}
