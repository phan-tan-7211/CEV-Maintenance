# Lane 02 — EquipQR-style PM / Daily Check / Maintenance Execution

## Mục tiêu
Làm nguyên khối Preventive Maintenance + kiểm tra hằng ngày theo flow tham chiếu EquipQR, nhưng phù hợp nghiệp vụ CEV/IATF. Không làm component lẻ. Không phát triển theo CEV-CMMS cũ.

## Nguồn tham chiếu bắt buộc
- Repo tham chiếu: https://github.com/Columbia-Cloudworks-LLC/EquipQR
- Nghiên cứu các flow PM Templates, Work Orders, Daily Check-Ins, checklist execution, status/locking/mobile footer.
- Chỉ tái tạo behavior/UX pattern; KHÔNG sao chép nguyên văn source proprietary.
- Repo đích: phan-tan-7211/CEV-Maintenance
- Base commit: d1864e066b4d15b3efdd7576bd9b999dd0eaedb3

## Phạm vi lane này
1. Đánh giá schema hiện có: maintenance plans, PM checklist, work_orders, assets/type flags và dữ liệu lịch hiện có.
2. Làm workspace PM hoàn chỉnh:
   - danh sách template/kế hoạch PM
   - search/filter/sort
   - create/edit plan
   - chọn asset
   - chu kỳ theo ngày/tuần/tháng hoặc cấu trúc schema hiện có
   - ngày kế tiếp
   - active/inactive
3. Checklist PM:
   - item rõ ràng
   - trạng thái pass/fail/N/A hoặc phù hợp schema hiện có
   - note optional
   - evidence photo optional nếu hạ tầng hiện có hỗ trợ
4. Execution:
   - Due/Upcoming/Overdue/Completed
   - bắt đầu
   - thực hiện checklist
   - hoàn tất
   - ghi server timestamp/user thật
   - không fake chữ ký
5. Daily Check-In / pre-start:
   - chỉ áp dụng asset/type có `requires_prestart=true`
   - flow mobile cực nhanh, mục tiêu 20–30 giây
   - hiển thị nhiệm vụ hôm nay và lịch sử
6. PM phải liên kết Work Order khi phù hợp, tránh tạo hệ thống song song không liên quan.
7. Đảm bảo `requires_maintenance`, `requires_prestart` từ asset type thực sự điều khiển flow, nhưng KHÔNG hard-code tên group/type.
8. i18n đủ VI/EN/KO.
9. KHÔNG sửa `App.tsx` trong lane này. Tạo screen/repository/export sẵn để integration sau.

## File ownership để tránh conflict
Ưu tiên:
- `apps/mobile/src/data/maintenanceRepository.ts` hoặc module PM mới
- `apps/mobile/src/screens/MaintenanceListScreen.tsx` nếu cần thay hoàn toàn
- screen mới PM Template / PM Detail / Daily Check
- helper/i18n riêng
- migration mới nếu thật sự cần

KHÔNG sửa:
- `apps/mobile/App.tsx`
- asset group/type admin
- Inventory workspace
- QR/offline engine

## IATF guardrails
- PM evidence phải là record thực: actor + server time + result.
- Predictive maintenance chỉ “as applicable”; không fake.
- Không bắt 3 chữ ký cho sửa chữa thường quy.
- Downtime/MTTR dùng dữ liệu thật nếu liên kết work order; không tự điền số giả.
- Checklist phải cấu hình được, không copy một checklist khổng lồ cho mọi máy.

## Definition of Done
- PM plan/template + execution + daily/prestart là một block dùng được.
- Data thật từ Supabase.
- Không hard-code group/type sample.
- VI/EN/KO.
- `npm run typecheck` pass.
- `npm run bundle:web` pass.
- Tạo PR về `main`, KHÔNG merge.
- PR body ghi rõ route/wiring cần thêm ở integration.

## Báo cáo cuối lane
Trả về: PR URL, head SHA, flow PM, schema/migration nếu có, file sửa, test result, các điểm cần integration.