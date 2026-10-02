# Bài tập lớn: TicketRush
**Môn học:** INT3306 - Phát triển ứng dụng web  
**Học kỳ:** Spring 2026

## 1. Mô tả Tổng quan
[cite_start]TicketRush là nền tảng phân phối vé điện tử do một Đơn vị tổ chức sự kiện tự xây dựng và vận hành[cite: 50]. [cite_start]Hệ thống cho phép đăng tải sự kiện, thiết lập sơ đồ ghế ngồi và bán vé trực tuyến[cite: 51].

[cite_start]**Trọng tâm:** Xây dựng hệ thống chịu tải tốt, xử lý chính xác tình huống hàng ngàn người cùng truy cập mua vé trong thời gian ngắn (flash sale)[cite: 52].

## 2. Chức năng cho từng vai trò nghiệp vụ
### Customer (Khán giả)
- [cite_start]Tìm kiếm, xem thông tin sự kiện và sơ đồ chỗ ngồi[cite: 53].
- [cite_start]Chọn ghế, giữ chỗ (trong thời gian quy định) và thanh toán[cite: 54].
- [cite_start]Nhận và quản lý vé điện tử qua QR Code[cite: 55].

### Admin (Chủ hệ thống/Ban tổ chức)
- [cite_start]Toàn quyền quản trị nền tảng[cite: 55].
- [cite_start]Tạo sự kiện, cấu hình sơ đồ ghế (chia khu vực, gán giá tiền)[cite: 56].
- [cite_start]Theo dõi doanh thu và tình trạng lấp đầy ghế theo thời gian thực (Real-time Dashboard)[cite: 57].
- [cite_start]Thống kê khán giả theo độ tuổi, giới tính để nắm bắt thị hiếu[cite: 58].

## 3. Yêu cầu kỹ thuật
### 3.1. Trải nghiệm Sơ đồ ghế
- [cite_start]Giao diện chọn ghế trực quan (ví dụ: Ma trận ghế khu A có 10 hàng, mỗi hàng 15 ghế)[cite: 59, 60].
- [cite_start]Cập nhật trạng thái ghế tự động (Real-time) không cần tải lại trang bằng Polling hoặc WebSockets[cite: 61].

### 3.2. Tranh chấp Dữ liệu (Database Concurrency)
- [cite_start]Đảm bảo một ghế không bán cho nhiều người[cite: 62].
- [cite_start]**Bắt buộc:** Áp dụng Database Transaction / Row Locking khi giữ ghế[cite: 62].
- [cite_start]Tuyệt đối không để xảy ra "Race Condition"[cite: 63].

### 3.3. Quản lý Vòng đời Vé
- [cite_start]**Trạng thái:** Available -> Locked (Chờ thanh toán) -> Sold (Đã mua) / Released (Hết hạn giữ chỗ)[cite: 64].
- Khán giả có **10 phút** để thanh toán. [cite_start]Sử dụng Cronjob hoặc Background Worker để tự động nhả ghế quá hạn[cite: 65].
- [cite_start]*Lưu ý:* Không cần tích hợp cổng thanh toán thật, chỉ cần xác nhận đơn hàng là thành công[cite: 66, 67].

### 3.4. Thử thách Nâng cao: Hàng chờ Ảo (Virtual Queue)
- [cite_start]Thiết kế thuật toán Virtual Queue để tránh sập hệ thống khi truy cập đột biến[cite: 68].
- [cite_start]Hiển thị vị trí hàng đợi cho người dùng và cấp quyền truy cập theo từng đợt vào màn hình chọn ghế[cite: 69].

