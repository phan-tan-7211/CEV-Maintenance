# Kiến trúc CEV Maintenance

## Nguyên tắc dữ liệu gốc
- Một đối tượng = một mã quản lý = một hồ sơ gốc.
- Mã quản lý do hệ thống tự động cấp và không được thay đổi hoặc tái sử dụng.
- Mọi nghiệp vụ bảo trì, QR, phụ tùng, di chuyển, hiệu chuẩn và lịch sử đều tham chiếu mã gốc.
- Quy tắc mã chi tiết: `docs/QUY_TAC_MA_QUAN_LY.md`.

## Giai đoạn 1: Mobile trước
- `apps/mobile`: Expo + React Native + TypeScript.
- `src/screens`: màn hình nghiệp vụ.
- `src/components`: thành phần UI dùng lại.
- `src/theme`: màu sắc và token giao diện.
- `src/data/managementCodes.ts`: quy tắc cấp mã quản lý tự động.

## Nhóm chức năng đầu tiên
1. Trang chủ / tổng quan.
2. Công việc bảo trì.
3. Thiết bị / tài sản.
4. Bảo trì định kỳ.
5. Cá nhân / cài đặt.

## Giai đoạn sau
- Quét QR và tự xác định hành động tiếp theo.
- Phiếu sửa chữa đầy đủ.
- Checklist bảo trì định kỳ.
- Phụ tùng và tồn kho tối thiểu.
- Nhà cung cấp dịch vụ.
- Hiệu chuẩn thiết bị đo.
- Báo cáo và dashboard.
- Web quản trị.
