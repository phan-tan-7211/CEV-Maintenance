# Bàn giao Cloudflare Preview – CEV Maintenance

Tài liệu này ghi lại cách preview app Expo/React Native của `CEV-Maintenance` trên Cloudflare Pages sao cho bản web production hiển thị đúng layout và icon như khi chạy `npm run web` ở local.

## Mục tiêu

- Mobile là app chính: `apps/mobile`.
- Preview nhanh qua trình duyệt bằng Expo Web export.
- Mỗi khi push `main`, GitHub Actions tự build và deploy lên Cloudflare Pages.
- URL ổn định: `https://cev-maintenance.pages.dev`.
- Bản preview phải có đầy đủ icon; không dùng bộ SVG vẽ lại để thay Ionicons.

## Luồng build/deploy đang dùng

```text
push main
→ GitHub Actions
→ npm install
→ npm run bundle:web
→ copy Ionicons.ttf vào dist-web
→ Cloudflare Pages deploy dist-web
```

Workflow:

```text
.github/workflows/mobile-review-cloudflare.yml
```

Script Expo Web:

```json
"bundle:web": "expo export --platform web --output-dir dist-web"
```

Cloudflare project:

```text
cev-maintenance
```

GitHub Actions cần có 2 repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Không ghi giá trị secret/token vào source hoặc chat.

## Lỗi icon đã gặp

Khi chạy local bằng:

```bash
cd apps/mobile
npm run web
```

Ionicons hiển thị bình thường.

Nhưng sau `expo export` + Cloudflare Pages, icon từng bị biến thành ô vuông `□`. Text, layout và dữ liệu vẫn hiển thị đúng. Nguyên nhân là bản static production không nạp được font Ionicons theo cơ chế runtime mặc định.

Đã thử preload `Ionicons.loadFont()` nhưng chưa đủ cho static hosting. Sau đó đã thử SVG thay thế để xác nhận lỗi font; SVG hiển thị được nhưng giao diện khác Ionicons gốc nên đã bỏ.

## Cách sửa đang dùng – phải giữ

### 1. Đóng gói font Ionicons vào `dist-web`

Trong `.github/workflows/mobile-review-cloudflare.yml`, sau bước Expo export có bước:

```yaml
- name: Bundle Ionicons font for static web
  run: |
    cp node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf dist-web/Ionicons.ttf
    test -s dist-web/Ionicons.ttf
```

Không được bỏ bước này nếu UI vẫn dùng `@expo/vector-icons/Ionicons`.

### 2. Web phải load font local trước khi render app

File:

```text
apps/mobile/index.tsx
```

Trên web, app load trực tiếp:

```text
/Ionicons.ttf
```

bằng `FontFace`, thêm vào `document.fonts`, sau đó mới `registerRootComponent(App)`.

Native Android/iOS vẫn dùng:

```ts
Ionicons.loadFont()
```

Mục đích là giữ cùng một bộ Ionicons gốc giữa:

```text
npm run web
Cloudflare Pages
Android/iOS
```

## File quan trọng cần kiểm tra nếu icon mất lại

```text
apps/mobile/index.tsx
.github/workflows/mobile-review-cloudflare.yml
apps/mobile/package.json
```

Dependency cần có:

```text
@expo/vector-icons
```

Nếu Cloudflare lại hiện `□`, kiểm tra theo thứ tự:

1. GitHub Action `Mobile Review - Cloudflare Pages` có pass không.
2. Bước `Export Expo Web` có pass không.
3. Bước `Bundle Ionicons font for static web` có pass không.
4. Trong bản deploy có tồn tại `/Ionicons.ttf` không.
5. `apps/mobile/index.tsx` còn load `/Ionicons.ttf` trước khi render không.
6. Trình duyệt có đang giữ cache cũ không; thử hard refresh.
7. Không thay Ionicons bằng SVG custom chỉ để chữa cháy, trừ khi có quyết định đổi design system toàn app.

## Ảnh và static assets trên Cloudflare

Với ảnh/icon dạng file, nguyên tắc là asset phải được Expo export đưa vào `dist-web` hoặc workflow phải copy nó vào `dist-web` trước khi deploy.

Nếu local có ảnh nhưng Cloudflare không có:

- kiểm tra import asset có phải static import/`require(...)` hợp lệ với Expo Web không;
- kiểm tra file có được tạo trong `dist-web` sau `npm run bundle:web` không;
- tránh dùng đường dẫn local Windows hoặc đường dẫn tuyệt đối chỉ tồn tại trên máy dev;
- nếu cần file ở root website thì copy file đó vào `dist-web` trong workflow giống cách đang làm với `Ionicons.ttf`.

## Test trước khi kết luận deploy thành công

Chạy local:

```bash
cd apps/mobile
npm install
npm run typecheck
npm run bundle:web
```

Sau khi push `main`, kiểm tra 2 workflow:

```text
Mobile Quality
Mobile Review - Cloudflare Pages
```

Chỉ kết luận Cloudflare đã cập nhật khi workflow deploy hoàn tất `success`.

Sau deploy mở:

```text
https://cev-maintenance.pages.dev
```

Nếu thấy bản cũ, hard refresh trình duyệt.

## Mốc sửa icon

PR đã dùng để khôi phục Ionicons gốc trên Cloudflare:

```text
PR #3 – fix(web): restore original Ionicons on Cloudflare
```

Merge commit:

```text
64a675af83bbf2cfa5080e94121bf4d8a2d6d0e4
```

Cloudflare workflow sau khi sửa đã chạy thành công và người dùng đã xác nhận icon hiển thị đầy đủ.

## Quy ước cho người tiếp tục phát triển

Không chuyển app sang GitHub Pages/Vercel chỉ vì lỗi icon. Cloudflare Pages hiện hoạt động tốt. Nếu thêm font, ảnh hoặc asset mới mà local hiển thị nhưng production mất, ưu tiên kiểm tra quá trình `expo export` và nội dung `dist-web` trước.

Không đụng phần Supabase/database/nghiệp vụ chỉ để sửa preview. Preview web là lớp build/deploy riêng của `apps/mobile`.
