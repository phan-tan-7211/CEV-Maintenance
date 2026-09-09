# KIẾN TRÚC DANH MỤC V2 — CEV MAINTENANCE

## 1. Nguyên tắc

CEV không tạo thêm một danh mục cấp cao mỗi khi xuất hiện một loại máy, dụng cụ hay tài sản mới.

**Một tài sản vật lý = một hồ sơ trong Danh mục Tài sản.**

Máy sản xuất, dây chuyền, băng chuyền, jig, khuôn, thiết bị đo, máy tính, switch, Wi-Fi, hệ thống chiếu sáng, xe nâng… đều có thể nằm trong cùng **Tài sản**.

Tài sản mới dùng mã quản lý chung:

`TS-####`

Mã đã cấp không đổi và không tái sử dụng.

## 2. Danh mục cấp cao

1. Tài sản
2. Vị trí
3. Phụ tùng & kho
4. Đồng hồ theo dõi
5. Người & nhóm
6. Nhà cung cấp & khách hàng
7. Nhóm / loại tài sản

Các nghiệp vụ như bảo trì, sửa chữa, kiểm tra, hiệu chuẩn, kiểm kê chu kỳ là **nghiệp vụ**, không phải loại tài sản mới.

## 3. Nhóm và loại tài sản

Nhóm cấp cao ổn định:

- Thiết bị sản xuất
- Phụ trợ / hạ tầng
- Jig / khuôn / dụng cụ
- Thiết bị đo / kiểm tra
- CNTT / mạng / văn phòng
- Kho vận / phương tiện
- Thiết bị an toàn
- Khác

Bên trong mỗi nhóm có **Loại tài sản** cấu hình động. Quản trị viên có thể thêm, đổi tên hoặc ngừng sử dụng loại mà không cần sửa mã nguồn ứng dụng.

Mỗi loại có thể bật/tắt các quy tắc:

- Cần mã QR
- Cần bảo trì
- Cần kiểm tra trước vận hành
- Cần hiệu chuẩn / kiểm tra xác nhận
- Theo dõi thời gian dừng
- Quản lý phụ tùng liên quan

Ví dụ: `Máy cuốn` có thể bật bảo trì + kiểm tra trước vận hành + dừng máy + phụ tùng; `Máy tính văn phòng` chỉ cần quản lý tài sản và QR.

## 4. Cấu trúc cha/con

Tài sản hỗ trợ quan hệ cha/con:

- Dây chuyền WPC
  - Máy cuốn
  - Máy hàn
  - Băng chuyền
  - Lò
  - Máy kiểm tra

Mỗi tài sản con vẫn có mã, QR, lịch sử và bảo trì riêng.

## 5. Vị trí

Vị trí là danh mục độc lập và có quan hệ cha/con, ví dụ:

- Nhà máy CEV
  - Khu sản xuất
    - Line Coil
    - Line WPC
  - QC
  - Kho
  - Văn phòng

Di chuyển tài sản chỉ thay đổi vị trí và tạo lịch sử, không thay đổi mã tài sản.

## 6. Phụ tùng & kho

Phụ tùng giữ mã riêng `PT-####`.

Một phụ tùng có thể:

- dùng cho nhiều tài sản;
- tồn ở nhiều vị trí;
- có tồn tối thiểu/tối đa theo vị trí.

`Kiểm kê chu kỳ` là nghiệp vụ của kho: lập đợt đếm → đếm thực tế → so sánh → xử lý chênh lệch.

## 7. Đồng hồ theo dõi

Đồng hồ theo dõi dùng cho dữ liệu vận hành như:

- giờ chạy;
- số chu kỳ;
- số km;
- nhiệt độ hoặc thông số theo dõi.

Đây **không phải thiết bị đo QC**. Thiết bị đo QC là Tài sản thuộc nhóm `Thiết bị đo / kiểm tra` và mở thêm nghiệp vụ hiệu chuẩn/MSA.

## 8. Các bảng chuyên biệt hiện có

Để không phá dữ liệu và nghiệp vụ IATF hiện tại, các bảng chuyên biệt `tooling`, `measuring_equipment`, `safety_equipment` được giữ lại và liên kết về hồ sơ Tài sản gốc bằng `asset_id`.

Như vậy:

- Tài sản là nguồn nhận dạng chung;
- QC vẫn có dữ liệu hiệu chuẩn riêng;
- Jig/tooling vẫn có dữ liệu vòng đời riêng;
- thiết bị an toàn vẫn có lịch kiểm tra riêng.

## 9. Chuyển đổi dữ liệu cũ

Không đổi hàng loạt mã cũ như `ST-02`, `JIG-WPC-01`, `CAL-023` để tránh phá liên kết lịch sử.

Các hồ sơ cũ được đưa vào Asset Master và giữ `legacy_code`. **Tài sản tạo mới từ V2 dùng `TS-####`.**

## 10. Quy tắc mở rộng

Khi xuất hiện vật thể mới, ví dụ robot, camera kiểm tra, bàn xoay hoặc thiết bị mạng mới:

- nếu đã có Loại phù hợp → dùng loại đó;
- nếu chưa có → thêm Loại tài sản;
- chỉ tạo Nhóm cấp cao mới khi thật sự xuất hiện một cơ chế quản lý hoàn toàn khác.

Không tạo thêm module hoặc tiền tố mã chỉ vì có thêm một loại vật thể.
