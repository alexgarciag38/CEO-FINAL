import tinycolor from 'tinycolor2';

export const adjustColorForSubentity = (baseColorHex: string, index: number): string => {
  if (!baseColorHex || !tinycolor(baseColorHex).isValid()) {
    return '#9CA3AF';
  }
  const adjustedColor = tinycolor(baseColorHex)
    .darken(5 + (index * 3))
    .saturate(10);
  return adjustedColor.toHexString();
};

export const isValidHexColor = (hex?: string | null): boolean => {
  if (!hex) return false;
  return tinycolor(hex).isValid();
};


