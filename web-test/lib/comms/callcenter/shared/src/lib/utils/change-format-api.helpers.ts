export class ChangeFormatApiHelper {
  public static toCamelCases(objArray: any[], varibleType: any) {
    const newObj = [];
    objArray.forEach(obj => {
      const newTnx = new varibleType();
      for (const key of Object.keys(obj)) {
        newTnx[this.getNewKey(key)] = obj[key];
      }
      newObj.push(newTnx);
    });
    return newObj;
  }

  public static getNewKey(origKey: string) {
    return this.removeSpace(origKey[0].toLocaleLowerCase() + origKey.slice(1));
  }

  public static removeSpace(str: string) {
    let newStr = '';
    str.split('').forEach(c => {
      if (c !== ' ') {
        newStr += c;
      }
    });
    return newStr;
  }
}
