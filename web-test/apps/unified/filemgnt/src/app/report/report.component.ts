import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE_LINK } from '../common/constants';

@Component({
  selector: 'b3n-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  onBackPreviousPage() {
    this.router.navigateByUrl(`${ROUTE_LINK.file_explorer}`);
  }
}
