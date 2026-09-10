# Lane 01 — EquipQR-style Admin / Catalog

## Mục tiêu
Triển khai khối quản trị danh mục theo UX/flow tham chiếu từ EquipQR, không tiếp tục thiết kế theo CEV-CMMS cũ. Dữ liệu seed hiện tại chỉ là dữ liệu mẫu, không phải cấu trúc khóa cứng.

## Nguồn tham chiếu bắt buộc
- Repo tham chiếu: https://github.com/Columbia-Cloudworks-LLC/EquipQR
- Chỉ học flow, bố cục, trạng thái, interaction pattern; KHÔNG sao chép nguyên văn source proprietary.
- Repo đích: phan-tan-7211/CEV-Maintenance
- Base commit: d1864e066b4d15b3efdd7576bd9b999dd0eaedb3

## Phạm vi lane này
1. Tạo workspace quản trị `Nhóm / loại tài sản` hoàn chỉnh.
2. `asset_groups` phải quản lý động từ DB:
   - list
   - search
   - create
   - rename/edit description
   - reorder
   - activate/deactivate
   - delete khi an toàn
3. `asset_types` quản lý động theo từng group:
   - list theo group
   - create/edit/delete/deactivate/reorder
   - chỉnh các flags: QR, maintenance, prestart, calibration, downtime, spare parts
4. Seed 8 nhóm + các loại hiện có chỉ là sample/default data. Không hard-code tên nhóm trong UI.
5. Khi xóa:
   - nếu chưa có tham chiếu thì cho xóa thật
   - nếu đang được asset/type tham chiếu thì UI phải giải thích rõ và ưu tiên deactivate hoặc yêu cầu chuyển liên kết trước
   - không tự ý cascade phá lịch sử
6. UI mobile phải cùng ngôn ngữ thiết kế với Equipment/Teams/Inventory hiện tại và pattern EquipQR: header gọn, search/action rõ, card/list, bottom sheet/dialog cho create/edit.
7. i18n đủ VI/EN/KO. Không hard-code text nghiệp vụ mới trong component nếu có thể tránh.
8. Kiểm tra lại Catalog/Menu để chức năng này có entry rõ ràng, nhưng KHÔNG sửa `App.tsx` trong lane này. Chỉ xuất màn hình/repository/API sẵn để lane merge tích hợp sau.

## File ownership để tránh conflict
Ưu tiên tạo/sửa:
- `apps/mobile/src/data/assetGroupRepository.ts`
- màn hình mới riêng cho quản trị group/type
- i18n module mới riêng nếu cần
- test/unit helper liên quan

KHÔNG sửa trong lane này:
- `apps/mobile/App.tsx`
- Work Orders/PM repository
- QR/offline engine
- Inventory workspace

## Yêu cầu dữ liệu
- Đọc schema Supabase thật trước khi code.
- Không thêm schema chỉ để phục vụ UI nếu chưa cần.
- Nếu cần DDL thật sự, thêm migration mới trong repo; không sửa migration lịch sử.
- Không đổi mã asset hiện hữu, không đổi legacy codes.

## Definition of Done
- Có màn quản trị group/type dùng data thật.
- Có CRUD + deactivate/reorder hợp lý.
- Không hard-code 8 group sample vào UI.
- VI/EN/KO hoạt động.
- `npm run typecheck` pass.
- `npm run bundle:web` pass.
- Tạo PR về `main`, KHÔNG merge.
- Trong PR body ghi rõ file nào cần wiring ở `App.tsx` sau merge.

## Báo cáo cuối lane
Trả về: PR URL, head SHA, danh sách file sửa, flow UI, thay đổi DB nếu có, test result, và hướng dẫn integration 3–5 dòng.