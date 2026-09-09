import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type AppIconName =
  | 'home-outline' | 'home'
  | 'clipboard-outline' | 'clipboard'
  | 'grid-outline' | 'grid'
  | 'calendar-outline' | 'calendar'
  | 'person-outline' | 'person'
  | 'document-text-outline' | 'document-text'
  | 'construct-outline' | 'construct'
  | 'flash-outline' | 'flash'
  | 'hammer-outline' | 'hammer'
  | 'speedometer-outline' | 'speedometer'
  | 'settings-outline' | 'settings'
  | 'flask-outline' | 'flask'
  | 'shield-checkmark-outline' | 'shield-checkmark'
  | 'business-outline' | 'business'
  | 'chevron-forward' | 'chevron-back';

type Props = { name: AppIconName; size?: number; color?: string };

export function AppIcon({ name, size = 24, color = '#667085' }: Props) {
  if (Platform.OS !== 'web') return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;

  const key = name.replace('-outline', '');
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (key === 'chevron-forward') return <Svg {...common}><Polyline points="9 5 16 12 9 19" /></Svg>;
  if (key === 'chevron-back') return <Svg {...common}><Polyline points="15 5 8 12 15 19" /></Svg>;
  if (key === 'home') return <Svg {...common}><Path d="M3 11.5 12 4l9 7.5" /><Path d="M5.5 10.5V20h13v-9.5" /><Path d="M9.5 20v-6h5v6" /></Svg>;
  if (key === 'clipboard') return <Svg {...common}><Rect x="5" y="4" width="14" height="17" rx="2" /><Rect x="8" y="2" width="8" height="4" rx="1.5" /></Svg>;
  if (key === 'grid') return <Svg {...common}><Rect x="3" y="3" width="7" height="7" rx="1" /><Rect x="14" y="3" width="7" height="7" rx="1" /><Rect x="3" y="14" width="7" height="7" rx="1" /><Rect x="14" y="14" width="7" height="7" rx="1" /></Svg>;
  if (key === 'calendar') return <Svg {...common}><Rect x="3" y="5" width="18" height="16" rx="2" /><Line x1="7" y1="3" x2="7" y2="7" /><Line x1="17" y1="3" x2="17" y2="7" /><Line x1="3" y1="10" x2="21" y2="10" /></Svg>;
  if (key === 'person') return <Svg {...common}><Circle cx="12" cy="8" r="4" /><Path d="M4.5 21c.7-4.2 3.2-6.5 7.5-6.5s6.8 2.3 7.5 6.5" /></Svg>;
  if (key === 'document-text') return <Svg {...common}><Path d="M6 3h8l4 4v14H6z" /><Path d="M14 3v5h5" /><Line x1="9" y1="12" x2="15" y2="12" /><Line x1="9" y1="16" x2="15" y2="16" /></Svg>;
  if (key === 'construct') return <Svg {...common}><Path d="m14 6 4-3 3 3-3 4" /><Path d="M13 7 4 16l4 4 9-9" /><Line x1="3" y1="21" x2="9" y2="15" /></Svg>;
  if (key === 'flash') return <Svg {...common}><Path d="M13.5 2 5 13h6l-.5 9L19 10h-6z" /></Svg>;
  if (key === 'hammer') return <Svg {...common}><Path d="m9 5 3-3 5 5-3 3" /><Path d="m12 8-8 8 4 4 8-8" /></Svg>;
  if (key === 'speedometer') return <Svg {...common}><Path d="M4 18a8 8 0 1 1 16 0" /><Line x1="12" y1="12" x2="17" y2="9" /><Circle cx="12" cy="18" r="1" /></Svg>;
  if (key === 'settings') return <Svg {...common}><Circle cx="12" cy="12" r="3" /><Path d="M19 13.5v-3l-2.2-.7a7 7 0 0 0-.7-1.6l1-2-2.1-2.1-2 .9a7 7 0 0 0-1.7-.7L10.5 2h-3l-.7 2.3a7 7 0 0 0-1.6.7l-2-.9L1.1 6.2l.9 2a7 7 0 0 0-.7 1.6L-1 10.5v3l2.3.7a7 7 0 0 0 .7 1.6l-.9 2 2.1 2.1 2-.9a7 7 0 0 0 1.6.7l.7 2.3h3l.7-2.3a7 7 0 0 0 1.7-.7l2 .9 2.1-2.1-1-2a7 7 0 0 0 .8-1.6z" transform="translate(2 0) scale(.9)" /></Svg>;
  if (key === 'flask') return <Svg {...common}><Path d="M9 3h6" /><Path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" /><Line x1="7.5" y1="15" x2="16.5" y2="15" /></Svg>;
  if (key === 'shield-checkmark') return <Svg {...common}><Path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6z" /><Polyline points="8.5 12 11 14.5 15.5 9.5" /></Svg>;
  if (key === 'business') return <Svg {...common}><Rect x="4" y="3" width="11" height="18" rx="1" /><Path d="M15 9h5v12h-5" /><Line x1="7" y1="7" x2="9" y2="7" /><Line x1="11" y1="7" x2="13" y2="7" /><Line x1="7" y1="11" x2="9" y2="11" /><Line x1="11" y1="11" x2="13" y2="11" /><Line x1="7" y1="15" x2="9" y2="15" /><Line x1="11" y1="15" x2="13" y2="15" /></Svg>;

  return <Svg {...common}><Circle cx="12" cy="12" r="8" /></Svg>;
}
