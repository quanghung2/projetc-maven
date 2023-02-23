import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Flow';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(_ => {
      const params = this.route.snapshot.queryParams;
      if (params['redirect']) {
        this.router.navigate([params['redirect']]);
      }
    });
  }
}
