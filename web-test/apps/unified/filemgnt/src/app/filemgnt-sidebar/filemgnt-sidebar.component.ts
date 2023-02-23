import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { IAM_GROUP_UUIDS, IdentityProfileQuery, MeIamQuery } from '@b3networks/api/auth';
import { FileStore } from '@b3networks/api/file';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest, filter, takeUntil } from 'rxjs';
import { ROUTE_LINK } from '../common/constants';

export interface MenuFilemgnt {
  value: string;
  urlPath: ROUTE_LINK;
  order?: number;
}

@Component({
  selector: 'b3n-filemgnt-sidebar',
  templateUrl: './filemgnt-sidebar.component.html',
  styleUrls: ['./filemgnt-sidebar.component.scss']
})
export class FilemgntSidebarComponent extends DestroySubscriberComponent implements OnInit {
  menus: MenuFilemgnt[] = [
    { value: 'Call Recording', urlPath: ROUTE_LINK.call_recording, order: 0 }
    // Temporary hide { value: 'Voicemail', urlPath: ROUTE_LINK.voicemail, order: 1 }
  ];
  selectedFilemgntCtrl = new UntypedFormControl();
  hasPermissionGroup: boolean;

  constructor(
    private fileStore: FileStore,
    private meIamQuery: MeIamQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.selectedFilemgntCtrl.setValue(this.menus[0]);
    this.menus.sort(this._sortMenuFunc);
    combineLatest([this.profileQuery.currentOrg$, this.meIamQuery.selectGrantedGroup(IAM_GROUP_UUIDS.fileExplorer)])
      .pipe(
        filter(([org]) => !!org),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([org, hasPermissionGroup]) => {
        this.hasPermissionGroup = org.isOwner || (org.isAdmin && hasPermissionGroup);
      });
  }

  selectMenu(menu: MenuFilemgnt) {
    this.fileStore.updateStateFileExplorer({
      dateName: null,
      type: null,
      isTrashBin: false
    });
  }

  private _sortMenuFunc(a, b) {
    const ordering =
      a.order != null && b.order != null ? a.order - b.order : a.order != null ? -1 : b.order != null ? 1 : 0;
    return !ordering ? a.value.localeCompare(b.value) : ordering;
  }
}
