# Lane 03 — EquipQR-style QR-first + Offline Foundation

## Mục tiêu
Xây nền QR-first + offline/sync cho CEV theo tinh thần EquipQR mobile workflow, nhưng triển khai phù hợp Expo/React Native. Không phát triển theo CEV-CMMS cũ và không làm UI demo giả.

## Nguồn tham chiếu bắt buộc
- Repo tham chiếu: https://github.com/Columbia-Cloudworks-LLC/EquipQR
- Nghiên cứu scan routing, equipment/work-order QR entry, offline-aware actions và mobile workflow.
- Có thể tham khảo Trier OS về state machine/idempotency nếu cần, nhưng EquipQR là tham chiếu UX chính.
- Chỉ tái tạo pattern/behavior; KHÔNG sao chép nguyên văn source proprietary.
- Repo đích: phan-tan-7211/CEV-Maintenance
- Base commit: d1864e066b4d15b3efdd7576bd9b999dd0eaedb3

## Phạm vi lane này
1. QR resolver ổn định:
   - nhận QR mới và legacy (`ASSET:<code>`, `TOOL:<code>`, `MEASURE:<code>` nếu còn tồn tại)
   - resolve về asset/work order/part khi schema hỗ trợ
   - một QR asset dẫn tới action phù hợp theo role/state
2. Scan UX:
   - màn scan rõ ràng
   - nhập mã thủ công fallback
   - recent scans nếu hữu ích
   - xử lý not found/error/retry
3. Offline foundation thật cho business events:
   - dùng SQLite/local persistence phù hợp Expo, không chỉ AsyncStorage auth cache
   - pending event queue
   - `client_event_id` UUID/idempotency
   - event payload/version/device timestamp/actor/status
   - trạng thái UI: Đã đồng bộ / Chờ đồng bộ / Đồng bộ lỗi
4. Sync engine:
   - online detection
   - re-auth khi cần
   - replay theo thứ tự
   - retry an toàn
   - không double-submit khi response mất
   - pull refresh sau sync
5. Tập trung trước vào event có giá trị cao:
   - báo sự cố / tạo work order
   - start/hold/complete work order
   - scan asset
   - inventory adjustment chỉ khi có chiến lược atomic/idempotent an toàn
6. Photos: queue chỉ giữ local path; upload rồi attach sau khi online nếu hạ tầng hiện tại cho phép.
7. Không giả vờ “offline complete” nếu chỉ cache UI. Ghi rõ capability nào đã offline thật.
8. i18n đủ VI/EN/KO cho trạng thái sync/scan.
9. KHÔNG sửa `App.tsx` trong lane này. Expose ScanScreen/service/hooks để integration sau.

## File ownership để tránh conflict
Ưu tiên tạo mới:
- `apps/mobile/src/offline/*`
- `apps/mobile/src/data/qrRepository.ts` / resolver tương đương
- `apps/mobile/src/screens/ScanScreen.tsx`
- sync status component nhỏ, reusable
- migration mới cho idempotency/event log nếu cần

KHÔNG sửa:
- `apps/mobile/App.tsx`
- asset group/type admin
- PM screens/repository
- Inventory workspace UI

## Data/safety rules
- Supabase là canonical source.
- SQLite là working cache + pending queue, không trở thành nguồn dữ liệu chính.
- server timestamp là bằng chứng chính; device timestamp chỉ là metadata.
- inventory decrement phải atomic hoặc reject khi thiếu tồn; không replay mù.
- append-only event log được ưu tiên cho audit trail.

## Definition of Done
- Có ScanScreen thực và resolver thực.
- Có persistent offline queue + sync engine mức nền tảng, không chỉ mock.
- Có idempotency strategy rõ ràng và migration nếu cần.
- VI/EN/KO.
- `npm run typecheck` pass.
- `npm run bundle:web` pass; nếu SQLite native cần web fallback rõ ràng để build không gãy.
- Tạo PR về `main`, KHÔNG merge.
- PR body ghi rõ route/wiring/provider cần thêm ở integration.

## Báo cáo cuối lane
Trả về: PR URL, head SHA, flow scan, offline capability thực tế, migration/schema, file sửa, test result, các bước wiring vào App.tsx.