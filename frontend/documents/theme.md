# Tài liệu Thiết kế (Design System) - TicketRush

Tài liệu này định nghĩa hệ thống màu phân cấp (Color Hierarchy) cho TicketRush. Dựa trên tính chất của dự án (mua vé tốc độ cao, Flash Sale, sơ đồ ghế thời gian thực) và **Tuyệt đối không sử dụng dải màu Tím (Purple Ban)**, hệ thống màu được thiết kế để đẩy cao cảm xúc "khẩn trương" (Rush), sang trọng (Premium), và tương phản cao (mạch lạc khi xem sơ đồ).

---

## 1. Màu Thương hiệu & Hành động (Brand & Primary)

Màu chủ đạo được thiết kế để tạo sự nổi bật tuyệt đối cho các hành động quan trọng (Call-To-Action) như "Mua vé", "Thanh toán ngay". Chúng ta chọn dải màu **Crimson/Rose (Đỏ rực/Hồng đậm)** làm màu đại diện của chữ "Rush".

| Vai trò | Tên Token (CSS) | Mã Hex | Ý nghĩa sử dụng |
| :--- | :--- | :--- | :--- |
| **Primary Base** | `--color-primary` | `#E11D48` | Button CTA chính, đánh dấu sự kiện nổi bật, logo. |
| **Primary Hover**| `--color-primary-hover` | `#BE123C` | Trạng thái hover của Button CTA. |
| **Secondary** | `--color-secondary` | `#0F172A` | Các nút phụ trợ, Dark/Light Mode toggle, nền Header. |
| **Accent / Glow**| `--color-accent` | `#FCA5A5` | Dùng làm viền sáng mờ (glow) quanh nút Mua hoặc phần tử được Focus. |

---

## 2. Màu Nghề nghiệp - Trạng thái Sơ đồ Ghế (Semantic / Booking States)

Đây là phân cấp màu quan trọng nhất dành cho màn hình Sơ đồ ghế và Hàng chờ (Virtual Queue) theo chuẩn SRS.

| Trạng thái Ghế | Tên Token (CSS) | Mã Hex | Mô tả UI / UX |
| :--- | :--- | :--- | :--- |
| **Available** (Trống) | `--state-available` | `#F1F5F9` | Ghế có thể mua. Màu xám nhạt/Light Blue, viền `#CBD5E1`. Khi hover sẽ chuyển sang `--color-primary` nhạt hơn. |
| **Selected** (Đang chọn) | `--state-selected`| `#10B981` | Ghế mà user **đang click chọn**. Màu Xanh Lục bảo (Emerald) tạo cảm giác an toàn và thành công ghim chỗ. |
| **Locked** (Đang giữ chỗ)| `--state-locked` | `#F59E0B` | Ghế người khác đang giữ (trong 10 phút chờ thanh toán). Màu Cam (Amber) báo hiệu trạng thái "pending/đang tranh chấp". |
| **Sold** (Đã bán) | `--state-sold` | `#475569` | Ghế đã chốt. Màu xám đậm (Slate-600), không thể click (cursor: not-allowed), có thể kèm nền sọc chéo mờ. |

---

## 3. Màu Nền & Bề mặt (Background & Surfaces)

Theo quy định thiết kế, dự án sẽ sử dụng phong cách Glassmorphism và Sleek Dark Mode, bỏ qua những màu trắng/đen tẻ nhạt.

| Phân tầng Nền | Tên Token (CSS) | Khán giả (Khuyến khích Dark Mode) | Quản trị viên (Khuyến khích Light Mode) |
| :--- | :--- | :--- | :--- |
| **Background (Đáy)** | `--bg-base` | `#0B0F19` (Sleek Dark - Đen pha Navy) | `#F8FAFC` (Slate mờ sáng) |
| **Surface (Bề mặt thẻ/khung)** | `--bg-surface` | `#1E293B` (Kèm tính chất mờ - Blur 10px) | `#FFFFFF` (Trắng tinh) |
| **Borders (Viền khung)** | `--bg-border` | `#334155` | `#E2E8F0` |

---

## 4. Typography (Văn bản)

Đảm bảo độ tương phản (Contrast) nhưng không dùng `#000000` hay `#FFFFFF` nguyên bản để tránh chói mắt.

| Vai trò | Tên Token (CSS) | Mã Hex (Light) | Mã Hex (Dark) |
| :--- | :--- | :--- | :--- |
| **Tiêu đề chính (Heading)** | `--text-heading` | `#0F172A` (Slate-900)| `#F8FAFC` (Slate-50) |
| **Đoạn văn (Body)** | `--text-body` | `#334155` (Slate-700)| `#CBD5E1` (Slate-300)|
| **Văn bản mờ (Muted)** | `--text-muted` | `#64748B` (Slate-500)| `#94A3B8` (Slate-400)|

---

*Ghi chú: Layout áp dụng và component library (sử dụng tailwind utility hoặc class css nào) cho từng Theme/Template sẽ được cập nhật thêm dần vào dưới đây trong các pha code UI thực tế.* 
