import type { Locale } from './index';

export const appUi = {
  vi: {
    brand: 'CEV · Bảo trì',
    bottom: { home: 'Trang chủ', scan: 'Quét mã', equipment: 'Thiết bị', inventory: 'Kho', work: 'Công việc', menu: 'Menu' },
    menu: {
      title: 'Menu',
      subtitle: 'Tài khoản, cài đặt và các chức năng khác',
      catalog: 'Danh mục quản lý',
      catalogNote: 'Tài sản, vị trí, phụ tùng, nhóm và đối tác',
      maintenance: 'Bảo trì định kỳ',
      maintenanceNote: 'Kế hoạch, lịch và lịch sử bảo trì',
      settings: 'Cài đặt',
      settingsNote: 'Ngôn ngữ và tùy chọn ứng dụng',
      account: 'Tài khoản',
      accountNote: 'Thông tin người dùng hiện tại',
      signOut: 'Đăng xuất',
    },
  },
  en: {
    brand: 'CEV · Maintenance',
    bottom: { home: 'Home', scan: 'Scan', equipment: 'Equipment', inventory: 'Inventory', work: 'Work', menu: 'Menu' },
    menu: {
      title: 'Menu',
      subtitle: 'Account, settings and other functions',
      catalog: 'Management catalog',
      catalogNote: 'Assets, locations, parts, teams and partners',
      maintenance: 'Preventive maintenance',
      maintenanceNote: 'Plans, schedules and maintenance history',
      settings: 'Settings',
      settingsNote: 'Language and application options',
      account: 'Account',
      accountNote: 'Current user information',
      signOut: 'Sign out',
    },
  },
  ko: {
    brand: 'CEV · 유지보수',
    bottom: { home: '홈', scan: '스캔', equipment: '설비', inventory: '재고', work: '작업', menu: '메뉴' },
    menu: {
      title: '메뉴',
      subtitle: '계정, 설정 및 기타 기능',
      catalog: '관리 항목',
      catalogNote: '자산, 위치, 부품, 그룹 및 파트너',
      maintenance: '예방보전',
      maintenanceNote: '계획, 일정 및 유지보수 이력',
      settings: '설정',
      settingsNote: '언어 및 앱 옵션',
      account: '계정',
      accountNote: '현재 사용자 정보',
      signOut: '로그아웃',
    },
  },
} as const;

export function getAppUi(locale: Locale) {
  return appUi[locale];
}
