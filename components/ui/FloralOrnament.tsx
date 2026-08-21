import Svg, { Circle, G, Path } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/theme';

/**
 * Decorative line-art botanical sprig — hand-drawn-style stem, leaves and small
 * blossoms. Purely ornamental (accessibilityElementsHidden), meant to sit as a
 * quiet watermark in a hero corner or beside an empty state, never as content.
 */

type FloralOrnamentProps = {
  size?: number;
  /** Stem + leaf line color. */
  lineColor?: string;
  /** Blossom petal color. */
  bloomColor?: string;
  opacity?: number;
  flip?: boolean;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
};

const PETAL_ANGLES = [0, 72, 144, 216, 288];

function Blossom({ cx, cy, r, bloomColor }: { cx: number; cy: number; r: number; bloomColor: string }) {
  const petalTip = r * 1.6;
  return (
    <G transform={`translate(${cx}, ${cy})`} opacity={0.9}>
      {PETAL_ANGLES.map((angle) => (
        <Path
          key={angle}
          transform={`rotate(${angle})`}
          d={`M0,0 C ${-r * 0.6},${-r * 0.6} ${-r * 0.6},${-petalTip * 0.9} 0,${-petalTip} C ${r * 0.6},${-petalTip * 0.9} ${r * 0.6},${-r * 0.6} 0,0 Z`}
          fill={bloomColor}
        />
      ))}
      <Circle r={r * 0.4} fill={colors.gold} />
    </G>
  );
}

function Leaf({
  x,
  y,
  angle,
  scale,
  lineColor,
}: {
  x: number;
  y: number;
  angle: number;
  scale: number;
  lineColor: string;
}) {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle}) scale(${scale})`}>
      <Path
        d="M0,0 C -7,-7 -7,-18 0,-24 C 7,-18 7,-7 0,0 Z"
        fill={lineColor}
        opacity={0.16}
        stroke={lineColor}
        strokeWidth={1.2}
      />
      <Path d="M0,-1 L0,-21" stroke={lineColor} strokeWidth={1} opacity={0.5} />
    </G>
  );
}

export function FloralOrnament({
  size = 96,
  lineColor = colors.sage,
  bloomColor = colors.gold,
  opacity = 1,
  flip = false,
  rotate = 0,
  style,
}: FloralOrnamentProps) {
  const transform = [flip ? 'scale(-1,1) translate(-120,0)' : '', rotate ? `rotate(${rotate}, 60, 60)` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={style}
      opacity={opacity}
      pointerEvents="none"
    >
      <G transform={transform || undefined}>
        <Path
          d="M14,112 C26,90 18,72 38,58 C54,47 56,30 48,8"
          fill="none"
          stroke={lineColor}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.55}
        />
        <Leaf x={26} y={86} angle={-40} scale={0.9} lineColor={lineColor} />
        <Leaf x={40} y={62} angle={35} scale={1} lineColor={lineColor} />
        <Leaf x={46} y={34} angle={-25} scale={0.75} lineColor={lineColor} />
        <Blossom cx={49} cy={7} r={7} bloomColor={bloomColor} />
        <Blossom cx={18} cy={110} r={5} bloomColor={bloomColor} />
      </G>
    </Svg>
  );
}
