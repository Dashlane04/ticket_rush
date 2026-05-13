# Lộ trình Tổng quát Hoàn thiện Giao diện (Development Roadmap)

Tài liệu này chia nhỏ quá trình phát triển Frontend thành các Phase (Giai đoạn) nhằm giúp team dễ dàng theo dõi và triển khai từng phần. Ở mỗi phần, tài liệu quy định rõ các UI cần xây dựng, API (BFF) cần gọi, tài nguyên cần lưu trữ, cũng như chiến lược xử lý Error/Loading.

---

## Phase 1: Nền tảng & Xác thực (Foundation & Authentication)

**Mục tiêu:** Thiết lập các cấu trúc cốt lõi, Providers toàn cục và luồng người dùng Đăng nhập/Đăng ký.

- **Các UI cần code:**
  - `RootLayout`: Cấu trúc xương sống, nhúng CSS toàn cục, fonts.
  - `AuthLayout`, Form Đăng nhập (`LoginForm`), Form Đăng ký (`RegisterForm`).
  - Các thành phần Base UI: Button, Input, Modal, Toast (khuyến khích dùng Tailwind + shadcn/ui).
- **Trạng thái / Layout / Provider:**
  - `AuthProvider` (React Context hoặc Zustand): Lưu thông tin cơ bản của User hiện tại (`isLoggedIn`, `userProfile`).
  - `ToastProvider`: Quản lý hiển thị các thông báo thành công/lỗi ở góc màn hình.
- **Tài nguyên (API & Storage):**
  - **Endpoints (BFF):** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
  - **Lưu trữ:** 
    - Lưu JWT Token (Access & Refresh) vào **HttpOnly Cookie** (xử lý tại lớp BFF). 
    - Dữ liệu User info cơ bản có thể lưu vào `LocalStorage` kết hợp Global State để khởi tạo app nhanh, tránh chớp UI.
- **Loading / Error:** 
  - Loading: Nút submit trạng thái `isLoading` (Spinner).
  - Error: Global `ErrorBoundary` hoặc `error.tsx` ở cấp root để bắt lỗi sập toàn hệ thống.

---

## Phase 2: Chức năng Khán giả - Tìm kiếm & Xem Sự kiện

**Mục tiêu:** Cho phép khán giả xem danh sách sự kiện, lọc, tìm kiếm và xem chi tiết một sự kiện.

- **Các UI cần code:**
  - `HomePage`: Banner Hero, Thanh tìm kiếm nhanh, Danh sách sự kiện (Grid/List).
  - `EventDetailPage`: Ảnh cover sự kiện, thông tin mô tả, timeline, giá vé tham khảo, nút "Mua vé ngay".
  - Các Components: `EventCard`, `SearchBar`, `SkeletonEventCard`.
- **Trạng thái / Layout / Provider:**
  - `CustomerMainLayout`: Header (Logo, Search, User Dropdown), Footer chung.
- **Tài nguyên (API & Storage):**
  - **Endpoints (BFF):** `GET /api/events` (Hỗ trợ params search, filter), `GET /api/events/[id]`.
  - **Lưu trữ:** 
    - **Server State**: Khuyến khích dùng Next.js React Server Components (RSC) để fetch danh sách sự kiện, tối ưu SEO. Hoặc dùng `SWR`/`React Query` để cache và tự động revalidate.
- **Loading / Error:**
  - Loading: Dùng `loading.tsx` hiển thị UI dạng Skeleton cho các Card sự kiện.
  - Error: `error.tsx` báo lỗi "Không thể kết nối máy chủ" hoặc "Không tìm thấy sự kiện".

---

## Phase 3: Core - Sơ đồ ghế & Hàng chờ Ảo (Flash Sale)

**Mục tiêu:** Xử lý trải nghiệm mua vé tải cao, gồm việc xếp hàng ảo và thao tác chọn ghế trên sơ đồ theo thời gian thực (Real-time).

- **Các UI cần code:**
  - `VirtualQueuePage`: Màn hình chờ (hiển thị số thứ tự, thời gian chờ dự kiến).
  - `SeatMapPage`: Giao diện hiển thị ma trận ghế, hỗ trợ Zoom/Pan.
  - Các chú thích ghế: Trống (Xanh), Đang giữ (Vàng), Đã bán (Xám).
  - Giỏ hàng mini (Bottom Bar/Sidebar): Hiển thị ghế đang chọn, tổng số tiền.
