# CEV Maintenance

Ứng dụng quản lý bảo trì thiết bị của CEV.

## Hướng phát triển
Giai đoạn hiện tại ưu tiên **Mobile trước** theo cấu trúc tương tự CEV-CMMS:

```text
CEV-Maintenance/
├─ .github/workflows/
├─ apps/
│  ├─ mobile/        # phát triển chính
│  └─ web/           # để khung, làm sau
├─ docs/
└─ README.md
```

## Chạy Mobile
```bash
cd apps/mobile
npm install
npm run start:go
```

## Review trên web
```bash
cd apps/mobile
npm install
npm run web
```

Màn hình khởi tạo đã có: Trang chủ, Công việc, Thiết bị, Bảo trì định kỳ và Cá nhân.
