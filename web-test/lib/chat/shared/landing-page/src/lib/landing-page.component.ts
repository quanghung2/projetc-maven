import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfile, IdentityProfileQuery, LoginSessionResponse, ProfileOrg } from '@b3networks/api/auth';
import { AnnouncementResp, AnnouncementService, PortalQuery, PortalService } from '@b3networks/api/portal';
import { MeQuery, User } from '@b3networks/api/workspace';
import { AppService, SidebarTabs } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, finalize, map, tap } from 'rxjs/operators';
import { StoreAnnouncementComponent } from './store-announcement/store-announcement.component';

interface LandingData {
  profile: IdentityProfile;
  currentOrg: ProfileOrg;

  session: LoginSessionResponse;
}
interface ColorPlallet {
  bgColor: string;
  fontColor: string;
}

@Component({
  selector: 'b3n-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent extends DestroySubscriberComponent implements OnInit {
  readonly bgColors = [
    '#ffffff',
    '#0079bf',
    '#d29034',
    '#519839',
    '#b04632',
    '#89609e',
    '#cd5a91',
    '#4bbf6b',
    '#00aecc',
    '#838c91'
  ];
  readonly darkBgColor = ['#0079bf', '#b04632', '#89609e'];

  data$: Observable<LandingData>;
  me$: Observable<User>;
  currentOrg$: Observable<ProfileOrg>;
  colorPallet$: Observable<ColorPlallet>;

  loading: boolean;
  progressing: boolean;

  announcements$: Observable<AnnouncementResp[]>;

  constructor(
    private portalQuery: PortalQuery,
    private portalService: PortalService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private announcementService: AnnouncementService,
    private appService: AppService,
    private identityProfileQuery: IdentityProfileQuery,
    private meQuery: MeQuery
  ) {
    super();
    this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
  }

  ngOnInit() {
    console.log('init landing page component');

    this.announcements$ = this.announcementService.getAnnouncements();
    this.currentOrg$ = this.identityProfileQuery.currentOrg$.pipe(
      filter(x => x != null),
      distinctUntilKeyChanged('orgUuid'),
      tap(org => this.handleOrgChanged(org))
    );
    this.me$ = this.meQuery.me$;
  }

  createAnnouncement() {
    this.dialog
      .open(StoreAnnouncementComponent, {
        width: '500px'
      })
      .afterClosed()
      .subscribe(respStatus => {
        if (respStatus && respStatus.ok) {
          this.announcements$ = this.announcementService.getAnnouncements();
        }
      });
  }

  editAnnouncement(ann: AnnouncementResp) {
    this.dialog
      .open(StoreAnnouncementComponent, {
        width: '500px',
        autoFocus: false,
        data: ann
      })
      .afterClosed()
      .subscribe(respStatus => {
        if (respStatus && respStatus.ok) {
          this.announcements$ = this.announcementService.getAnnouncements();
        }
      });
  }

  copy() {
    this.toastService.success('Copied to clipboard');
  }

  changeSidebarBackgroundColor(bg: string) {
    this.progressing = true;
    this.portalService
      .updateOrgHomeBackground(bg)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Changed background color.');
        },
        error => {
          this.toastService.error(error.message || 'Cannot change sidebar background color. Please try again later.');
        }
      );
  }

  private handleOrgChanged(org: ProfileOrg) {
    this.announcements$ = this.announcementService.getAnnouncements();

    this.colorPallet$ = this.portalQuery.orgBackground$.pipe(
      map(bgColor => <ColorPlallet>{ bgColor: bgColor, fontColor: this.generalFontColor(bgColor) })
    );
  }

  private generalFontColor(bgColor: string) {
    switch (bgColor) {
      case '#0079bf': {
        return '#fafdff';
      }
      case '#d29034': {
        return '#2e1f0a';
      }
      case '#519839': {
        return '#12210d';
      }
      case '#b04632': {
        return '#f6f4f3';
      }
      case '#89609e': {
        return '#faf9fb';
      }
      case '#cd5a91': {
        return '#32061c';
      }
      case '#4bbf6b': {
        return '#0f2916';
      }
      case '#00aecc': {
        return '#003038';
      }
      case '#838c91': {
        return '#0b222d';
      }
      default: {
        return '#616161';
      }
    }
  }
}
