import { Component, OnInit } from '@angular/core';
import { IdentityProfileService } from '@b3networks/api/auth';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title: string;

  constructor(private profileService: IdentityProfileService) {}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe();
  }
}
