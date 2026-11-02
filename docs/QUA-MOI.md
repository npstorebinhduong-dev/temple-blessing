# Quà 299 / 1.000 xu — kết quả đối chiếu ngày 02/11/2026

Không truy cập được Google trong môi trường cloud (proxy trả HTTP 403). Đã đọc các danh sách công khai trên GitHub; không chạy mã trong các kho bên ngoài.

## Galaxy / Thiên hà — 1.000 xu

Hai nguồn ghi cùng **giftId 11046**, giá **1.000**, cùng URL icon:

- [WaGi-Coding/tiktok-gift-ids, bản lưu 07/08/2026](https://github.com/WaGi-Coding/tiktok-gift-ids/blob/d402f8673e53e3b73204dd3bfe1bf82b625749a5/gift-ids.json#L2121): `Galaxy`, `id: 11046`, `coins: 1000`.
- [kkkaoru/tiktok-gift-list-per-regison, dữ liệu LIVE Nhật 22/10/2026](https://github.com/kkkaoru/tiktok-gift-list-per-regison/blob/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/live/signed-in.json): `銀河`, `giftId: "11046"`, `coins: 1000`. [Giải thích cách thu thập](https://github.com/kkkaoru/tiktok-gift-list-per-regison/blob/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/README.md).

Icon từ dữ liệu: `https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp`.

Đây là **đối chiếu dữ liệu công khai**, chưa phải xác nhận quà hiện có trên tài khoản/phiên LIVE Thái của chủ dự án. Không có tên Thái chính thức trong các nguồn đã đọc. Bản 0.10 nhận ID 11046 + đúng 1.000 xu; có ô thay ID.

## Corgi — 299 xu (thay “Bạn đồng hành” theo yêu cầu)

Hai nguồn ghi cùng **giftId 6267**, giá **299**, cùng URL icon:

- [WaGi-Coding/tiktok-gift-ids](https://github.com/WaGi-Coding/tiktok-gift-ids/blob/d402f8673e53e3b73204dd3bfe1bf82b625749a5/gift-ids.json#L3243): `Corgi`, `id: 6267`, `coins: 299`.
- [kkkaoru/tiktok-gift-list-per-regison, LIVE Nhật 22/10/2026](https://github.com/kkkaoru/tiktok-gift-list-per-regison/blob/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/live/signed-in.json): `コーギー`, `giftId: "6267"`, `coins: 299`.

Icon từ dữ liệu: `https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp`.

Cài mới nhận **ID 6267 + đúng 299 xu** để chạy Mushika 16 giây. Khi nâng dữ liệu trước 0.10, thay ô ID/icon Mushika và các dòng nâng cao gắn nghi thức cũ bằng Corgi một lần. Sáu quà cũ/Galaxy giữ nguyên, các sửa thủ công sau đó giữ nguyên. Không nhận bất kỳ quà nào chỉ vì giá 299 xu. Danh mục có thể khác theo tài khoản/khu vực/thời điểm; cần đối chiếu nhật ký LIVE Thái của anh. Chưa có tên Thái chính thức trong hai nguồn đã đọc.

## Hiển thị và tự nhận metadata

- Bảng hướng dẫn dùng **mô tả tác dụng tiếng Thái**, không tự đặt tên chính thức của quà. Hai quà mới luôn ở hàng đầu khi đã gán ID; chưa gán sẽ ghi chờ cấu hình. DEMO thử được cả hai.
- Nếu sự kiện LIVE khớp ID có tên chứa tiếng Thái, app tự điền ô tên còn trống/icon từ dữ liệu đó; không ghi đè tên người vận hành đã nhập.
- Icon dùng hai URL TikTok thật ở trên; không đóng gói lại ảnh từ CDN vì cloud bị chặn host này. Trình duyệt máy LIVE tải theo cấu hình; lỗi thì hiện dấu trang trí `✧`. Ảnh kiểm tra cloud thể hiện đúng trạng thái thiếu icon, không ghép icon giả vào ảnh.
- ID vẫn phải khớp **giá một món**. Combo 3 × Corgi = 897 xu, một lượt Mushika có nhãn ×3. Các sự kiện kết thúc khác nhau giữ các lượt FIFO riêng. Galaxy vẫn 1.000 xu, ID 11046.
