import { EmojiList } from './emoji-list';

const EmojiMap = {};

EmojiList.forEach(emoji => {
  EmojiMap[emoji.name] = emoji;
});

export class EmojiItem {
  public name: string;
  public unicode: string;
  public shortname: string;
  public code_decimal: string;
  public category: string;
  public emoji_order: string;
}
export class Category {
  public type: string;
  public name: string;
  public icon: string;
}

export const CategoryList = [
  { type: 'p', name: 'people', icon: 'i-people' },
  { type: 'n', name: 'nature', icon: 'i-nature' },
  { type: 'd', name: 'food', icon: 'i-food' },
  { type: 's', name: 'symbols', icon: 'i-symbols' },
  { type: 'a', name: 'activity', icon: 'i-activity' },
  { type: 't', name: 'travel', icon: 'i-travel' },
  { type: 'o', name: 'objects', icon: 'i-objects' },
  { type: 'f', name: 'flags', icon: 'i-flags' },
  { type: 'c', name: 'custom', icon: 'i-custom' }
];

const EmojiCategoryMap = {};

CategoryList.forEach(cat => {
  EmojiCategoryMap[cat.name] = EmojiList.filter(emoji => emoji.category === cat.type);
});

export default { NameToEmoji: EmojiMap, EmojiCategoryMap };
