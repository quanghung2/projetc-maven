interface ExpiryItem {
  value: any;
  expiry: number;
}

export class LocalStorageUtil {
  static setItem(key: string, value: any, ttl?: number) {
    const now = new Date();

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = <ExpiryItem>{
      value: value
    };
    if (ttl) {
      item.expiry = now.getTime() + ttl;
    }
    localStorage.setItem(key, JSON.stringify(item));
  }

  static getItem(key: string) {
    const itemStr = localStorage.getItem(key);

    // if the item doesn't exist, return null
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr) as ExpiryItem;
    if (item.expiry) {
      const now = new Date();

      // compare the expiry time of the item with the current time
      if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key);
        return null;
      }
    }

    return item.value;
  }

  static removeItem(key: string) {
    localStorage.removeItem(key);
  }
}
