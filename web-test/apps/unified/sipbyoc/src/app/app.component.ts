import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileService, MeIamService } from '@b3networks/api/auth';
import { ExtensionService, SipAccount, SipTrunkQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { EditTagComponent, EditTagInput } from './header/edit-tag/edit-tag.component';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  title: string;
  sip$: Observable<SipAccount>;

  constructor(
    private profileService: IdentityProfileService,
    private meIamService: MeIamService,
    private sipTrunkQuery: SipTrunkQuery,
    private dialog: MatDialog,
    private extensionService: ExtensionService
  ) {
    super();
  }

  ngOnInit(): void {
    forkJoin([this.profileService.getProfile(), this.meIamService.get()]).subscribe();

    this.sip$ = this.sipTrunkQuery.selectActive();
    this.extensionService.getAllExtenison().subscribe();
  }

  editTag(sip: SipAccount) {
    this.dialog.open(EditTagComponent, {
      data: <EditTagInput>{
        sip: sip
      },
      width: '400px',
      disableClose: true
    });
  }
}
