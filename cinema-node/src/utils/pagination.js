// src/utils/pagination.js
// FIX #5: Pagination helper nhận pre-counted total thay vì cắt mảng bằng JS.
// Tất cả repository phải tự chạy SQL LIMIT/OFFSET + COUNT(*) riêng.

/**
 * Bao dữ liệu đã được phân trang từ DB vào cấu trúc chuẩn Laravel-compatible.
 * @param {Array}  data      - Mảng records đã được LIMIT/OFFSET từ DB
 * @param {number} total     - Tổng số records (từ SELECT COUNT(*))
 * @param {number} page      - Trang hiện tại (1-indexed)
 * @param {number} perPage   - Số records mỗi trang
 */
export const paginate = (data, total, page = 1, perPage = 15) => {
  const dataArray  = Array.isArray(data) ? data : [];
  const totalCount = Number(total) || 0;
  const currentPage = Number(page) || 1;
  const perPageNum  = Number(perPage) || 15;

  return {
    data:         dataArray,
    current_page: currentPage,
    per_page:     perPageNum,
    total:        totalCount,
    last_page:    Math.ceil(totalCount / perPageNum) || 1,
  };
};

/**
 * Bao mảng đầy đủ (không phân trang) thành cấu trúc tương thích.
 * Dùng cho các list nhỏ như Rooms, không cần LIMIT/OFFSET.
 * @param {Array} data
 */
export const paginateAll = (data) => {
  const dataArray = Array.isArray(data) ? data : [];
  return {
    data:         dataArray,
    current_page: 1,
    per_page:     dataArray.length,
    total:        dataArray.length,
    last_page:    1,
  };
};
