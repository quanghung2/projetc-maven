import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService, IdentityProfile, LoginSessionResponse, ProfileOrg } from '@b3networks/api/auth';
import { AnnouncementResp, AnnouncementService, PortalQuery, PortalService } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { SessionQuery } from '../service/session/session.query';
import { AppStateService } from '../state/app-state.service';
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
  colorPallet$: Observable<ColorPlallet>;

  loading: boolean;
  progressing: boolean;

  announcements$: Observable<AnnouncementResp[]>;

  constructor(
    private sessionQuery: SessionQuery,
    private authenticationService: AuthenticationService,
    private portalQuery: PortalQuery,
    private portalService: PortalService,
    private toastService: ToastService,
    private appStateService: AppStateService,
    private dialog: MatDialog,
    private announcementService: AnnouncementService
  ) {
    super();
  }

  ngOnInit() {
    console.log('init landing page component');

    this.announcements$ = this.announcementService.getAnnouncements();
    this.data$ = combineLatest([
      this.sessionQuery.profile$,
      this.sessionQuery.currentOrg$.pipe(
        filter(org => org != null),
        tap(org => this.handleOrgChanged(org))
      )
    ]).pipe(
      filter(([profile, org]) => profile != null && org != null),
      switchMap(([profile, currentOrg]) =>
        forkJoin([of(profile), of(currentOrg), this.authenticationService.getLoginSession(true)])
      ),
      map(([profile, currentOrg, session]) => {
        return <LandingData>{
          profile: profile,
          currentOrg: currentOrg,
          session: session
        };
      })
    );
    this.appStateService.toggleAppLoading(false); // for when switching org
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
}
