import { useMotionReduced } from '@/contexts/motion-context';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 3000);

    timers.current.set(id, timer);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastOverlay({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const reduced = useMotionReduced();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  if (toasts.length === 0) return null;

  const bgColors: Record<ToastType, string> = {
    success: theme.primary,
    error: theme.danger,
    info: theme.text,
  };

  return (
    <View style={[styles.overlay, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={reduced ? undefined : FadeInUp.duration(200)}
          exiting={reduced ? undefined : FadeOutUp.duration(160)}
        >
          <Pressable
            style={[styles.toast, { backgroundColor: bgColors[toast.type] }]}
            onPress={() => onDismiss(toast.id)}
          >
            <ThemedText style={styles.toastText}>{toast.message}</ThemedText>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 9999,
    gap: Spacing.sm,
  },
  toast: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
