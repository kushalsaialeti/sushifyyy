import type { PropsWithChildren } from 'react';

import { OverlayFrame } from '@/components/OverlayFrame';

export function BottomSheet({ title, onClose, visible, children }: PropsWithChildren<{
  title: string;
  onClose: () => void;
  visible: boolean;
}>) {
  return <OverlayFrame kind="sheet" visible={visible} title={title} onClose={onClose}>{children}</OverlayFrame>;
}
