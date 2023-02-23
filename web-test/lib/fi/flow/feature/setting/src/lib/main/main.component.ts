import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Connector } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  connectors: Connector[] = [];
  showConnector: boolean;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.showConnector = true;
  }

  tabChange(index: number) {
    switch (index) {
      case 0:
        this.showConnector = true;
        break;
    }
  }

  goToHome() {
    this.router.navigate(['../flow'], { relativeTo: this.route });
  }
}
