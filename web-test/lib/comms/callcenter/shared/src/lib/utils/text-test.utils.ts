export class TextTestUtils {
  public static checkIsContainsSpecialChars(s: string): boolean {
    const format = /[!@#$`%^&*"'_+=\[\]{}\\|<>\/]+/;
    return format.test(s);
  }

  public static checkIsContainsNonLatinCodepoints(s: string): boolean {
    return /[^\u0000-\u007f]/.test(s);
  }
}
