import React from 'react';
import { Text, View } from 'react-native';
import { scanUi, type ScanLocale } from '../i18n/scanUi';

export function SyncStatusBadge({ status, locale = 'vi' }: { status: 'synced' | 'pending' | 'failed'; locale?: ScanLocale }) {
  const t = scanUi[locale];
  const label = status === 'synced' ? t.synced : status === 'failed' ? t.failed : t.pending;
  return <View style={{ alignSelf:'flex-start', borderWidth:1, borderColor:'#d1d5db', borderRadius:999, paddingHorizontal:10, paddingVertical:4 }}><Text style={{ fontSize:12, fontWeight:'600' }}>{label}</Text></View>;
}
