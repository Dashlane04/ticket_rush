# Quy chuẩn Cấu trúc URI và Thư mục App (Next.js App Router)

Dựa trên tài liệu SRS, ứng dụng được chia làm 2 phân hệ chính: **Customer** (Khán giả) và **Admin** (Ban tổ chức). Để đảm bảo URI không bị lồng quá sâu (tránh các path như `/user/event/booking/payment`), chúng ta sẽ phân chia theo **tài nguyên (resources)** và **nghiệp vụ (business domains)**. 

Sử dụng **Route Groups** `(...)` của Next.js để nhóm cấu trúc thư mục, áp dụng chung các Layout mà không làm thay đổi đường dẫn URL.

---

## 1. Phân hệ Customer (Khán giả)

Sử dụng nhóm thư mục `(customer)` cho các trang hướng tới người dùng cuối. Các URI được thiết kế ngắn gọn, tập trung trực tiếp vào đối tượng tương tác.

| Nghiệp vụ / Tính năng | URI (Đường dẫn) | Thư mục App tương ứng (`app/...`) | Mô tả & Chức năng |
| --- | --- | --- | --- |
| **Trang chủ** | `/` | `(customer)/(main)/page.tsx` | Hiển thị banner, sự kiện nổi bật, tìm kiếm. |
| **Chi tiết sự kiện** | `/events/[id]` | `(customer)/(main)/events/[id]/page.tsx` | Thông tin sự kiện, thời gian, giá vé tham khảo. |
| **Sơ đồ & Đặt vé** | `/booking/[eventId]` | `(customer)/(booking)/booking/[eventId]/page.tsx` | Giao diện hàng chờ ảo (Virtual Queue) và chọn ghế trực quan (real-time). Tách khởi `/events` để rút ngắn path. |
| **Thanh toán** | `/checkout/[orderId]` | `(customer)/(booking)/checkout/[orderId]/page.tsx` | Thanh toán cho vé đang được giữ. Có đếm ngược 10 phút. |
| **Vé của tôi** | `/my-tickets` | `(customer)/(profile)/my-tickets/page.tsx` | Quản lý danh sách vé đã mua (Yêu cầu login). |
| **Chi tiết vé (QR)** | `/my-tickets/[ticketId]` | `(customer)/(profile)/my-tickets/[ticketId]/page.tsx` | Xem mã QR Code của vé để check-in sự kiện. |

*(Lưu ý: Các thư mục con bên trong `(customer)` như `(main)`, `(booking)`, `(profile)` giúp chia nhỏ Layout. Ví dụ: Trang Booking cần ẩn bớt Header/Footer để người dùng tập trung mua vé).*

---

## 2. Phân hệ Admin (Ban tổ chức)

Sử dụng nhóm thư mục `(admin)` và gom dưới tiền tố URL `/admin`.

| Nghiệp vụ / Tính năng | URI (Đường dẫn) | Thư mục App tương ứng (`app/...`) | Mô tả & Chức năng |
| --- | --- | --- | --- |
| **Tổng quan (Dashboard)** | `/admin` | `(admin)/admin/page.tsx` | Báo cáo doanh thu, tình trạng lấp đầy (real-time). |
| **Quản lý sự kiện** | `/admin/events` | `(admin)/admin/events/page.tsx` | Danh sách các sự kiện đã tạo (Data Table). |
| **Tạo/Sửa sự kiện** | `/admin/events/[id]` | `(admin)/admin/events/[id]/page.tsx` | Form cấu hình thông tin sự kiện (`id = new` để tạo mới). |
| **Cấu hình Sơ đồ ghế** | `/admin/events/[id]/seat-map`| `(admin)/admin/events/[id]/seat-map/page.tsx` | Thiết lập ma trận ghế, phân khu vực, gán giá tiền. |
| **Thống kê / Báo cáo** | `/admin/analytics` | `(admin)/admin/analytics/page.tsx` | Thống kê khán giả (độ tuổi, giới tính) bằng biểu đồ. |

---

## 3. Cấu trúc thư mục `/app` tổng quát

```text
src/
└── app/
    ├── (auth)/                   # Nhóm xác thực
    │   ├── login/page.tsx
    │   └── register/page.tsx
    ├── (customer)/               # Nhóm giao diện Khán giả
    │   ├── (main)/
    │   │   ├── layout.tsx        # Header, Footer phổ thông
    │   │   ├── page.tsx          # -> /
    │   │   └── events/[id]/page.tsx # -> /events/[id]
    │   ├── (booking)/
    │   │   ├── layout.tsx        # Minimal Layout (Giấu Navigation)
    │   │   ├── booking/[eventId]/page.tsx # -> /booking/[eventId]
    │   │   └── checkout/[orderId]/page.tsx # -> /checkout/[orderId]
    │   └── (profile)/
    │       ├── layout.tsx        # Có thêm Sidebar profile
    │       └── my-tickets/
    │           ├── page.tsx      # -> /my-tickets
    │           └── [ticketId]/page.tsx # -> /my-tickets/[ticketId]
    ├── (admin)/                  # Nhóm giao diện Ban tổ chức
    │   └── admin/
    │       ├── layout.tsx        # Admin Sidebar, Header
    │       ├── page.tsx          # -> /admin
    │       ├── analytics/page.tsx # -> /admin/analytics
    │       └── events/
    │           ├── page.tsx      # -> /admin/events
    │           ├── [id]/page.tsx # -> /admin/events/[id]
    │           └── [id]/seat-map/page.tsx # -> /admin/events/[id]/seat-map
    ├── api/                      # Next.js BFF layer (Giao tiếp với Core Backend)
    │   ├── auth/[...nextauth]/route.ts
    │   ├── events/route.ts
    │   └── booking/route.ts
    ├── globals.css               # Global styles
    ├── layout.tsx                # Root layout (Chứa các Providers chung toàn app)
    ├── loading.tsx               # Global Loading Spinner
    └── not-found.tsx             # Trang 404
```
