export class RegExpPattern {
  static MENTION = /(<[@][\w~_-]+>)/gm;
  static CHANNEL = /(<[#][\w~_-]+>)/gm;
  static CODE = /(`{3})([^`]|[^`][\s\S]*?[^`])\1(?!`)/gm; // ex: ```code```
  static CODE_SINGLE = /(`{1})([^`\s]|[^`\s][\s\S]*?[^`])\1(?!`)/gm; // ex: `code`
  static URL = /\w+:(\/\/)[^\s]+/gi;
  static URL1 =
    /((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<`]*|^[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/gm; // link not special charater
  // static HIGHLIGHT_LINK: RegExp = /(^(\[[\s\S]+?\]){1}(\(?)(\w+:(\/\/)[^\s]+)\)$)/gm;
  // static HIGHLIGHT_LINK: RegExp = /((\[[\s\S]+?\]){1}((\(){1}(((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<\(\)]*|^[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_]))(\)){1})){1}/gm;
  static HIGHLIGHT_LINK = /((^|)\[[\s\S]+?\])(\([^\s]*\))/gm; // [abc xyz](https://google.com)
  static YOUTUBE =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  static EMAIL =
    /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
  static EMOJI = /([:][\w_+-]+)[:]/gm;
  // deprecated
  static ALLOWED_CHARS = /^[a-zA-Z0-9_+-]*$/;
  static ALLOWED_CHARS_HAS_SPACE = /^[a-zA-Z0-9_+-/ ]*$/;
  static MARK_QUOTE = /`{3}((?!`{3}\s).|\n)*`{3}/gm;
  // static MARK_SINGLE_QUOTE: RegExp = /(^|\s)`{1}[^\s]((?!`{1}\s).|\n)*?`{1}/gm;
  static MARK_SINGLE_QUOTE = /`{1}[^\s]((?!`{1}\s).|\n)*?`{1}/gm;
  static MARK_BOLD = /\*{1}[^\s]((?!\*{1}\s).|\n)*?\*{1}/gm;
  static MARK_ITALIC = /_{1}[^\s]((?!_{1}\s).|\n)*?_{1}/gm;
  static MARK_STRIKE = /~{1}[^\s]((?!~{1}\s).|\n)*?~{1}/gm;
}
