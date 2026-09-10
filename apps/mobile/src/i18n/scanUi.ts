export type ScanLocale = 'vi' | 'en' | 'ko';
export const scanUi = {
  vi: { title:'Quét QR', manual:'Nhập mã thủ công', scanHint:'Đưa QR thiết bị vào khung', retry:'Thử lại', notFound:'Không tìm thấy mã', recent:'Quét gần đây', synced:'Đã đồng bộ', pending:'Chờ đồng bộ', failed:'Đồng bộ lỗi', open:'Mở', issue:'Báo sự cố', createWo:'Tạo lệnh bảo trì' },
  en: { title:'Scan QR', manual:'Enter code manually', scanHint:'Place the equipment QR in the frame', retry:'Retry', notFound:'Code not found', recent:'Recent scans', synced:'Synced', pending:'Pending sync', failed:'Sync failed', open:'Open', issue:'Report issue', createWo:'Create work order' },
  ko: { title:'QR 스캔', manual:'코드 직접 입력', scanHint:'장비 QR을 프레임 안에 맞추세요', retry:'다시 시도', notFound:'코드를 찾을 수 없습니다', recent:'최근 스캔', synced:'동기화 완료', pending:'동기화 대기', failed:'동기화 오류', open:'열기', issue:'고장 신고', createWo:'작업지시 생성' },
} as const;
