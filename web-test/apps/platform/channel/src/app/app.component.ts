import { Component, OnInit } from '@angular/core';
import { IdentityProfileService } from '@b3networks/api/auth';
import { ChannelService } from '@b3networks/api/store';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private channelService: ChannelService, private identityProfileService: IdentityProfileService) {}

  ngOnInit(): void {
    this.channelService.getChannels().subscribe();
    this.identityProfileService.getProfile().subscribe();
  }
}