- **Trạng thái / Layout / Provider:**
  - `BookingLayout`: Minimal Layout (Ẩn Navigation chính, Footer để tránh người dùng bấm thoát nhầm, tăng tập trung).
  - `useSeatMap` Hook: Quản lý tập hợp mảng ghế người dùng đang click chọn (Local State).
  - `WebSocketProvider` / `SSEProvider`: Duy trì kết nối socket lắng nghe trạng thái ghế bị đổi từ người dùng khác.
- **Tài nguyên (API & Storage):**
  - **Endpoints (BFF):** 
    - `GET /api/booking/[eventId]/queue`: Check trạng thái hàng chờ.
    - `GET /api/booking/[eventId]/seat-map`: Khởi tạo sơ đồ ban đầu.
    - `POST /api/booking/hold`: Gửi lệnh giữ ghế tạm thời (Hold seat).
  - **Lưu trữ:** Danh sách ghế đang giữ ở Zustand / Context (chỉ lưu trong phiên người dùng hiện tại).
- **Loading / Error:**
  - Loading: Sơ đồ ghế cần tải nhanh chóng. Ưu tiên render ma trận khung trước, nhồi trạng thái màu sắc sau.
  - Error: Bắt lỗi Toast ngay lập tức nếu chọn phải ghế vừa có người "nhanh tay" giữ mất (Race-condition báo lỗi từ Backend).

---

## Phase 4: Core - Thanh toán & Vòng đời vé

**Mục tiêu:** Tiến hành thanh toán trong 10 phút, cung cấp vé điện tử (QR).

- **Các UI cần code:**
  - `CheckoutPage`: Giao diện thanh toán, form nhập thông tin xuất hóa đơn (nếu có), giả lập phương thức thanh toán.
  - Đồng hồ đếm ngược (Countdown Timer) 10 phút.
  - `MyTicketsPage`: Danh sách vé đã thanh toán thành công.
  - `TicketModal`: Modal hiển thị mã QR Code sắc nét.
- **Trạng thái / Layout / Provider:**
  - `useCountdownTimer` Hook.
  - `CustomerProfileLayout` (Có kèm Sidebar như "Vé của tôi", "Lịch sử mua", "Cài đặt").
- **Tài nguyên (API & Storage):**
  - **Endpoints (BFF):** `POST /api/checkout/process` (Xác nhận đơn hàng), `GET /api/my-tickets` (Lấy danh sách vé User).
  - **Lưu trữ:** Lưu trữ `orderId` hiện tại vào `SessionStorage` (nếu lỡ ấn F5 trình duyệt vẫn giữ được trang thanh toán).
- **Loading / Error:**
  - Loading: Block UI (Overlay/Spinner) trong lúc nhấn thanh toán, tránh việc user double-click thanh toán 2 lần.

---

## Phase 5: Phân hệ Admin - Quản trị & Thống kê

**Mục tiêu:** Công cụ hỗ trợ Đơn vị tổ chức thiết lập sự kiện, vẽ sơ đồ và xem thống kê thời gian thực.

- **Các UI cần code:**
  - `AdminDashboardPage`: Bảng điều khiển tổng quan với các biểu đồ thống kê (Chart.js / Recharts).
  - `EventManagementPage`: Bảng dữ liệu (Data Table) sự kiện. Form CRUD (Create/Read/Update/Delete).
  - `SeatMapBuilder`: Giao diện cho phép Admin tạo khu vực, thiết lập số hàng, cột, gán giá vé.
- **Trạng thái / Layout / Provider:**
  - `AdminLayout`: Cấu trúc Layout đặc thù với Sidebar (Menu tính năng) bên trái, Header bên phải.
  - Middleware bảo vệ chặn quyền (Chỉ tài khoản Role Admin mới được truy cập).
- **Tài nguyên (API & Storage):**
  - **Endpoints (BFF):** `GET /api/admin/analytics`, `POST /api/admin/events`, `PUT /api/admin/events/[id]/seat-map`.
  - **Lưu trữ:** Dữ liệu dashboard luôn cần tươi mới, sử dụng Server State (`SWR`).
- **Loading / Error:** 
  - Loading: Sử dụng Skeleton Tables, Skeleton Charts mượt mà khi đổi tab.
