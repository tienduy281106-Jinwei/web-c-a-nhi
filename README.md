# NIHONGO STEP (日本語ステップ)
> **Dự án Website Học Từ Vựng Tiếng Nhật N5 Tương Tác Cao Dành Cho Người Việt**  
> *"Mỗi ngày một chút tiếng Nhật, tiến bộ từng ngày!"*

---

## 1. GIỚI THIỆU DỰ ÁN

**Nihongo Step** là ứng dụng web học từ vựng tiếng Nhật trình độ JLPT N5 được xây dựng hoàn toàn bằng **HTML5, CSS3 và Vanilla JavaScript thuần túy** (không sử dụng React, Vue, jQuery hay bất kỳ framework cồng kềnh nào). Website chạy trực tiếp trên trình duyệt, không cần cấu hình cơ sở dữ liệu hay server phức tạp.

### Các Điểm Nổi Bật:
- **Dữ liệu chuẩn JLPT N5:** Đầy đủ các nhóm từ vựng Nhóm A đến Nhóm G (Tính từ な, Tính từ い, Phó từ & Liên từ, Sở thích & Năng lực Bài 9, Giải trí, Gia đình & Công việc, Lời mời & Giao tiếp).
- **Thẻ Flashcard 3D:** Hiệu ứng lật thẻ mượt mà, hỗ trợ phím tắt (`Space` để lật, mũi tên trái/phải để chuyển từ), chế độ ẩn/hiện tiếng Nhật và tiếng Việt.
- **Phát âm Web Speech API:** Giọng đọc tiếng Nhật bản xứ (`ja-JP`), tùy chỉnh tốc độ phát âm (0.75x, 1.0x, 1.25x).
- **Hệ thống Quiz 9 dạng bài tập:** Trắc nghiệm tiếng Nhật sang tiếng Việt, tiếng Việt sang tiếng Nhật, nghe chọn đáp án, nhận diện chữ Kanji, Hiragana, Romaji, điền từ vào câu ví dụ, chọn trợ từ が/を và phân biệt tính từ な vs い.
- **Hệ thống Ôn tập Ngắt quãng (Spaced Repetition):** Tự động tính toán độ ưu tiên và ngày ôn tập dựa trên số lần bạn trả lời đúng hoặc sai.
- **Tra cứu Từ điển N5:** Tìm kiếm linh hoạt đa chiều, bộ lọc theo nhóm từ, loại từ, từ yêu thích và popup xem chi tiết từ vựng kèm ngữ pháp bổ trợ.
- **Lưu trữ Offline LocalStorage:** Tự động ghi nhớ điểm XP, chuỗi ngày học Streak, tiến độ từng từ, hỗ trợ sao lưu Xuất/Nhập tệp JSON.
- **Chế độ Sáng / Tối (Dark Mode):** Giao diện thân thiện bảo vệ mắt khi học ban đêm.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```
nihongo-step/
├── index.html              # Trang chủ và toàn bộ cấu trúc giao diện ứng dụng
├── css/
│   ├── themes.css          # Định nghĩa biến màu sắc, Design Tokens, Sáng/Tối
│   ├── style.css           # Bố cục giao diện, Thẻ Flashcard 3D, Quiz, Bảng biểu
│   └── responsive.css      # Tối ưu hóa hiển thị trên Mobile, Tablet và thanh Bottom Nav
├── js/
│   ├── vocabulary.js       # Dữ liệu 60+ từ vựng N5 chuẩn xác kèm ví dụ và ghi chú
│   ├── storage.js          # Quản lý LocalStorage, thuật toán lặp lại ngắt quãng (SRS), XP
│   ├── speech.js           # Xử lý phát âm Web Speech API (ja-JP)
│   ├── flashcards.js       # Bộ điều khiển lật thẻ 3D, bộ lọc, phím tắt
│   ├── quiz.js             # Động cơ tạo đề trắc nghiệm, chấm điểm và giải thích
│   ├── review.js           # Bộ quản lý hàng đợi từ vựng cần ôn tập
│   ├── statistics.js       # Báo cáo học tập, tỷ lệ chính xác, phân tích nhóm từ yếu
│   └── app.js              # Khởi tạo ứng dụng, điều hướng tab, tra cứu từ điển, cài đặt
├── assets/
│   └── images/             # Thư mục lưu hình ảnh & tài nguyên (nếu có)
└── README.md               # Hướng dẫn chi tiết dành cho người mới bắt đầu
```

---

## 3. NHIỆM VỤ CHI TIẾT CỦA TỪNG FILE MÃ NGUỒN

1. **`index.html`**:
   - Khung xương cấu trúc ngữ nghĩa HTML5, nhúng bộ font Google Fonts hỗ trợ tiếng Nhật (`M PLUS Rounded 1c`, `Noto Sans JP`) và tiếng Việt (`Plus Jakarta Sans`).
   - Tích hợp thanh Sidebar cố định trên máy tính và thanh Bottom Navigation tiện lợi trên điện thoại di động.
   - Chứa các khu vực tab: Dashboard, Flashcard, Quiz, Ôn tập, Từ điển, Ngữ pháp, Thống kê và Cài đặt.

