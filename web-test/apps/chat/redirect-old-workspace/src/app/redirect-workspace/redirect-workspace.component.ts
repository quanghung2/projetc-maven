import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const APP_UNIFIED_WORKSPACE = 'UnifiedWorkspace';
const APP_WORKSPACE = 'Workspace';

@Component({
  selector: 'b3n-redirect-workspace',
  templateUrl: './redirect-workspace.component.html',
  styleUrls: ['./redirect-workspace.component.scss']
})
export class RedirectWorkspaceComponent implements OnInit {
  url = '';

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(data => {
      let url = '';
      if (data['type'] && data['id']) {
        if (data['type'] === 'team') {
          if (data['id'] === 'empty') {
            url = `${location.origin}/#/${APP_UNIFIED_WORKSPACE}`;
          } else {
            url = `${location.origin}/#/${APP_UNIFIED_WORKSPACE}/?id=${data['id']}`;
          }
        } else if (data['type'] === 'email') {
          url = `${location.origin}/#/${APP_WORKSPACE}/?id=${data['id']}&type=email`;
        } else if (data['type'] === 'customer') {
          url = `${location.origin}/#/${APP_WORKSPACE}/?id=${data['id']}&type=customer`;
        }
      } else {
        url = `${location.origin}/#/${APP_UNIFIED_WORKSPACE}`;
      }

      this.url = url;
      if (this.url) {
        this.handleRediectLink(this.url);
      }
    });
  }

  private handleRediectLink(url: string) {
    window.location.replace(url);
  }
}
