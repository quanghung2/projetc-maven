import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Team } from '@b3networks/api/auth';
import { DirectoryMember } from '@b3networks/api/directory';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { GoogleCharts } from 'google-charts';
import { InfoMemberComponent } from './info-member/info-member.component';

export interface OrgChartData extends Team {
  membersDirectory: DirectoryMember[];
}

@Component({
  selector: 'b3n-org-chart',
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.scss']
})
export class OrgChartComponent extends DestroySubscriberComponent implements AfterViewInit, OnChanges {
  @Input() teamsData: OrgChartData[];
  @Input() isLoading: boolean;
  @ViewChild('chartRef') chartRef: ElementRef<HTMLElement>;
  @ViewChild('containerRef') containerRef: ElementRef<HTMLElement>;

  chartDataRows = [];
  isMouseMove = false;
  scale = 0.5;
  maxScale = 1.5;
  minScale = 0.5;
  pointX = 0;
  pointY = 0;
  start = { x: 0, y: 0 };
  isZoomIn = false;
  isZoomOut = false;
  isMoveActive = true;

  constructor(private dialog: MatDialog) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['teamsData'].currentValue.length) return;
    const chartWrapper: HTMLElement = document.getElementById('charts');
    this.teamsData.forEach((team, index) => {
      const chartElm: HTMLDivElement = document.createElement('div');
      chartElm.id = `${team.name}-${team.uuid}`;
      chartWrapper.appendChild(chartElm);

      const rows = [
        [
          {
            v: team.name,
            f: `<div class="group-name">${team.name}</div>`
          },
          '',
          team.uuid,
          true
        ],
        ...team.membersDirectory.map((data: DirectoryMember) => {
          const { name, memberUuid, photoUrl, email, extensionKey, teamRole } = data;
          return [
            {
              v: name,
              f: `<div class="card">
                  ${
                    photoUrl
                      ? `<img src="${photoUrl}" alt="avatar"/>`
                      : `<img src="assets/icons/user.svg" alt="avatar" class="filter"/>`
                  }
                  <div class="card__info">
                    <div class="name">${name}</div>
                    <div class="ext">Ext ${extensionKey ? `${extensionKey}` : '<i>NA</i>'}</div>
                    <div class="email">${email ? email : '<i>NA</i>'}</div>
                    <div class="badges ${teamRole ? teamRole.toLocaleLowerCase() : 'empty'}">${
                teamRole ? teamRole : '<i>NA</i>'
              }</div>
                  </div>
                </div>`
            },
            team.name,
            memberUuid ? memberUuid : '',
            false
          ];
        })
      ];

      this.chartDataRows.push(...rows);

      GoogleCharts.load(
        () => {
          const chart = new GoogleCharts.api.visualization.OrgChart(document.getElementById(chartElm.id));
          this.drawChart(chart, rows);
          if (index === this.teamsData.length - 1) this.setChartToCenter();
        },
        {
          packages: ['orgchart']
        }
      );
    });
  }

  ngAfterViewInit(): void {
    this.setChartToCenter();
  }

  setChartToCenter(): void {
    setTimeout(() => {
      const containerElm = this.containerRef?.nativeElement as { clientWidth: number; clientHeight: number };
      const chartElm = this.chartRef?.nativeElement as { clientWidth: number; clientHeight: number };
      this.pointX = (containerElm.clientWidth - chartElm.clientWidth * this.scale) / 2;
      this.pointY = (containerElm.clientHeight - chartElm.clientHeight * this.scale) / 2;
    });
  }

  onZoom(event: MouseEvent) {
    if (!this.isZoomIn && !this.isZoomOut) return;
    const distance = 0.25;
    const xScale = (event.clientX - this.pointX) / this.scale;
    const yScale = (event.clientY - this.pointY) / this.scale;
    if (this.isZoomIn) {
      const scaleTemp = this.scale + distance;
      this.scale = scaleTemp <= this.maxScale ? scaleTemp : this.maxScale;
    }
    if (this.isZoomOut) {
      const scaleTemp = this.scale - distance;
      this.scale = scaleTemp >= this.minScale ? scaleTemp : this.minScale;
    }
    this.pointX = event.clientX - xScale * this.scale;
    this.pointY = event.clientY - yScale * this.scale;
  }

  onWheel(event: WheelEvent) {
    if (this.isZoomIn || this.isZoomOut) return;
    const percentOfDelta = 1.2;
    const xScale = (event.clientX - this.pointX) / this.scale;
    const yScale = (event.clientY - this.pointY) / this.scale;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delta = (event as any).wheelDelta ? (event as any).wheelDelta : -event.deltaY;
    if (delta > 0) {
      const scaleTemp: number = this.scale * percentOfDelta;
      this.scale = scaleTemp > this.maxScale ? this.maxScale : scaleTemp;
    } else {
      const scaleTemp: number = this.scale / percentOfDelta;
      this.scale = scaleTemp < this.minScale ? this.minScale : scaleTemp;
    }
    this.pointX = event.clientX - xScale * this.scale;
    this.pointY = event.clientY - yScale * this.scale;
  }

  onMoveStart(event: MouseEvent) {
    if (this.isMoveActive) {
      this.isMouseMove = true;
      this.start = { x: event.clientX - this.pointX, y: event.clientY - this.pointY };
    }
  }

  onMove(event: MouseEvent) {
    if (this.isMouseMove && this.isMoveActive) {
      this.pointX = event.clientX - this.start.x;
      this.pointY = event.clientY - this.start.y;
    }
  }

  onMoveEnd() {
    this.isMouseMove = false;
  }

  getStyleCursor() {
    if (this.isMoveActive) return this.isMouseMove ? 'grabbing' : 'grab';
    return this.isZoomIn ? 'zoom-in' : 'zoom-out';
  }

  openDialogInfoMember(member: DirectoryMember) {
    this.dialog
      .open(InfoMemberComponent, {
        data: { member }
      })
      .afterClosed()
      .subscribe(() => {
        this.onMoveEnd();
      });
  }

  drawChart(chart, chartDataRows) {
    const chartData = new GoogleCharts.api.visualization.DataTable();
    chartData.addColumn('string', 'Name');
    chartData.addColumn('string', 'Manager');
    chartData.addColumn('string', 'ID');
    chartData.addColumn('boolean', 'IsGroup');
    chartData.addRows(chartDataRows);

    GoogleCharts.api.visualization.events.addListener(chart, 'select', () => {
      const selection = chart.getSelection();
      if (selection.length && !chartData.getValue(selection[0].row, 3)) {
        const teamSelected = this.teamsData.find(team => team.name === chartData.getValue(selection[0].row, 1));
        const memberSelected: DirectoryMember = teamSelected.membersDirectory.find(
          (member: DirectoryMember) => member.memberUuid === chartData.getValue(selection[0].row, 2)
        );
        this.openDialogInfoMember(memberSelected);
      }
    });

    chart.draw(chartData, {
      allowHtml: true,
      nodeClass: 'node-item',
      selectedNodeClass: 'node-item-selected'
    });
  }
}