2. **`css/themes.css`**:
   - Khai báo hệ thống biến CSS `:root` và `[data-theme="dark"]`.
   - Màu chủ đạo xanh ngọc tươi sáng (`#10b981`) phối hợp màu vàng năng lượng (`#f59e0b`).

3. **`css/style.css`**:
   - Xây dựng bố cục ứng dụng, hiệu ứng 3D lật mặt trước - mặt sau cho Flashcard bằng thuộc tính `perspective` và `transform: rotateY(180deg)`.
   - Định dạng giao diện câu hỏi Quiz với hiệu ứng đổi màu khi chọn đáp án đúng/sai.

4. **`css/responsive.css`**:
   - Sử dụng Media Queries giúp giao diện tự động thích ứng hoàn hảo trên màn hình Desktop, Laptop, Máy tính bảng và Điện thoại.

5. **`js/vocabulary.js`**:
   - Mảng dữ liệu chuẩn `VOCABULARY_DATA` chứa toàn bộ từ vựng theo yêu cầu Nhóm A đến Nhóm G.
   - Mỗi mục từ bao gồm: `id`, `japanese`, `hiragana`, `kanji`, `romaji`, `vietnamese`, `wordType`, `lesson`, `exampleJapanese`, `exampleRomaji`, `exampleVietnamese`, `note`, `audioText`.

6. **`js/storage.js`**:
   - Lớp `StorageManager` quản lý việc đọc/ghi LocalStorage.
   - Tính toán khoảng cách ngày ôn tập (1 ngày, 3 ngày, 7 ngày) và độ ưu tiên (tăng khi làm sai, giảm khi làm đúng).
   - Quản lý điểm kinh nghiệm (XP) và chuỗi học tập liên tiếp (Streak).

7. **`js/speech.js`**:
   - Lớp `SpeechHelper` giao tiếp với Web Speech API trên trình duyệt.
   - Tự động tìm kiếm gói giọng đọc tiếng Nhật (`ja-JP`), điều chỉnh tốc độ đọc và xử lý thông báo thân thiện nếu thiết bị không hỗ trợ.

8. **`js/flashcards.js`**:
   - Lớp `FlashcardController` quản lý bộ thẻ: Lật thẻ, chuyển tiếp, xáo trộn thứ tự, đánh dấu "Đã nhớ" hoặc "Cần ôn", chế độ chỉ hiển thị tiếng Nhật hoặc tiếng Việt.

9. **`js/quiz.js`**:
   - Lớp `QuizEngine` sinh câu hỏi trắc nghiệm ngẫu nhiên từ kho từ vựng.
   - Đảm bảo 4 phương án độc lập không trùng lặp, cung cấp giải thích ngữ pháp chi tiết sau mỗi câu hỏi.

10. **`js/review.js`**:
    - Lớp `ReviewManager` trích xuất danh sách các từ có độ ưu tiên cao hoặc đã đến hạn cần ôn để người học ôn luyện đúng trọng tâm.

11. **`js/statistics.js`**:
    - Lớp `StatisticsManager` tổng hợp số liệu học tập thực tế, vẽ thanh tiến độ hoàn thành của từng nhóm bài học và đề xuất nhóm từ cần cải thiện.

12. **`js/app.js`**:
    - Bộ điều phối trung tâm kết nối toàn bộ module, xử lý tìm kiếm từ điển thời gian thực, mở hộp thoại chi tiết (Modal) và hiển thị thông báo Toast.

---

## 4. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN TỪNG BƯỚC

Dự án không yêu cầu cài đặt Node.js hay server back-end. Bạn chỉ cần làm theo các bước đơn giản sau:

