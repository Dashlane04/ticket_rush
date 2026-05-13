# Kiến trúc Frontend & Nguyên tắc Lập trình (Frontend Architecture & Guidelines)

Tài liệu này quy định các nguyên tắc thiết kế, kiến trúc và xử lý dữ liệu cho ứng dụng frontend TicketRush sử dụng Next.js. Việc tuân thủ kiến trúc này giúp đảm bảo mã nguồn dễ bảo trì, mở rộng và đáp ứng tốt với các yêu cầu hiệu năng cao như Flash Sale.

## 1. Nguyên tắc phân tách trách nhiệm (Separation of Concerns)

Tuyệt đối **không** gộp chung toàn bộ logic xử lý, giao diện hiển thị, và gọi API vào một file `page.tsx` hay một component duy nhất. Ứng dụng phải được chia nhỏ theo mô hình sau:

### 1.1. Pure UI Components (Dumb/Presentational Components)
- **Nhiệm vụ**: Chỉ chịu trách nhiệm hiển thị giao diện UI ra màn hình.
- **Đặc điểm**:
  - Dữ liệu hoàn toàn được truyền vào thông qua `props`.
  - Không chứa logic nghiệp vụ của ứng dụng (Business Logic), không trực tiếp gọi API.
  - Không quản lý state nghiệp vụ (chỉ được dùng state đơn giản cho UI như mở/đóng modal, hover, accordion...).
- **Vị trí**: Thường đặt trong thư mục `src/components/ui` hoặc `src/components/common`.

### 1.2. Logic Layer (Custom Hooks / Smart Components)
- **Nhiệm vụ**: Quản lý trạng thái, xử lý các sự kiện của người dùng, thực hiện các tính toán logic.
- **Đặc điểm**:
  - Trừu tượng hóa logic phức tạp ra các Custom Hooks (Ví dụ: `useTicketSelection`, `useCountdownTimer`, `useSeatMap`).
  - Phân tách logic ra khỏi UI giúp dễ dàng viết Unit Test và tái sử dụng logic ở nhiều giao diện khác nhau.
- **Vị trí**: Đặt trong thư mục `src/hooks`.

### 1.3. API Services Layer
- **Nhiệm vụ**: Nơi định nghĩa các hàm dùng để giao tiếp qua mạng với Server/BFF.
- **Đặc điểm**:
  - Không gọi trực tiếp `fetch`/`axios` rải rác ở các UI Component.
  - Gom nhóm các hàm xử lý gọi API, tập trung xử lý lỗi chung (error interceptors) và map lại dữ liệu (Data mapping) từ response trả về.
- **Vị trí**: Đặt trong thư mục `src/services` hoặc `src/api`.

### 1.4. Page Components (`app/**/page.tsx`)
- **Nhiệm vụ**: Đóng vai trò là bộ điều phối (Controller / Container) của mỗi route.
- **Đặc điểm**:
  - Lấy dữ liệu (Data Fetching) ban đầu (khuyến khích tận dụng React Server Components - RSC).
  - Kết nối Logic (Hooks), Services, và truyền dữ liệu xuống dưới cho các cấu trúc UI Components.
  - Là điểm xử lý metadata cho SEO, không nên chứa chi tiết thẻ HTML như `div`, `span` phức tạp (hãy bọc chúng trong các UI Components tương ứng).

---

## 2. Mô hình BFF (Backend For Frontend) với Next.js

Sử dụng chính máy chủ Next.js (**API Routes - `app/api/...`** hoặc **Server Actions**) làm một lớp trung gian (BFF) đứng giữa trình duyệt của người dùng (Client) và các dịch vụ Core Backend.

### 2.1. Lợi ích & Nhiệm vụ của BFF
- **Che giấu hệ thống Backend thật**: Client Frontend không bao giờ biết URL gốc của backend, mọi request từ Client đều gọi tới Next.js server (`/api/...`). Tăng cường tính bảo mật.
- **Quản lý Bảo mật (Token)**: BFF đóng vai trò nhận token xác thực từ Core Backend, sau đó lưu trữ vào **HttpOnly Cookies** để gửi xuống trình duyệt. Các API gọi từ Client lên BFF sẽ tự mang theo Cookies, BFF bóc tách Cookies này và lấy Token đính vào Header gửi về Core Backend. Tránh việc rò rỉ JWT Access Token ở LocalStorage.
- **Tổng hợp & Chuyển đổi dữ liệu (Aggregation & Transformation)**: BFF có thể gọi nhiều API Backend nhỏ lẻ, sau đó lọc bớt các trường không cần thiết, map lại cấu trúc Data cho phù hợp (Ví dụ: BFF tính toán tình trạng full chỗ trước để giảm tải tính toán tại Client).

