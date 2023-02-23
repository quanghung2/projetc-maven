export class StringUtils {
  static isBlank(str: string): boolean {
    return (
      str == null ||
      typeof str !== 'string' ||
      (str.trim && str.trim().length === 0) ||
      (!str.trim && str.replace(/^\s+|\s+$/gi, '').length === 0)
    );
  }

  static isNotBlank(str: string): boolean {
    return !this.isBlank(str);
  }

  static encodeHtml(str: string): string {
    return str == null
      ? null
      : str
          .replace(/&/gi, '&amp;')
          .replace(/</gi, '&lt;')
          .replace(/>/gi, '&gt;')
          .replace(/\"/gi, '&quot;')
          .replace(/'/gi, '&#39;')
          .replace(/\n/gi, '<br/>');
  }

  static decodeHtml(str: string): string {
    return str == null
      ? null
      : str
          .replace(/<br\/*>/gi, '\n')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&amp;/gi, '&')
          .replace(/&#39;/gi, "'");
  }
}
