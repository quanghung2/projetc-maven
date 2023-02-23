import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IdentityProfileService } from '@b3networks/api/auth';
import { ActiveIframeService, SCMetaDataService, UserService } from '@b3networks/api/workspace';
import { APP_IDS, ChangedNavigateRouterData, EventMapName, MethodName, X } from '@b3networks/shared/common';
import { filter, map } from 'rxjs/operators';

interface MSG {
  action: 'logout' | 'switchOrg' | 'loaded' | 'close';
  status: 'success' | 'fail';
  fromOrg?: string;
  toOrg?: string;
}

declare let CrossPlatformMobile: any;
declare let Android: any;
declare let webkit: any;

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private profileService: IdentityProfileService,
    private userService: UserService,
    private scMetaDataService: SCMetaDataService,
    private activeIframeService: ActiveIframeService,
    private router: Router
  ) {
    this._handleRouter();
    this.activeIframeService.initListenEvent(APP_IDS.SUPPORT_CENTER);
  }

  ngOnInit(): void {
    this._fireMessage({
      action: 'loaded',
      status: 'success'
    });
    this.profileService.getProfile().subscribe();
    this.userService.getMe().subscribe();
    this.userService.fetchAllUsersV2().subscribe();
    this.scMetaDataService.getCaseMetadata().subscribe();
  }

  private _handleRouter() {
    X.registerListener(EventMapName.changedNavigateRouter, (data: { path: string }) => {
      if (data?.path) {
        let pathDecode = decodeURIComponent(data.path);
        if (pathDecode.includes(';')) {
          pathDecode = pathDecode.split(';')[0];
        }
        if (pathDecode.includes('?')) {
          pathDecode = pathDecode.split('?')[0];
        }
        this.router.navigate([pathDecode]);
      }
    });

    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        filter(x => this.activeIframeService.isMyIframe),
        map(e => e as NavigationEnd)
      )
      .subscribe(event => {
        let path = event.url;
        if (path.includes(';')) {
          path = path.split(';')[0];
        }
        if (path.includes('?')) {
          path = path.split('?')[0];
        }
        if (path.startsWith('/')) {
          path = path.substring(1);
        }

        //TODO need to verify later
        // const sid = path.split('/')[2];
        // const orgUuid = path.split('/')[1] || X.orgUuid;
        // if (Number(sid)) {
        //   this.caseService.getCase({ ownerOrgUuid: orgUuid, sid: +sid }).subscribe(cases => {
        //     X.fireMessageToParent(MethodName.UpdateTitle, <UpdateTitleData>{
        //       title: cases.title
        //     });
        //   });
        // }

        X.fireMessageToParent(MethodName.ChangedNavigateRouter, <ChangedNavigateRouterData>{
          path: path
        });
      });
  }

  private _fireMessage(msg: MSG) {
    // for IOS
    try {
      if (typeof webkit !== 'undefined' && webkit !== null) {
        webkit.messageHandlers.callbackHandler.postMessage(msg);
      }
    } catch (err) {
      //nothing
    }

    try {
      if (typeof CrossPlatformMobile !== 'undefined' && CrossPlatformMobile !== null) {
        CrossPlatformMobile.postMessage(JSON.stringify(msg));
      }
    } catch (err) {
      //nothing
    }

    // for android
    try {
      if (typeof Android !== 'undefined' && Android !== null) {
        Android.closeWebView(msg);
      }
    } catch (err) {
      //nothing
    }
  }
}
