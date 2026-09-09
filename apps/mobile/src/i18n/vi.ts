export const vi = {
  appName: 'CEV Bảo trì',
  nav: {
    home: 'Trang chủ',
    work: 'Công việc',
    catalog: 'Danh mục',
    maintenance: 'Bảo trì',
    profile: 'Cá nhân',
  },
  catalog: {
    title: 'Danh mục quản lý',
    subtitle: 'Các đối tượng cần kiểm soát trong hệ thống bảo trì theo IATF 16949',
    assets: 'Máy móc & thiết bị sản xuất',
    utilities: 'Thiết bị phụ trợ & hạ tầng',
    tooling: 'Đồ gá, khuôn & dụng cụ',
    measuring: 'Thiết bị đo & kiểm tra',
    spareParts: 'Phụ tùng thay thế',
    consumables: 'Vật tư bảo trì',
    safety: 'Thiết bị an toàn',
    suppliers: 'Nhà cung cấp dịch vụ',
  },
  work: {
    title: 'Công việc bảo trì',
    subtitle: 'Quản lý yêu cầu, lệnh bảo trì và lịch sử thực hiện',
  },
  maintenance: {
    title: 'Bảo trì định kỳ',
    subtitle: 'Kế hoạch, lịch thực hiện và biểu mẫu kiểm tra',
  },
  profile: {
    title: 'Cá nhân',
    subtitle: 'Tài khoản và cài đặt ứng dụng',
  },
} as const;

export type ViDictionary = typeof vi;
