import React from 'react';
import { Image } from 'react-native';

export default function AppLogo({ size = 100 }) {
  return (
    <Image
      source={require('../App_logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
