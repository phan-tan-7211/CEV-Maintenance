import { Ionicons } from '@expo/vector-icons';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

async function loadIconFont() {
  if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
    const source = 'url("/Ionicons.ttf") format("truetype")';
    const fonts = [new FontFace('Ionicons', source), new FontFace('ionicons', source)];
    const loaded = await Promise.all(fonts.map((font) => font.load()));
    const fontSet = document.fonts as unknown as { add: (font: FontFace) => void };
    loaded.forEach((font) => fontSet.add(font));
    return;
  }

  await Ionicons.loadFont();
}

async function startApp() {
  try {
    await loadIconFont();
  } catch (error) {
    console.warn('Không thể tải phông biểu tượng Ionicons.', error);
  }

  registerRootComponent(App);
}

void startApp();
