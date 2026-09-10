import type { Locale } from './index';

export const equipmentUi = {
  vi: {
    title: 'Thiết bị', search: 'Tìm thiết bị...', sort: 'Sắp xếp', sortName: 'Tên', sortCode: 'Mã', sortGroup: 'Nhóm',
    filters: 'Bộ lọc thiết bị', filterDescription: 'Lọc thiết bị theo nhóm tài sản.', quickFilters: 'Bộ lọc nhanh', all: 'Tất cả',
    clearAll: 'Xóa tất cả bộ lọc', active: 'Đang lọc', results: 'thiết bị', noEquipment: 'Chưa có thiết bị', noResults: 'Không tìm thấy thiết bị',
    noEquipmentHint: 'Thêm thiết bị đầu tiên. Bạn có thể chọn nhóm có sẵn hoặc tạo nhóm mới ngay trong form.', noResultsHint: 'Thử thay đổi từ khóa hoặc bộ lọc.',
    add: 'Thêm thiết bị', unclassified: 'Chưa phân loại', close: 'Đóng', ascending: 'Tăng dần', descending: 'Giảm dần'
  },
  en: {
    title: 'Equipment', search: 'Search equipment...', sort: 'Sort', sortName: 'Name', sortCode: 'Code', sortGroup: 'Group',
    filters: 'Filter Equipment', filterDescription: 'Filter equipment by asset group.', quickFilters: 'Quick filters', all: 'All',
    clearAll: 'Clear All Filters', active: 'Active', results: 'equipment', noEquipment: 'No equipment yet', noResults: 'No equipment found',
    noEquipmentHint: 'Add your first equipment. You can select an existing group or create a new one directly in the form.', noResultsHint: 'Try changing the search term or filters.',
    add: 'Add Equipment', unclassified: 'Unclassified', close: 'Close', ascending: 'Ascending', descending: 'Descending'
  },
  ko: {
    title: '설비', search: '설비 검색...', sort: '정렬', sortName: '이름', sortCode: '코드', sortGroup: '그룹',
    filters: '설비 필터', filterDescription: '자산 그룹으로 설비를 필터링합니다.', quickFilters: '빠른 필터', all: '전체',
    clearAll: '모든 필터 지우기', active: '적용 중', results: '설비', noEquipment: '등록된 설비가 없습니다', noResults: '검색 결과가 없습니다',
    noEquipmentHint: '첫 설비를 등록하세요. 기존 그룹을 선택하거나 등록 화면에서 새 그룹을 바로 만들 수 있습니다.', noResultsHint: '검색어나 필터를 변경해 보세요.',
    add: '설비 추가', unclassified: '미분류', close: '닫기', ascending: '오름차순', descending: '내림차순'
  },
} as const;

export function getEquipmentUi(locale: Locale) {
  return equipmentUi[locale];
}
