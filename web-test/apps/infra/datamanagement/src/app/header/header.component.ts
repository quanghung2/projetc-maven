import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  links: KeyValue<string, string>[] = [];
  activeLink: KeyValue<string, string>;

  constructor(private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.links = [];
    this.links = [
      { key: 'source', value: 'Report Source' },
      { key: 'template', value: 'Report Template' },
      { key: 'access', value: 'Report Access' }
    ];
    this.browseTo(this.links[0]);

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const matches = this.links.map(l => l.key);

      const evt = <NavigationEnd>e;
      for (const match of matches) {
        if (evt.url.indexOf(match) > -1) {
          this.activeLink = this.links.find(l => l.key === match);
        }
      }
    });
  }

  browseTo(l: KeyValue<string, string>) {
    this.activeLink = l;
    this.router.navigate([l.key]);
  }
}
