// Category definitions with icons and emoji
export const CATEGORY_ICONS = {
  '餐飲': '🍜',
  '交通': '🚗',
  '娛樂': '🎮',
  '購物': '🛍️',
  '薪水': '💰',
  '生活': '🏠',
  '投資': '📈',
  '醫療': '💊',
  '旅遊': '✈️',
  '教育': '📚',
  '運動': '🏋️',
  '水電': '💡',
};

// Popular emoji icons for custom category creation
export const POPULAR_ICONS = [
  '🍜', '🍲', '☕', '🧋', '🍕', '🍔', '🍰', '🍱', '🥩', '🍎', '🍻', '🍞',
  '🚗', '🛵', '🚌', '🚇', '🚄', '✈️', '⛽', '🚲', '🚖', '🎫', '🚢',
  '🏠', '💡', '🛒', '🛍️', '📦', '🛋️', '📱', '💻', '📶', '🔑', '🚰', '🧼',
  '🎮', '🎬', '🎤', '🎧', '📚', '🎨', '⚽', '🏋️', '🏊', '🏕️', '🎟️', '🎯',
  '💊', '🏥', '🩺', '🩹', '🦷', '💇', '🧴', '💆',
  '🐱', '🐶', '🐾', '🪴', '👶', '🎁', '💐', '💍',
  '💰', '💳', '💵', '🪙', '📈', '💼', '🧾', '🧧', '🏷️', '📌'
];

export const getCategoryIcon = (category, customIcons = {}) => {
  if (customIcons && customIcons[category]) {
    return customIcons[category];
  }
  return CATEGORY_ICONS[category] || '📌';
};

export const DEFAULT_CATEGORIES = Object.keys(CATEGORY_ICONS);

