# Quy tắc mã quản lý CEV

Áp dụng cho hệ thống CEV Maintenance và Quy trình quản lý thiết bị sản xuất CEV-QT-TBSX Rev.02.

## Nguyên tắc

1. Mỗi đối tượng chỉ có một mã quản lý duy nhất.
2. Mã do hệ thống tự động cấp; người dùng không tự nhập mã khi tạo mới.
3. Mã đã cấp không được thay đổi trong suốt vòng đời hồ sơ.
4. Mã đã ngừng sử dụng hoặc thanh lý không được tái sử dụng.
5. Thay đổi vị trí, bộ phận sử dụng, người phụ trách hoặc trạng thái không làm thay đổi mã.
6. Mã quản lý chỉ dùng để nhận dạng; thông tin vị trí, người phụ trách, năm mua, loại máy... lưu ở trường dữ liệu riêng.

## Quy ước mã

| Nhóm quản lý | Mẫu mã | Ví dụ |
|---|---|---|
| Thiết bị sản xuất | `TB-####` | `TB-0001` |
| Thiết bị phụ trợ | `PTB-####` | `PTB-0001` |
| Jig / gá / khuôn | `JIG-####` | `JIG-0001` |
| Dụng cụ sản xuất | `DC-####` | `DC-0001` |
| Thiết bị đo / kiểm tra | `TBD-####` | `TBD-0001` |
| Phụ tùng thay thế | `PT-####` | `PT-0001` |
| Vật tư bảo trì | `VT-####` | `VT-0001` |
| Thiết bị an toàn | `AT-####` | `AT-0001` |
| Nhà cung cấp dịch vụ | `NCC-####` | `NCC-0001` |
| Khu vực / vị trí | `KV-###` | `KV-001` |

## Ghi chú triển khai

- Dữ liệu cũ đang có mã lịch sử khác quy ước không tự động đổi mã trong đợt này để tránh mất liên kết hồ sơ.
- Mọi hồ sơ tạo mới sau khi chức năng này được triển khai phải nhận mã theo quy tắc trên.
- Nhóm `DC-####` được dành sẵn cho module Dụng cụ sản xuất tách riêng; module Jig/Gá/Khuôn hiện tại sử dụng `JIG-####`.
- Mã QR được sinh từ mã quản lý và luôn tham chiếu cùng một hồ sơ gốc.
