import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { Project, ProjectQuery, ProjectService, SimpleAppFlowService } from '@b3networks/api/flow';
import { GetLicenseReq, License, LicenseService } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { CreateProjectDialogComponent } from '../landing/create-project-dialog/create-project-dialog.component';

export interface MenuDevHub {
  key: string;
  value: string;
  hidden?: boolean;
}

@Component({
  selector: 'b3n-devhub-sidebar',
  templateUrl: './devhub-sidebar.component.html',
  styleUrls: ['./devhub-sidebar.component.scss']
})
export class DevhubSidebarComponent extends DestroySubscriberComponent implements OnInit {
  menus: MenuDevHub[] = [
    { key: 'overview', value: 'Overview' },
    { key: 'api-keys', value: 'API Key', hidden: true },
    { key: 'ips-whitelist', value: 'IP Whitelist', hidden: true },
    { key: 'flow', value: 'Programmable Flow' },
    { key: 'form', value: 'Form' },
    { key: 'webhooks', value: 'Webhooks', hidden: true },
    { key: 'smpp', value: 'SMPP', hidden: true },
    { key: 'log', value: 'Log' }
  ];

  projectCtrl = new UntypedFormControl();
  projects: Project[] = [];
  allowCreateProject: boolean;

  get selectedProject() {
    return this.projectCtrl.value;
  }

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private simpleAppService: SimpleAppFlowService,
    private projectService: ProjectService,
    private licenseService: LicenseService,
    private projectQuery: ProjectQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.projectCtrl.valueChanges.subscribe(project => {
      if (project) {
        this.projectService.setActive(project.subscriptionUuid);
        this.simpleAppService.resetLog();
        this.router.navigate([project.uuid]);
      }
    });

    combineLatest([
      this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)),
      this.projectQuery.projects$.pipe(takeUntil(this.destroySubscriber$))
    ]).subscribe(([, prjs]) => {
      this.projects = prjs.filter(p => p.subscriptionUuid);

      const queryParams = this.route.snapshot.queryParams;
      if (queryParams['redirect']) {
        this.router.navigate([queryParams['redirect']]);
      } else {
        if (this.projects.length > 0) {
          const params = this.router.url.split('/');
          const prj = this.projects.find(p => p.uuid === params[1]);
          if (prj) {
            this.projectCtrl.setValue(prj, { emitEvent: false });
            this.projectService.setActive(prj.subscriptionUuid);
          } else {
            this.projectCtrl.setValue(this.projects[0]);
          }
        }
      }
    });

    const req = <GetLicenseReq>{
      skus: ['0f892a55-e254-4da3-ba7d-285098e4c98b'],
      identityUuid: null,
      resourceKey: null,
      includeMappings: true,
      includeResources: true,
      hasResource: null,
      hasUser: null,
      teamUuid: null
    };

    this.licenseService.getLicenses(req, new Pageable(0, 1000)).subscribe(page => {
      this.initMenu(page.content);
    });
  }

  createProject() {
    this.dialog
      .open(CreateProjectDialogComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((project: Project) => {
        if (project) {
          this.projectService.setActive(project.subscriptionUuid);
          this.projectCtrl.setValue(project);
        }
      });
  }

  private initMenu(licences: License[]) {
    combineLatest([
      this.projectQuery.selectActive().pipe(
        takeUntil(this.destroySubscriber$),
        filter(prjUuid => !!prjUuid)
      ),
      this.profileQuery
        .select(state => state.currentOrg)
        .pipe(
          takeUntil(this.destroySubscriber$),
          filter(profileOrg => !!profileOrg),
          take(1)
        )
    ]).subscribe(([project, profileOrg]) => {
      const indexApikey = this.menus.findIndex(p => p.key === 'api-keys');
      const indexIpwhitelist = this.menus.findIndex(p => p.key === 'ips-whitelist');
      const indexWebhooks = this.menus.findIndex(p => p.key === 'webhooks');
      const indexSmpp = this.menus.findIndex(p => p.key === 'smpp');

      if (profileOrg.isMember) {
        this.allowCreateProject = false;
        this.menus[indexApikey].hidden = true;
        this.menus[indexIpwhitelist].hidden = true;
        this.menus[indexWebhooks].hidden = true;
        this.menus[indexSmpp].hidden = true;
      } else {
        this.allowCreateProject = true;
        this.menus[indexApikey].hidden = false;
        this.menus[indexIpwhitelist].hidden = false;
        this.menus[indexWebhooks].hidden = false;
        const findIndex = licences.findIndex(l => l.subscriptionUuid === project?.subscriptionUuid);
        if (findIndex > -1 && licences[findIndex].isSMPP) {
          this.menus[indexSmpp].hidden = false;
        }
      }
    });
  }
}
