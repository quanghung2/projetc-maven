export enum OrderBy {
  ASC = 'asc',
  DESC = 'desc'
}

export class SortUtils {
  public static sortBy(array: any[], key: string, orderBy: OrderBy) {
    if (array && orderBy) {
      array.sort(function (item1, item2) {
        if (item1[key] === undefined || item1[key] === null || item1[key] === '') {
          return 1;
        }
        if (item2[key] === undefined || item2[key] === null || item2[key] === '') {
          return -1;
        }
        if (item1[key] < item2[key]) {
          return -1;
        } else if (item1[key] > item2[key]) {
          return 1;
        } else {
          return 0;
        }
      });

      if (orderBy === OrderBy.DESC) {
        array = array.reverse();
      }
    }

    return array;
  }
}
