import { useEffect, useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useMotionReduced } from '@/contexts/motion-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A small, interruptible press response; keeps the original touch target and semantics. */
export function MotionPressable({
  style,
  children,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  ...props
}: PressableProps) {
  const reduced = useMotionReduced();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(pressed && !disabled && !reduced ? 0.975 : 1, {
      duration: reduced ? 0 : pressed ? 90 : 160,
    });
  }, [pressed, disabled, reduced, scale]);
  const motionStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[typeof style === 'function' ? style({ pressed, hovered }) : style, motionStyle]}
    >
      {typeof children === 'function' ? children({ pressed, hovered }) : children}
    </AnimatedPressable>
  );
}
