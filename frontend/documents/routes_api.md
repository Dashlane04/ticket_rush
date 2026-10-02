# Tài liệu Quản lý UI Routes và APIs - TicketRush

## Phần 1: Tiêu chuẩn Kiến trúc Routes (Routing Architecture)

Dự án sử dụng **Next.js (App Router)** và áp dụng phương pháp **Route Groups** `(folder)` để phân chia không gian UI, đảm bảo việc tách biệt cấu trúc và trải nghiệm người dùng giữa Khán giả (Customer) và Quản trị viên (Admin) nhưng vẫn duy trì repo base dễ quản lý.

### 1.1 Nguyên tắc Phân chia (Route Groups)
- Nhóm route dành cho **Khán giả (Customer)** sẽ nằm trong group `(customer)`.
  - Layout áp dụng: Customer Layout (Giao diện mua vé, SEO-friendly, Header/Footer hướng đến người dùng cuối).
  - Định tuyến URL: Map thẳng ra Root URL (`/`). Ví dụ: `/events`, `/user/tickets`.
- Nhóm route dành cho **Quản trị (Admin/Ban tổ chức)** sẽ nằm trong group `(admin)`.
  - Layout áp dụng: Admin Layout (Giao diện dạng Dashboard panel, Sidebar điều hướng, cần Check Auth).
  - Định tuyến URL: Phải được wrap thêm qua thư mục `admin` để map ra URL dạng `/admin/...`.

### 1.2 Cấu trúc Thư mục chuẩn mực (`frontend/src/app`)
Cấu trúc tiêu chuẩn này phải được tuân thủ xuyên suốt quá trình code Frontend:

```text
app/
├── (customer)/                 # [GROUP KHÁN GIẢ] Không tác động đến URL
│   ├── layout.tsx              # Giao diện khung dùng chung cho khán giả
│   ├── page.tsx                # /[Root]: Trang chủ, tìm kiếm/danh sách sự kiện 
│   ├── events/                 
│   │   ├── [eventId]/page.tsx       # /events/[id]: Mô tả chi tiết sự kiện
│   │   └── booking/[eventId]/page.tsx # /events/booking/[id]: Màn hình queue và chọn ghế
│   └── user/                   
│       └── tickets/page.tsx    # /user/tickets: Xem và quản lý các vé điện tử (QR)
│
└── (admin)/                    # [GROUP BAN TỔ CHỨC]
    ├── layout.tsx              # Giao diện khung dùng chung cho Admin (Dashboard UI)
    └── admin/                  # Tất cả route admin dồn vào đây
        ├── dashboard/page.tsx       # /admin/dashboard: Phân tích Real-time (Sales, Seats)
        └── events/                  
            ├── page.tsx             # /admin/events: Quản lý danh sách sự kiện
            └── create/page.tsx      # /admin/events/create: Căn chỉnh cấu hình & tạo sơ đồ ghế
```

### 1.3 Tiêu chuẩn kỹ thuật bổ sung cho Routes
- **Thực tiễn Next.js:** Các file UI không phải là trang chính (ví dụ như các Fragment, Button) KHÔNG ĐƯỢC đặt lẫn lộn bên trong `app` route, mà phải đóng gói trong `src/components/...` để tránh bị Next.js nhận diện sai là một Route.
- **Lấy tham số (Dynamic Params):** Mọi object liên quan định danh như ID sự kiện đều phải dùng Dynamic Routing của Next (dạng `[eventId]`).
- **Middleware Guard:** Sẽ có một file `middleware.ts` ở cấp gốc giám sát toàn bộ cấu trúc định tuyến này. Mọi thao tác truy vấn tài nguyên nằm dưới `/admin/*` đều phải đi qua chốt chặn xác thực. 

## Phần 2: Bản đồ Route Chi tiết

### 2.1 Trang Chủ (Home Page)
- **Vị trí thư mục:** `app/(customer)/page.tsx`
- **Đường dẫn URL:** `/` (Root Path)
- **Vai trò:** Landing page đầu tiên của Khán giả, nơi hiển thị Hero Banner các sự kiện chuẩn bị mở bán (Flash Sale) và danh sách các sự kiện nổi bật.
- **Đặc tả UI & API:** Vui lòng xem bản vẽ chi tiết tại tài liệu `main_page.md`.
