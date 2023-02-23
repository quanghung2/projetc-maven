import { Injectable } from '@angular/core';
import { BlockRef, NodeEntry, Tree } from '@b3networks/api/ivr';
import * as _ from 'lodash';

@Injectable({ providedIn: 'root' })
export class TreeService {
  getRoot(tree: Tree): NodeEntry {
    return _.find(tree.nodes, (node: NodeEntry) => {
      return node.uuid === tree.firstBlockUuid;
    });
  }

  getParent(node: NodeEntry, tree: Tree): NodeEntry {
    return _.find(tree.nodes, (item: NodeEntry) => {
      const matchedRef: BlockRef = _.find(item.refs, (ref: BlockRef) => {
        return ref.nextBlockUuid === node.uuid;
      });

      return matchedRef != null && matchedRef !== undefined;
    });
  }

  getAllChildren(nodes: NodeEntry[], tree: Tree): NodeEntry[] {
    const result: NodeEntry[] = [];
    const children: NodeEntry[] = this.getMultipleDirectChildren(nodes, tree);
    if (children && children.length > 0) {
      result.push.apply(result, children);
      result.push.apply(result, this.getAllChildren(children, tree));
    }

    return result;
  }

  getMultipleDirectChildren(nodes: NodeEntry[], tree: Tree): NodeEntry[] {
    if (!nodes.length) {
      return [];
    }

    const result: NodeEntry[] = [];
    for (const parent of nodes) {
      const children = this.getDirectChildren(parent, tree);
      result.push.apply(result, children);
    }

    return result;
  }

  getDirectChildren(node: NodeEntry, tree: Tree): NodeEntry[] {
    if (!node) {
      return [];
    }

    const children = [];
    _.forEach(node.refs, (ref: BlockRef) => {
      const child = _.find(tree.nodes, (item: NodeEntry) => {
        return item.uuid === ref.nextBlockUuid;
      });

      if (child) {
        children.push(child);
      }
    });

    return children;
  }

  getNodesWithLevel(level: number, tree: Tree): NodeEntry[] {
    if (level === -1 || level == null) {
      return tree.nodes;
    }

    return _.filter(tree.nodes, (item: NodeEntry) => {
      return item.level <= level;
    });
  }

  getNodeMap(tree: Tree) {
    return _.keyBy(tree.nodes, (item: NodeEntry) => {
      return item.uuid;
    });
  }

  getRefsMap(node: NodeEntry) {
    return _.keyBy(node.refs, (item: BlockRef) => {
      return item.nextBlockUuid;
    });
  }

  getDeletedBlocks(newTree: Tree, oldTree: Tree): NodeEntry[] {
    return _.filter(oldTree.nodes, (oldItem: NodeEntry) => {
      const newNode = _.find(newTree.nodes, (newItem: NodeEntry) => {
        return newItem.uuid === oldItem.uuid;
      });

      return !newNode;
    });
  }
}
