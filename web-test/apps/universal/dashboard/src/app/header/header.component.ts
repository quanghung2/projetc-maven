import { KeyValue } from '@angular/common';
import { Component } from '@angular/core';
import { APP_ROUTING_LINK } from '../shared/constants';

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  readonly links: KeyValue<string, string>[] = [
    // { key: APP_ROUTING_LINK.dashboard, value: 'Dashboards' }
    // { key: APP_ROUTING_LINK.question, value: 'Questions' }
  ];

  readonly APP_ROUTING_LINK = APP_ROUTING_LINK;

  activeLink: KeyValue<string, string> = this.links[0];
}
