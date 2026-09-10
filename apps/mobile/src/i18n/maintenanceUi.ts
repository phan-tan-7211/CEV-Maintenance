import type { Locale } from './index';

const vi = {
  workspace: 'Bảo trì phòng ngừa', subtitle: 'Kế hoạch, công việc đến hạn và kiểm tra đầu ca', plans: 'Kế hoạch', tasks: 'Công việc', daily: 'Đầu ca',
  search: 'Tìm mã, tên hoặc tài sản', filter: 'Lọc', sort: 'Sắp xếp', newPlan: 'Kế hoạch mới', editPlan: 'Sửa kế hoạch',
  all: 'Tất cả', active: 'Đang hoạt động', inactive: 'Tạm ngưng', due: 'Hôm nay', upcoming: 'Sắp tới', overdue: 'Quá hạn', completed: 'Hoàn tất',
  pm: 'PM', prestart: 'Kiểm tra đầu ca', planName: 'Tên kế hoạch', description: 'Mô tả', asset: 'Tài sản', frequency: 'Chu kỳ', nextDue: 'Ngày kế tiếp',
  day: 'Ngày', week: 'Tuần', month: 'Tháng', checklist: 'Checklist', addItem: 'Thêm mục', itemPlaceholder: 'Nội dung kiểm tra', required: 'Bắt buộc', save: 'Lưu', cancel: 'Hủy',
  noPlans: 'Chưa có kế hoạch phù hợp.', noTasks: 'Không có công việc trong bộ lọc này.', noDaily: 'Không có tài sản cần kiểm tra đầu ca.',
  start: 'Bắt đầu', continue: 'Tiếp tục', finish: 'Hoàn tất', pass: 'Đạt', fail: 'Không đạt', na: 'N/A', note: 'Ghi chú', noteOptional: 'Ghi chú (không bắt buộc)',
  execution: 'Thực hiện PM', result: 'Kết quả', linkedWorkOrder: 'Work Order liên kết', createWoOnFail: 'Tạo Work Order khi có mục không đạt',
  todayTasks: 'Nhiệm vụ hôm nay', history: 'Lịch sử', doneToday: 'Đã kiểm tra hôm nay', missingTemplate: 'Chưa có checklist đầu ca cho tài sản này.',
  quickCheckHint: 'Chọn kết quả cho từng mục. Flow này được tối ưu để hoàn tất nhanh trên điện thoại.', submitCheck: 'Gửi kiểm tra',
  loading: 'Đang tải…', retry: 'Thử lại', loadError: 'Không tải được dữ liệu', saveError: 'Không lưu được dữ liệu', confirmDeactivate: 'Tạm ngưng kế hoạch này?',
  statusPending: 'Chờ thực hiện', statusInProgress: 'Đang thực hiện', serverEvidence: 'Actor + thời gian hoàn tất được ghi tại server.',
};

const en = {
  workspace: 'Preventive Maintenance', subtitle: 'Plans, due work and pre-start checks', plans: 'Plans', tasks: 'Tasks', daily: 'Pre-start',
  search: 'Search code, name or asset', filter: 'Filter', sort: 'Sort', newPlan: 'New plan', editPlan: 'Edit plan',
  all: 'All', active: 'Active', inactive: 'Inactive', due: 'Due today', upcoming: 'Upcoming', overdue: 'Overdue', completed: 'Completed',
  pm: 'PM', prestart: 'Pre-start check', planName: 'Plan name', description: 'Description', asset: 'Asset', frequency: 'Frequency', nextDue: 'Next due',
  day: 'Day', week: 'Week', month: 'Month', checklist: 'Checklist', addItem: 'Add item', itemPlaceholder: 'Inspection item', required: 'Required', save: 'Save', cancel: 'Cancel',
  noPlans: 'No matching plans.', noTasks: 'No work in this filter.', noDaily: 'No assets require a pre-start check.',
  start: 'Start', continue: 'Continue', finish: 'Complete', pass: 'Pass', fail: 'Fail', na: 'N/A', note: 'Note', noteOptional: 'Note (optional)',
  execution: 'PM execution', result: 'Result', linkedWorkOrder: 'Linked Work Order', createWoOnFail: 'Create a Work Order when an item fails',
  todayTasks: "Today's tasks", history: 'History', doneToday: 'Checked today', missingTemplate: 'No pre-start checklist is configured for this asset.',
  quickCheckHint: 'Choose a result for each item. This flow is optimized for fast mobile completion.', submitCheck: 'Submit check',
  loading: 'Loading…', retry: 'Retry', loadError: 'Unable to load data', saveError: 'Unable to save data', confirmDeactivate: 'Deactivate this plan?',
  statusPending: 'Pending', statusInProgress: 'In progress', serverEvidence: 'Actor and completion time are recorded by the server.',
};

const ko = {
  workspace: '예방 정비', subtitle: '정비 계획, 예정 작업 및 작업 전 점검', plans: '계획', tasks: '작업', daily: '작업 전 점검',
  search: '코드, 이름 또는 자산 검색', filter: '필터', sort: '정렬', newPlan: '새 계획', editPlan: '계획 수정',
  all: '전체', active: '활성', inactive: '비활성', due: '오늘 예정', upcoming: '예정', overdue: '기한 초과', completed: '완료',
  pm: 'PM', prestart: '작업 전 점검', planName: '계획명', description: '설명', asset: '자산', frequency: '주기', nextDue: '다음 예정일',
  day: '일', week: '주', month: '월', checklist: '체크리스트', addItem: '항목 추가', itemPlaceholder: '점검 항목', required: '필수', save: '저장', cancel: '취소',
  noPlans: '조건에 맞는 계획이 없습니다.', noTasks: '이 필터에 해당하는 작업이 없습니다.', noDaily: '작업 전 점검이 필요한 자산이 없습니다.',
  start: '시작', continue: '계속', finish: '완료', pass: '정상', fail: '불합격', na: '해당 없음', note: '메모', noteOptional: '메모 (선택)',
  execution: 'PM 수행', result: '결과', linkedWorkOrder: '연결된 Work Order', createWoOnFail: '불합격 항목이 있으면 Work Order 생성',
  todayTasks: '오늘의 점검', history: '이력', doneToday: '오늘 점검 완료', missingTemplate: '이 자산의 작업 전 체크리스트가 설정되지 않았습니다.',
  quickCheckHint: '각 항목의 결과를 선택하세요. 모바일에서 빠르게 완료하도록 최적화된 흐름입니다.', submitCheck: '점검 제출',
  loading: '불러오는 중…', retry: '다시 시도', loadError: '데이터를 불러올 수 없습니다', saveError: '데이터를 저장할 수 없습니다', confirmDeactivate: '이 계획을 비활성화할까요?',
  statusPending: '대기', statusInProgress: '진행 중', serverEvidence: '수행자와 완료 시간은 서버에서 기록됩니다.',
};

export type MaintenanceUi = typeof en;
export function getMaintenanceUi(locale: Locale): MaintenanceUi { return locale === 'ko' ? ko : locale === 'en' ? en : vi; }