---

## 3. Quy định về Nhập liệu (Data Entry) & Validation

Form và dữ liệu đầu vào trong ứng dụng (như Đăng nhập, Đăng ký, Cập nhật thông tin, Form thanh toán vé) phải tuân thủ chuẩn xử lý nghiêm ngặt.

### 3.1. Thư viện khuyên dùng
- Quản lý trạng thái Form: **React Hook Form** (giảm thiểu số lần re-render so với quản lý qua `useState`).
- Chuẩn hóa và Validate Schema: **Zod**.

### 3.2. Luồng xử lý Data Entry
1. **Client-side Validation (Bắt buộc)**: Sử dụng Zod resolver cùng React Hook Form để kiểm tra dữ liệu ngay khi người dùng gõ (email đúng định dạng chưa, số lượng vé có vượt giới hạn không, sđt hợp lệ không) để báo lỗi ngay trên UI mà không cần gọi API.
2. **Data Transformation**: Chuẩn hóa dữ liệu phía Client trước khi truyền lên Server (Trim khoảng trắng đầu cuối, chuyển đổi định dạng ngày tháng `DD/MM/YYYY` thành chuẩn ISO 8601).
3. **BFF/Server-side Validation (Bắt buộc)**: Khi request chạm đến BFF (Next.js server) hay Server Backend, **BẮT BUỘC** phải chạy lại validate bằng Zod (hoặc thư viện tương đương ở backend) một lần nữa. Không bao giờ tin tưởng 100% vào dữ liệu từ Browser gửi lên, phòng ngừa người dùng cố tình can thiệp (bypass) validation phía Client bằng công cụ bên ngoài.
4. **Error Handling**: Hiển thị rõ lỗi trả về từ Backend/BFF ngay bên dưới Input tương ứng thay vì chỉ bật một Alert chung chung.

---

## 4. Quản lý Trạng thái & Lưu trữ Dữ liệu (State & Data Storage)

### 4.1. Quản lý State
- **Server State (Dữ liệu fetch từ API)**:
  - Nếu dữ liệu mang tính tĩnh, hoặc cập nhật chậm, hoặc cần phục vụ SEO (như Danh sách Event, Bài viết sự kiện): Fetch trực tiếp qua Next.js Server Components.
  - Nếu dữ liệu mang tính tương tác cao (Client fetching), real-time hoặc polling (như Sơ đồ ghế trống, tình trạng vé): Sử dụng các thư viện như **SWR** hoặc **TanStack Query (React Query)**. *Nghiêm cấm lạm dụng `useEffect` kèm `useState` cho việc gọi API cơ bản vì khó quản lý luồng đua (race-conditions) và cache.*
- **Client State (Trạng thái UI/Logic trình duyệt)**:
  - Sử dụng `useState`, `useReducer` cho các component state cục bộ biệt lập.
  - Sử dụng **Zustand** hoặc React Context API cho các Global State, chia sẻ dữ liệu liên component (Ví dụ: Thông tin User đăng nhập, Global Modals, Giỏ hàng vé hiện tại).

### 4.2. Nguyên tắc Lưu trữ (Storage)
- **Cookies**: Đặc biệt là `HttpOnly` và `Secure` Cookies, CHỈ dùng để lưu Session, JWT Access Token, Refresh Token. (Do tầng BFF đảm nhiệm set và get).
- **Local Storage**: Dành cho các thiết lập của người dùng mang tính cá nhân hóa, không nhạy cảm bảo mật. Ví dụ: Theme (Dark/Light mode), tùy chọn ngôn ngữ, ID sự kiện đã xem gần nhất.
- **Session Storage**: Có thể dùng để lưu tạm luồng tiến trình của người dùng, ví dụ: Các bước đặt vé (Ticket Checkout Flow), nếu người dùng đóng hoàn toàn tab trình duyệt, luồng này sẽ bị hủy một cách an toàn.
