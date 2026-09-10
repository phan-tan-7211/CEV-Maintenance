# Kiến trúc CEV Maintenance

## Mục tiêu tham chiếu sản phẩm

CEV Maintenance được phát triển theo cấu trúc và luồng sử dụng tham chiếu từ **EquipQR**:

`https://github.com/Columbia-Cloudworks-LLC/EquipQR`

Mục tiêu là bám sát cách EquipQR tổ chức app shell, navigation, Equipment, Work Orders, Inventory, Teams, QR-first workflow và cách người dùng thao tác trên mobile. Không dùng cụm “phát triển theo cấu trúc tương tự CEV-CMMS” làm định hướng sản phẩm.

CEV vẫn giữ các nghiệp vụ bắt buộc riêng của nhà máy như PM, kiểm tra trước vận hành, downtime, calibration/MSA, tooling và bằng chứng IATF; nhưng UI/UX và cách tổ chức chức năng ưu tiên bám theo EquipQR, không tự tạo thêm flow CEV riêng khi EquipQR đã có pattern tương ứng.

## Nguyên tắc dữ liệu gốc

- Một tài sản vật lý = một mã quản lý = một hồ sơ Tài sản gốc.
- Tài sản mới dùng chung mã `TS-####`; không tạo tiền tố mới chỉ vì xuất hiện loại máy/vật thể mới.
- Nhóm tài sản và Loại tài sản là **dữ liệu cấu hình động**, không phải cấu trúc cố định trong mã nguồn.
- Các nhóm/loại được seed ban đầu trong database chỉ là **dữ liệu mẫu mặc định** để app có thể dùng ngay. Người quản trị có thể thêm, đổi tên, sắp xếp, ngừng sử dụng hoặc xóa khi không còn cần.
- Mã đã cấp không thay đổi hoặc tái sử dụng.
- Vị trí là danh mục độc lập; chuyển vị trí không đổi mã tài sản.
- Tài sản hỗ trợ quan hệ cha/con để quản lý dây chuyền → máy → cụm.
- Các nghiệp vụ bảo trì, QR, phụ tùng, di chuyển, hiệu chuẩn và lịch sử đều tham chiếu hồ sơ Tài sản gốc.

Chi tiết: `docs/KIEN_TRUC_DANH_MUC_V2.md`.

## Danh mục cấp cao

Các danh mục bên dưới là cấu hình khởi tạo, không phải danh sách khóa cứng:

1. Tài sản
2. Vị trí
3. Phụ tùng & kho
4. Đồng hồ theo dõi
5. Người & nhóm
6. Nhà cung cấp & khách hàng
7. Nhóm / loại tài sản

## Lớp chuyên biệt IATF

- Thiết bị đo/kiểm tra vẫn có hồ sơ hiệu chuẩn và MSA riêng nhưng liên kết về Asset Master.
- Jig/khuôn/dụng cụ vẫn giữ dữ liệu vòng đời chuyên biệt nhưng liên kết về Asset Master.
- Thiết bị an toàn có thể giữ lịch kiểm tra chuyên biệt nhưng liên kết về Asset Master.
- Loại tài sản quyết định các quy tắc: QR, bảo trì, kiểm tra trước vận hành, hiệu chuẩn, theo dõi dừng máy và phụ tùng.

## Giai đoạn 1: Mobile trước

- `apps/mobile`: Expo + React Native + TypeScript.
- `src/screens`: màn hình nghiệp vụ.
- `src/components`: thành phần giao diện dùng lại.
- `src/data`: repository Supabase và quy tắc nghiệp vụ.
- `supabase/migrations`: toàn bộ thay đổi cấu trúc cơ sở dữ liệu phải được lưu trong Git.

## Thứ tự triển khai tiếp theo

1. Quét QR và tự xác định hành động tiếp theo.
2. Báo sự cố → bắt đầu sửa → hoàn thành → tự tính thời gian sửa/dừng.
3. Kiểm tra trước vận hành theo cấu hình từng loại tài sản.
4. Bảo trì định kỳ và checklist.
5. Liên kết tài sản ↔ phụ tùng, tồn theo vị trí và kiểm kê chu kỳ.
6. Làm việc ngoại tuyến và đồng bộ lại.
7. Hiệu chuẩn / MSA / xử lý thiết bị đo không đạt.
8. Báo cáo và chỉ số.
9. Web quản trị.
