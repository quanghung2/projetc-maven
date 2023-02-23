import { Injectable } from '@angular/core';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import * as joint from 'jointjs';
import * as $ from 'jquery';
import * as _ from 'lodash';

@Injectable({ providedIn: 'root' })
export class GraphService {
  private graph;
  private paper;
  private cells: any = [];
  private links: any = [];
  private lastCells: any = [];
  private lastLinks: any = [];

  constructor() {
    this.graph = new joint.dia.Graph();
  }

  initGraph(paperId: string, width: number, height: number): joint.dia.Paper {
    this.paper = new joint.dia.Paper({
      el: $(`#${paperId}`),
      width: width,
      height: height,
      gridSize: 1,
      model: this.graph,
      perpendicularLinks: true,
      restrictTranslate: true,
      async: true
    });
    return this.paper;
  }

  clearGraph(clearAll: boolean) {
    this.cells = [];
    this.links = [];
    if (clearAll) {
      this.graph.clear();
      this.lastCells = [];
      this.lastLinks = [];
    }
  }

  addSVGBlock(blockId: string) {
    const cell = new joint.shapes.org.Member({
      size: { width: 145, height: 58 },
      attrs: {
        '.card': { fill: 'transparent', stroke: 'none' }
      },
      id: blockId
    });

    this.cells.push(cell);
    return cell;
  }

  addBlockConnectionLink(source, target, breakpoints?) {
    const linkColor = '#757575';

    const link = new joint.dia.Link({
      id: source.id + '=>' + target.id,
      source: { id: source.id },
      target: { id: target.id },
      vertices: breakpoints,
      router: { name: 'manhattan' },
      connector: { name: 'normal' },
      attrs: {
        '.connection': {
          stroke: linkColor,
          'stroke-width': 1
        },
        '.connection-wrap': {
          display: 'none'
        },
        '.link-tools': {
          display: 'none'
        },
        '.marker-target': {
          stroke: linkColor,
          fill: linkColor,
          d: 'M 8 0 L 0 4 L 8 8 z'
        }
      }
    });

    this.links.push(link);
    return link;
  }

  drawGraph() {
    const newCells: any[] = _.filter(this.cells, cell => {
      return !_.find(this.lastCells, (lastCell: any) => {
        return lastCell.id === cell.id;
      });
    });

    const newLinks: any[] = _.filter(this.links, link => {
      return !_.find(this.lastLinks, (lastLink: any) => {
        return lastLink.id === link.id;
      });
    });

    const deletedCells: any[] = _.filter(this.lastCells, lastCell => {
      return !_.find(this.cells, (cell: any) => {
        return cell.id === lastCell.id;
      });
    });

    const deletedLinks: any[] = _.filter(this.lastLinks, lastLink => {
      return !_.find(this.links, (link: any) => {
        return link.id === lastLink.id;
      });
    });

    this.validateInsertBetweenCase(newLinks, deletedLinks);

    /*** delete cells and connected links ***/
    _.forEach(deletedCells, cell => {
      try {
        const links = this.graph.getConnectedLinks(this.graph.getCell(cell.id), { inbound: true, outbound: false });
        _.forEach(links, link => {
          link.remove();
        });
        this.graph.getCell(cell.id).remove();
      } catch (err) {
        console.error(err);
        console.log(cell.id);
      }
    });

    this.graph.addCells(newCells.concat(newLinks));

    joint.layout.DirectedGraph.layout(this.graph, {
      dagre: dagre,
      graphlib: graphlib,
      nodeSep: 22,
      edgeSep: 22,
      rankSep: 50,
      rankDir: 'LR'
    });
    this.resizeContainer();

    /*** store last state ***/
    this.lastCells = this.cells;
    this.lastLinks = this.links;
  }

  private resizeContainer() {
    const positions: Position[] = [];

    const loop = setInterval(() => {
      if (this.paper != null) {
        const cells = this.paper.model.getCells();
        _.forEach(cells, cell => {
          if (!(cell instanceof joint.dia.Link)) {
            const position = this.getGraphElementPos(cell.id);
            positions.push(position);
          }
        });
        positions.forEach((item: Position) => {
          item.x = item.getX();
          item.y = item.getY();
        });

        const sortedX = _.sortBy(positions, 'x');
        const sortedY = _.sortBy(positions, 'y');

        const container_width: number = sortedX[sortedX.length - 1].x;
        const container_height: number = sortedY[sortedY.length - 1].y;

        const container = $('#flow-graph, #flow-graph-paper, #flow-graph-overlay');
        container.css('min-width', container_width + 2000);
        container.css('min-height', container_height + 1000);
        clearInterval(loop);
      } else {
        console.log('Waiting for graph to be inited');
      }
    }, 20);
  }

  getGraphElementById(input: string): any {
    let cell = null;
    if (this.paper != null && this.paper.model != null) {
      cell = this.paper.model.getCell(input);
    }
    if (cell) {
      return cell;
    }
    return this.cells.filter(c => {
      return c.id === input;
    })[0];
  }

  getGraphElementPos(id: string): Position {
    const x: number = this.getGraphElementById(id).get('position').x;
    const y: number = this.getGraphElementById(id).get('position').y;

    return new Position(`${x}px`, `${y}px`);
  }

  validateInsertBetweenCase(newLinks: any[], deletedLinks: any[]) {
    const duplicatedLinks = _.filter(deletedLinks, deletedLink => {
      const deletedArrowIndex = deletedLink.id.toString().indexOf('=>');
      return _.find(newLinks, newLink => {
        const newArrowIndex = newLink.id.toString().indexOf('=>');
        return (
          newLink.id.toString().substring(newArrowIndex + 2) ===
          deletedLink.id.toString().substring(deletedArrowIndex + 2)
        );
      });
    });

    _.forEach(duplicatedLinks, link => {
      const arrowIndex = link.id.toString().indexOf('=>');
      const cellId = link.id.toString().substring(arrowIndex + 2);

      const links = this.graph.getConnectedLinks(this.graph.getCell(cellId), { inbound: true, outbound: false });
      _.forEach(links, item => {
        item.remove();
      });
    });
  }
}

export class Position {
  constructor(public x: any = '0px', public y: any = '0px') {}

  public getX(): number {
    return Number(this.x.replace('px', ''));
  }

  public getY(): number {
    return Number(this.y.replace('px', ''));
  }
}
