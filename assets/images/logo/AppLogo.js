import React from 'react';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export default function AppLogo({ size = 100 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        {/* Yeşil Gradient */}
        <LinearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        
        {/*
          <Stop offset="0%" stopColor="#2E7D32" stopOpacity="1" />
          <Stop offset="100%" stopColor="#1B5E20" stopOpacity="1" /> 
        */}
          <Stop offset="0%" stopColor="#00897B" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00695C" stopOpacity="1" />
          
        {/*<Stop offset="0%" stopColor="#689F38" stopOpacity="1" />
          <Stop offset="100%" stopColor="#558B2F" stopOpacity="1" /> 
        */}
        </LinearGradient>
      </Defs>

      {/* Dış Çember - Beyaz */}
      <Circle 
        cx="100" 
        cy="100" 
        r="90" 
        stroke="#FFFFFF" 
        strokeWidth="4" 
        fill="none"
      />

      {/* İç Çember - Açık Yeşil */}
      <Circle 
        cx="100" 
        cy="100" 
        r="85" 
        stroke="#81C784" 
        strokeWidth="1.5" 
        fill="none"
        opacity="0.5"
      />

      {/* Ana Cami Yapısı */}
      <G transform="translate(100, 100)">
        
        {/* Merkez Kubbe */}
        <Path
          d="M -30 -10 Q -30 -35 0 -40 Q 30 -35 30 -10 L 25 -5 L -25 -5 Z"
          fill="url(#greenGradient)"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        
        {/* Kubbe İç Detay */}
        <Path
          d="M -25 -10 Q -25 -30 0 -35 Q 25 -30 25 -10"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />

        {/* Hilal */}
        <G transform="translate(0, -40)">
          <Path
            d="M -5 -8 Q -3 -12 0 -13 Q 3 -12 5 -8"
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="none"
          />
          <Circle cx="6" cy="-11" r="3.5" fill="#FFFFFF" />
        </G>

        {/* Sol Minare */}
        <G transform="translate(-45, 0)">
          {/* Minare Gövdesi */}
          <Path
            d="M -5 -5 L -5 35 L 5 35 L 5 -5 Z"
            fill="url(#greenGradient)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          
          {/* Minare Balkonu */}
          <Path
            d="M -7 0 L -7 5 L 7 5 L 7 0 Z"
            fill="#FFFFFF"
          />
          <Path
            d="M -7 10 L -7 15 L 7 15 L 7 10 Z"
            fill="#FFFFFF"
            opacity="0.7"
          />
          
          {/* Minare Külahı */}
          <Path
            d="M -8 -5 L 0 -20 L 8 -5 Z"
            fill="url(#greenGradient)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          
          {/* Minare Tepesi */}
          <Line x1="0" y1="-20" x2="0" y2="-25" stroke="#FFFFFF" strokeWidth="2" />
          <Circle cx="0" cy="-27" r="2" fill="#FFFFFF" />
        </G>

        {/* Sağ Minare (Sol Minarenin Aynısı) */}
        <G transform="translate(45, 0)">
          <Path
            d="M -5 -5 L -5 35 L 5 35 L 5 -5 Z"
            fill="url(#greenGradient)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          
          <Path
            d="M -7 0 L -7 5 L 7 5 L 7 0 Z"
            fill="#FFFFFF"
          />
          <Path
            d="M -7 10 L -7 15 L 7 15 L 7 10 Z"
            fill="#FFFFFF"
            opacity="0.7"
          />
          
          <Path
            d="M -8 -5 L 0 -20 L 8 -5 Z"
            fill="url(#greenGradient)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          
          <Line x1="0" y1="-20" x2="0" y2="-25" stroke="#FFFFFF" strokeWidth="2" />
          <Circle cx="0" cy="-27" r="2" fill="#FFFFFF" />
        </G>

        {/* Ana Kapı - Sivri Kemer */}
        <Path
          d="M -15 35 L -15 10 Q -15 0 0 -5 Q 15 0 15 10 L 15 35 Z"
          fill="url(#greenGradient)"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        {/* Kapı İç Detay */}
        <Path
          d="M -12 35 L -12 12 Q -12 4 0 0 Q 12 4 12 12 L 12 35"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Kapı Ortası Çizgi */}
        <Line x1="0" y1="0" x2="0" y2="35" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />

        {/* Cami Gövdesi Yan Duvarlar */}
        <Path
          d="M -25 -5 L -25 35 L -15 35 L -15 10 Q -15 0 -20 -5 Z"
          fill="url(#greenGradient)"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        
        <Path
          d="M 25 -5 L 25 35 L 15 35 L 15 10 Q 15 0 20 -5 Z"
          fill="url(#greenGradient)"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />

        {/* Pencereler */}
        <G opacity="0.8">
          {/* Sol Pencere */}
          <Path
            d="M -21 15 L -21 10 Q -21 8 -20 8 Q -19 8 -19 10 L -19 15"
            fill="#FFFFFF"
          />
          
          {/* Sağ Pencere */}
          <Path
            d="M 21 15 L 21 10 Q 21 8 20 8 Q 19 8 19 10 L 19 15"
            fill="#FFFFFF"
          />
        </G>

      </G>

      {/* Dekoratif Yıldızlar */}
      <G opacity="0.6">
        <Circle cx="40" cy="60" r="2" fill="#FFFFFF" />
        <Circle cx="160" cy="60" r="2" fill="#FFFFFF" />
        <Circle cx="50" cy="140" r="1.5" fill="#81C784" />
        <Circle cx="150" cy="140" r="1.5" fill="#81C784" />
      </G>

    </Svg>
  );
}