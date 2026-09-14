import Svg, { Circle, ClipPath, Defs } from 'react-native-svg';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={(65 * size) / 41} height={size} viewBox="0 0 65 41">
      <Defs>
        <ClipPath id="logo-overlap">
          <Circle cx="20.1509" cy="20.27" r="20" />
        </ClipPath>
      </Defs>
      <Circle cx="20.1509" cy="20.27" r="20" fill="#87D6B9" />
      <Circle cx="43.1509" cy="20.27" r="20" fill="#39A883" />
      <Circle cx="43.1509" cy="20.27" r="20" fill="#397D63" clipPath="url(#logo-overlap)" />
    </Svg>
  );
}
