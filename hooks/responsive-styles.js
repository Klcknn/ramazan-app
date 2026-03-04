import { Dimensions, StyleSheet } from 'react-native';

export const BASE_REFERENCE = {
  width: 393,
  height: 851,
};

export const DEVICE_PROFILES = {
  SMALL_PHONE: 'small_phone',
  XIAOMI_REFERENCE: 'xiaomi_reference',
  TABLET: 'tablet',
  GENERIC_PHONE: 'generic_phone',
};

const SCALABLE_KEYS = new Set([
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'gap',
  'rowGap',
  'columnGap',
  'shadowRadius',
  'elevation',
]);

const LARGE_DIMENSION_KEYS = new Set(['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight']);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDeviceProfile = (width, height) => {
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= 600 || width >= 768;
  if (isTablet) return DEVICE_PROFILES.TABLET;

  const isXiaomiReferenceBand =
    width >= 380 &&
    width <= 430 &&
    height >= 760 &&
    height <= 930;

  if (isXiaomiReferenceBand) return DEVICE_PROFILES.XIAOMI_REFERENCE;
  if (width < 380) return DEVICE_PROFILES.SMALL_PHONE;
  return DEVICE_PROFILES.GENERIC_PHONE;
};

const getScale = (width, height, profile) => {
  const ratio = Math.min(width / BASE_REFERENCE.width, height / BASE_REFERENCE.height);

  if (profile === DEVICE_PROFILES.XIAOMI_REFERENCE) return 1;
  if (profile === DEVICE_PROFILES.SMALL_PHONE) return clamp(ratio, 0.86, 0.96);
  if (profile === DEVICE_PROFILES.TABLET) return clamp(ratio, 1, 1.12);
  return clamp(ratio, 0.94, 1.05);
};

const shouldSkipLargeDimension = (key, value) => LARGE_DIMENSION_KEYS.has(key) && value >= 500;

const scaleNumber = (key, value, scale) => {
  if (value === 0) return 0;
  if (shouldSkipLargeDimension(key, value)) return value;

  if (key === 'borderWidth' || key === 'borderTopWidth' || key === 'borderRightWidth' || key === 'borderBottomWidth' || key === 'borderLeftWidth') {
    return Number((value * scale).toFixed(2));
  }

  if (key === 'lineHeight') {
    return Math.max(1, Math.round(value * scale));
  }

  if (key === 'fontSize') {
    return Math.max(1, Math.round(value * scale));
  }

  return Math.round(value * scale);
};

const scaleValue = (value, scale) => {
  if (Array.isArray(value)) {
    return value.map((item) => scaleValue(item, scale));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const result = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (typeof nestedValue === 'number' && SCALABLE_KEYS.has(key)) {
      result[key] = scaleNumber(key, nestedValue, scale);
      return;
    }

    if (nestedValue && typeof nestedValue === 'object') {
      result[key] = scaleValue(nestedValue, scale);
      return;
    }

    result[key] = nestedValue;
  });

  return result;
};

export const createResponsiveStyles = (styles) => {
  const { width, height } = Dimensions.get('window');
  const profile = getDeviceProfile(width, height);
  const scale = getScale(width, height, profile);
  return StyleSheet.create(scaleValue(styles, scale));
};
