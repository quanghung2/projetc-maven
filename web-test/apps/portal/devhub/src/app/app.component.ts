import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityProfileService } from '@b3networks/api/auth';
import { ProjectService } from '@b3networks/api/flow';
import { FeatureService } from '@b3networks/api/license';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private projectService: ProjectService,
    private featureService: FeatureService,
    private profileService: IdentityProfileService
  ) {}

  ngOnInit(): void {
    this.featureService.get().subscribe();
    this.profileService.getProfile().subscribe();
    this.projectService.getProjects().subscribe(projects => {
      const hasProjectWithSubscription = projects?.find(p => p.subscriptionUuid);
      if (!hasProjectWithSubscription) {
        this.router.navigate(['landing']);
      }
    });
  }
}
