import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { USER_HEADER_LEFT_SECTION_ID } from '../shared/contants';
import { UpdateExtDialogData, UpdateExtensionComponent } from './top-bar/update-extension/update-extension.component';

@Component({
  selector: 'b3n-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent extends DestroySubscriberComponent implements OnInit {
  readonly USER_HEADER_LEFT_SECTION_ID = USER_HEADER_LEFT_SECTION_ID;
  selectedExtension$: Observable<ExtensionBase>;

  constructor(private extensionQuery: ExtensionQuery, private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.selectedExtension$ = this.extensionQuery.selectActive();
  }

  openUpdateExtensionDialog() {
    const extension = this.extensionQuery.getEntity(this.extensionQuery.getActiveId());
    this.dialog.open(UpdateExtensionComponent, {
      width: '400px',
      data: <UpdateExtDialogData>{
        extension: extension
      }
    });
  }
}
