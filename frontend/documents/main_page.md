# Kế hoạch Triển khai: Giao diện Trang Chủ (Home Page)

**Tham chiếu sơ đồ Route:** Được định tuyến tại `app/(customer)/page.tsx` -> **URL:** `/`

Trang chủ là bộ mặt của nền tảng TicketRush. Trọng tâm của trang chủ là làm nổi bật các sự kiện sắp hoặc đang diễn ra, đặc biệt là các sự kiện chuẩn bị mở bán (Flash Sale) để đúng với tiêu chí "săn vé" (Rush). 

---

## 1. Thành phần Giao diện (UI Components)

Quá trình chia Component giao diện sẽ tách các module có logic phức tạp thành các tệp riêng biệt trong `src/components/` thay vì nhồi nhét tất cả vào `page.tsx`.

### 1.1. Header Navigation (`<CustomerHeader />`)
- **Vị trí:** Nằm trên cùng, cố định (Sticky Sidebar/Header).
- **Logo:** TicketRush (Góc trái).
- **Global Search (Thanh tìm kiếm):** Cho phép người dùng gõ tên sự kiện, trả về gợi ý ngay lập tức.
- **Khu vực User:** Nút Đăng nhập/Đăng ký. Nếu đã đăng nhập, hiển thị Avatar người dùng dạng Dropdown (Menu: Tài khoản, Vé của tôi, Đăng xuất).

### 1.2. Hero Banner Slider (`<HeroBanner />`)
- **Vị trí:** Ngay dưới Header.
- Dùng cho các sự kiện Top/Hot nhất. Yêu cầu có ảnh nền ngang cực lớn chất lượng cao, có Text nổi (sử dụng Glassmorphism theo `theme.md`).
- **Nghiệp vụ đếm ngược (Countdown Timer):** Với các sự kiện chưa mở bán, bắt buộc có đồng hồ đếm ngược (Ngày:Giờ:Phút:Giây) lớn màu Trạng thái cảnh báo (Amber/Coral) nhằm tạo tính khẩn trương.
- Có thẻ Call-To-Action (Nút `--color-primary`) dẫn thẳng sang trang Chi tiết sự kiện (`/events/[id]`).

### 1.3. Khối Sự kiện Đặc bật/Mới nhất (`<FeaturedEvents />`)
- Grid các Event Cards (Dạng thẻ đứng).
- Mỗi Card gồm có:
  - Thumbnail (Ảnh dọc).
  - Tên sự kiện.
  - Thời gian & Địa điểm.
  - Hiển thị Badge Trang thái báo hiệu: "Đang mở bán", "Sắp diễn ra", hoặc "Sold Out" (Sử dụng chéo các mã màu `--state` đã định nghĩa).

### 1.4. Bộ lọc (Filters) & Khám phá Sự kiện (`<EventFilter />` & `<EventGrid />`)
- Phân loại (Category): Âm nhạc, Thể thao, Hài kịch, v.v.
- Filter theo thời gian: "Tuần này", "Tháng này".
- Hỗ trợ Load More (Tải thêm) ở cuối danh sách.

### 1.5. Footer (`<CustomerFooter />`)
- Chứa các logo đối tác nền tảng, điều khoản sử dụng, chính sách quy định soát vé.

---

## 2. Thông tin & Hành động cần gọi đến Backend (API Calls)

Next.js (App Router) cho phép gọi API ngay lúc render server (Server Component) giúp SEO và load lần đầu rất nhanh, đồng thời giảm lượng request đập thẳng vào DB lúc load trang gốc.

| Nhóm Tính năng | Rendering | Logic / Dữ liệu cần thiết | Endpoint API (Dự kiến) |
| :--- | :--- | :--- | :--- |
| **Auth Session** | Server-side | Check JWT / Cookie xác thực đang tồn tại có hợp lệ không, để đổi nút Login thành Avatar. | Tích hợp NextAuth hoặc gọi API kiểm tra Token `/api/auth/me` |
| **Hero Banner** | Server-side | Fetch tối đa 3-5 sự kiện đỉnh cao nhất (hoặc đang cho chạy quảng cáo banner). | Lệnh GET: `/api/v1/events/featured` |
| **Event Grid & Categorial Filter**| Phối hợp Server/Client | Ban đầu fetch trước 10 Sự kiện hot nhất để render. Khi người dùng bấm Filter thể loại thì gọi Data mới thông qua AJAX (Client Component). | Lệnh GET: `/api/v1/events?category={id}&page=1&limit=10` |
| **Tự động Gợi ý Tìm kiếm** | Client-side | Khi User gõ nội dung (Bắt sự kiện onChange + Debounce 300ms) sẽ Call nhẹ một List gồm tên và avatar sự kiện đó rớt xuống dạng Dropdown. | Lệnh GET: `/api/v1/events/search?q={text}` |

---

## 3. Lưu ý Kỹ thuật & Tối ưu chịu tải (Scaling Note)
Chiếu theo yêu cầu về xử lý truy cập lượng lớn (Flash Sale, Hàng nghìn user F5 liên tục trên Trang chủ):
- Các API trả về danh sách sự kiện trên màn Home này (đặc biệt là API Banner, API Sự kiện nổi bật) **bắt buộc phải được sinh Cache** ở Backend (như Redis) hoặc tính năng Data Cache của Next.js (lệnh `fetch` có flag cache tĩnh, ví dụ revalidate mỗi 60s).
- Nếu User f5 liên tục, server Node.js không cần phải lục lại Database để truy vấn Event List, bảo vệ hệ thống không bị "cạn kiệt kết nối" (Conn Pool exhaustion).
