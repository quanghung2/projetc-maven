import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IdentityProfileService } from '@b3networks/api/auth';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private profileService: IdentityProfileService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.profileService.getProfile().subscribe();
    this.registerSvgIcons();
  }

  private registerSvgIcons() {
    this.iconRegistry.addSvgIcon('lock', this.sanitizer.bypassSecurityTrustResourceUrl('assets/lock-folder.svg'));
  }
}
