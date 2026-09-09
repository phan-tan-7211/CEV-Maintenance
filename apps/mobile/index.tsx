import { Ionicons } from '@expo/vector-icons';
import { registerRootComponent } from 'expo';
import App from './App';

async function startApp() {
  try {
    await Ionicons.loadFont();
  } catch (error) {
    console.warn('Không thể tải phông biểu tượng Ionicons.', error);
  }

  registerRootComponent(App);
}

void startApp();
