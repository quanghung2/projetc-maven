import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'pba-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(_ => {
      if (!this.activatedRoute.firstChild) {
        const params = this.activatedRoute.snapshot.params;
        if (params['token'] && params['context'] && params['email']) {
          this.router.navigate(['auth', 'verifyemail'], { queryParamsHandling: 'merge' });
        } else {
          this.router.navigate(['auth', 'login'], { queryParamsHandling: 'merge' });
        }
      }
    });
  }

  ngOnInit(): void {}
}