### Bước 1: Mở dự án trong Visual Studio Code (VS Code)
1. Tải và cài đặt [VS Code](https://code.visualstudio.com/) (nếu máy bạn chưa có).
2. Khởi động VS Code, chọn **File** -> **Open Folder...** (Mở thư mục).
3. Tìm và chọn thư mục chứa dự án: `d:\PROGRAM\Dự án web\New folder`.

### Bước 2: Cài đặt tiện ích mở rộng "Live Server"
1. Trong VS Code, nhấn tổ hợp phím `Ctrl + Shift + X` (hoặc nhấn vào biểu tượng 4 ô vuông ở thanh bên trái) để mở mục **Extensions**.
2. Nhập từ khóa: `Live Server`.
3. Nhấn nút **Install** (Cài đặt) tại tiện ích của tác giả *Ritwick Dey*.

### Bước 3: Khởi chạy website
1. Trong danh sách tệp bên trái, nhấp chuột phải vào tệp `index.html`.
2. Chọn dòng **Open with Live Server** (hoặc nhấn vào nút **Go Live** ở góc dưới cùng bên phải màn hình VS Code).
3. Trình duyệt mặc định (Chrome, Edge, Firefox) sẽ tự động mở trang web tại địa chỉ: `http://127.0.0.1:5500/index.html`.

---

## 5. HƯỚNG DẪN KIỂM TRA TOÀN DIỆN CÁC TÍNH NĂNG

### 5.1. Kiểm tra Thẻ Flashcard 3D
1. Nhấn vào mục **Thẻ Flashcard** trên menu.
2. Nhấp chuột vào giữa thẻ để trải nghiệm hiệu ứng lật 3D xem mặt trước (tiếng Nhật) và mặt sau (nghĩa tiếng Việt, ví dụ câu, giải thích).
3. Thử dùng phím tắt trên bàn phím:
   - Nhấn phím `Space` (Dấu cách) để lật thẻ.
   - Nhấn phím `Mũi tên phải` để sang từ tiếp theo.
   - Nhấn phím `Mũi tên trái` để quay lại từ trước.
   - Nhấn phím `S` để nghe phát âm.
4. Nhấn nút **"Đã nhớ từ này"** để kiểm tra việc cộng +5 XP và chuyển thẻ tự động.

### 5.2. Kiểm tra Phát âm Tiếng Nhật (Web Speech API)
1. Nhấn vào biểu tượng loa phát âm trên Flashcard hoặc trong danh sách từ điển.
2. Trình duyệt sẽ phát âm chuẩn từ vựng tiếng Nhật.
3. Vào tab **Cài đặt hệ thống**, thử thay đổi **Tốc độ phát âm** sang *Chậm (0.75x)* hoặc *Nhanh (1.25x)* rồi nhấn loa nghe lại sự khác biệt.

### 5.3. Kiểm tra Bài tập Trắc nghiệm (Quiz)
1. Chọn tab **Bài tập & Quiz**.
2. Chọn bài học muốn kiểm tra (ví dụ: *Nhóm A: Tính từ đuôi な* hoặc *Tổng hợp N5*), chọn số câu hỏi là 5 hoặc 10 câu.
3. Nhấn **"Bắt đầu làm bài kiểm tra"**.
4. Chọn thử một đáp án đúng: Nút sẽ chuyển màu xanh kèm âm thanh phản hồi và giải thích chi tiết.
5. Chọn thử một đáp án sai: Nút sẽ chuyển màu đỏ, đồng thời hiển thị đáp án đúng màu xanh để bạn đối chiếu.
6. Sau khi làm xong câu cuối cùng, xem màn hình tổng kết điểm số, tỷ lệ chính xác % và danh sách các câu làm sai để ôn tập lại.

### 5.4. Kiểm tra Lưu trữ Tiến độ (LocalStorage)
1. Tải lại trang web (nhấn `F5` hoặc `Ctrl + R`).
2. Quan sát mục **Trang chủ Dashboard**: Các chỉ số về Điểm XP, Số từ đã học, Chuỗi Streak vẫn được giữ nguyên đầy đủ.
3. Vào tab **Cài đặt hệ thống**, nhấn nút **"Xuất tệp JSON"** để tải tệp sao lưu về máy.
4. Nhấn nút **"Xóa dữ liệu"** để kiểm tra tính năng đặt lại, sau đó chọn **"Nhập tệp JSON"** tải lại tệp vừa tải để kiểm tra tính năng khôi phục tiến độ.

---

## 6. HƯỚNG DẪN XỬ LÝ LỖI THƯỜNG GẶP (TROUBLESHOOTING)

1. **Không nghe thấy tiếng phát âm khi nhấn nút loa?**
   - *Nguyên nhân:* Trình duyệt của bạn đang tắt quyền âm thanh hoặc hệ điều hành chưa nạp gói giọng tiếng Nhật.
   - *Cách khắc phục:* Sử dụng trình duyệt **Google Chrome** hoặc **Microsoft Edge** (cả hai trình duyệt này đều tích hợp sẵn bộ phát âm tiếng Nhật rất chuẩn). Kiểm tra nút bật/tắt âm thanh trong tab Cài đặt của website.

2. **Dữ liệu không được lưu sau khi tắt trình duyệt?**
   - *Nguyên nhân:* Bạn đang mở trang web ở chế độ Ẩn danh (Incognito/Private) hoặc trình duyệt đang chặn Cookies/LocalStorage.
   - *Cách khắc phục:* Hãy mở website ở chế độ duyệt web bình thường.

3. **Chữ Hán (Kanji) hoặc chữ cái tiếng Nhật bị lỗi font?**
   - *Cách khắc phục:* Dự án đã nhúng sẵn Google Fonts tiếng Nhật trực tuyến. Đảm bảo máy tính của bạn có kết nối Internet khi tải trang lần đầu tiên để font chữ được tải về đầy đủ.
