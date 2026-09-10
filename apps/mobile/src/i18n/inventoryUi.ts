import type { Locale } from './index';

export const inventoryUi = {
  vi: {
    title: 'Kho & phụ tùng', subtitle: 'Quản lý phụ tùng, tồn kho theo vị trí và mức tối thiểu.', search: 'Tìm mã, tên, quy cách...', add: 'Thêm phụ tùng',
    all: 'Tất cả', low: 'Sắp hết', out: 'Hết hàng', healthy: 'Đủ tồn', sort: 'Sắp xếp', byName: 'Tên', byStock: 'Tồn kho', byCode: 'Mã',
    stock: 'Tồn kho', minimum: 'Tối thiểu', location: 'Vị trí', unitCost: 'Đơn giá', specification: 'Quy cách', compatible: 'Thiết bị sử dụng',
    adjust: 'Điều chỉnh tồn', receive: 'Nhập kho', issue: 'Xuất kho', quantity: 'Số lượng', save: 'Lưu', cancel: 'Hủy', close: 'Đóng',
    newPart: 'Thêm phụ tùng', name: 'Tên phụ tùng', unit: 'Đơn vị', notes: 'Ghi chú', chooseLocation: 'Chọn vị trí', initialQty: 'Tồn ban đầu', minQty: 'Mức tối thiểu', maxQty: 'Mức tối đa',
    noData: 'Chưa có phụ tùng', noResult: 'Không tìm thấy phụ tùng', lowBadge: 'SẮP HẾT', outBadge: 'HẾT HÀNG', codeAuto: 'Mã PT được cấp tự động khi lưu.',
    detail: 'Chi tiết phụ tùng', inventoryByLocation: 'Tồn kho theo vị trí', noStockLocation: 'Chưa cấu hình tồn kho theo vị trí.', noCompatible: 'Chưa liên kết thiết bị nào.',
  },
  en: {
    title: 'Inventory & Parts', subtitle: 'Manage spare parts, stock by location, and minimum levels.', search: 'Search code, name, specification...', add: 'Add Part',
    all: 'All', low: 'Low Stock', out: 'Out of Stock', healthy: 'Healthy', sort: 'Sort', byName: 'Name', byStock: 'Stock', byCode: 'Code',
    stock: 'Stock', minimum: 'Minimum', location: 'Location', unitCost: 'Unit cost', specification: 'Specification', compatible: 'Used by equipment',
    adjust: 'Adjust Stock', receive: 'Receive', issue: 'Issue', quantity: 'Quantity', save: 'Save', cancel: 'Cancel', close: 'Close',
    newPart: 'Add Part', name: 'Part name', unit: 'Unit', notes: 'Notes', chooseLocation: 'Choose location', initialQty: 'Initial stock', minQty: 'Minimum stock', maxQty: 'Maximum stock',
    noData: 'No parts yet', noResult: 'No parts found', lowBadge: 'LOW', outBadge: 'OUT', codeAuto: 'PT code is generated automatically when saved.',
    detail: 'Part Details', inventoryByLocation: 'Stock by location', noStockLocation: 'No location stock configured.', noCompatible: 'No linked equipment yet.',
  },
  ko: {
    title: '재고 & 부품', subtitle: '예비 부품, 위치별 재고 및 최소 재고를 관리합니다.', search: '코드, 이름, 규격 검색...', add: '부품 추가',
    all: '전체', low: '재고 부족', out: '품절', healthy: '정상', sort: '정렬', byName: '이름', byStock: '재고', byCode: '코드',
    stock: '재고', minimum: '최소', location: '위치', unitCost: '단가', specification: '규격', compatible: '사용 설비',
    adjust: '재고 조정', receive: '입고', issue: '출고', quantity: '수량', save: '저장', cancel: '취소', close: '닫기',
    newPart: '부품 추가', name: '부품명', unit: '단위', notes: '비고', chooseLocation: '위치 선택', initialQty: '초기 재고', minQty: '최소 재고', maxQty: '최대 재고',
    noData: '등록된 부품이 없습니다', noResult: '검색 결과가 없습니다', lowBadge: '부족', outBadge: '품절', codeAuto: '저장 시 PT 코드가 자동 발급됩니다.',
    detail: '부품 상세', inventoryByLocation: '위치별 재고', noStockLocation: '위치별 재고가 설정되지 않았습니다.', noCompatible: '연결된 설비가 없습니다.',
  },
} as const;

export function getInventoryUi(locale: Locale) { return inventoryUi[locale]; }
