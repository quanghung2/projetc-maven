import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActionMapping, IdentityProfileQuery, IdentityProfileService, MemberRole } from '@b3networks/api/auth';
import { FileInfo, Folder } from '@b3networks/api/file';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { format } from 'date-fns';
import * as moment from 'moment';
import { filter, Observable, take } from 'rxjs';
import { ROUTE_LINK } from '../../common/constants';

@Component({
  selector: 'b3n-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent extends DestroySubscriberComponent implements OnInit {
  toDay = new Date();
  isOwner: boolean;

  @Input() selectedItems: FileInfo[] | Folder[];
  @Input() date: Date;
  @Input() type: string;
  @Input() isFolder: boolean;
  @Input() isTrashBin: boolean;
  @Input() folders: Folder[];
  @Input() actionMapping$: Observable<ActionMapping>;
  @Output() changeDateMonth = new EventEmitter<Date>();
  @Output() download = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() viewTrashBin = new EventEmitter<boolean>();
  @Output() viewPendingJob = new EventEmitter<string>();
  @Output() restore = new EventEmitter();
  @Output() refresh = new EventEmitter<boolean>();
  @Output() shred = new EventEmitter();
  @Output() toggleFolder = new EventEmitter<boolean>();
  constructor(private profileQuery: IdentityProfileQuery, private profileService: IdentityProfileService) {
    super();
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe();
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.isOwner = org?.role === MemberRole.OWNER;
      });
  }

  onChangeMonth() {
    this.changeDateMonth.emit(this.date);
  }

  onChangeDate() {
    this.changeDateMonth.emit(this.date);
  }

  onPrev() {
    if (this.isFolder) {
      this.date = new Date(this.date.setMonth(this.date.getMonth() - 1));
    } else {
      this.date = new Date(this.date.setDate(this.date.getDate() - 1));
    }
    this.changeDateMonth.emit(this.date);
  }

  onNext() {
    if (this.isFolder) {
      this.date = new Date(this.date.setMonth(this.date.getMonth() + 1));
    } else {
      this.date = new Date(this.date.setDate(this.date.getDate() + 1));
    }
    this.changeDateMonth.emit(this.date);
  }

  onDownload() {
    this.download.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onRestore() {
    this.restore.emit();
  }

  onViewTrashBin() {
    this.isTrashBin = true;
    this.viewTrashBin.emit(this.isTrashBin);
  }

  onViewPendingJob() {
    this.viewPendingJob.emit(ROUTE_LINK.pending_jobs);
  }

  onRefresh() {
    this.refresh.emit(this.isTrashBin);
  }

  onShred() {
    this.shred.emit();
  }

  isAllChecked() {
    const numSelected = this.selectedItems?.length;
    const numFolders = this.folders?.length;
    return numSelected === numFolders;
  }

  toggleAllFolder() {
    this.toggleFolder.emit(this.isAllChecked());
  }

  isMaxDay(): boolean {
    return this.isFolder
      ? moment(format(new Date(this.date), 'yyyy-MM')).isSameOrAfter(format(new Date(this.toDay), 'yyyy-MM'))
      : moment(this.formatDate(this.date)).isSameOrAfter(this.formatDate(this.toDay));
  }

  private formatDate(date: Date | string): string {
    return format(new Date(date), 'yyyy-MM-dd');
  }
}
