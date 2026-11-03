# Nguồn icon quà

Các WebP trong thư mục là byte gốc tải từ TikTok CDN: Rose, Peach, Perfume, Doughnut, Bouquet, Corgi, Galaxy và ảnh ứng viên Love Perfume chỉ dùng demo. `local-icons.json` ghi URL, catalog đối chiếu và SHA-256 từng file. Ảnh cục bộ được ưu tiên để đọc rõ ở 64 px và không phụ thuộc CDN khi mở LIVE. Khi thay giftId, không tái sử dụng ảnh của ID cũ.

`catalog-jp-2026-10-22.png` là file gốc từ catalog công khai Nhật Bản của [kkkaoru/tiktok-gift-list-per-regison](https://github.com/kkkaoru/tiktok-gift-list-per-regison/tree/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/live), lấy từ archive của commit cố định. Giữ nguyên byte ảnh; CSS chọn ô 64 × 64. Đây là hình quà TikTok, quyền đối với hình/nhãn hiệu thuộc chủ sở hữu; không phải artwork tự tạo, không được tuyên bố là CC0 hoặc MIT của dự án.

Xem `source.json` để kiểm tra SHA-256, vị trí ô và nguồn. Thứ tự ô được sắp theo giá xu rồi giữ thứ tự catalog cùng giá; vị trí ô không dùng để suy ra ID. Giá và ID đối chiếu JSON riêng.

Rose 5655 / 1, Perfume 5658 / 20, Doughnut 5879 / 30, Corgi 6267 / 299 và Galaxy 11046 / 1000 được đối chiếu thêm với [gift-ids.json của WaGi-Coding](https://github.com/WaGi-Coding/tiktok-gift-ids/blob/d402f8673e53e3b73204dd3bfe1bf82b625749a5/gift-ids.json). Catalog công khai không chứng minh quà đang bán trên tài khoản Thái cụ thể.

Ảnh Love Perfume lấy từ ô catalog tương ứng ứng viên 919386 / 5 xu, chỉ hiển thị demo. Không bật ID này cho LIVE khi chưa đối chiếu nguồn Thái. Đèn 1 xu và Tràng hoa 15 xu chưa có icon/ID đáng tin; hiển thị ô thiếu ảnh, không dùng emoji hoặc vẽ giả icon.

Bộ `ganesha_gift_reference`, ba ảnh và video `1000086073.mp4` được nhắc trong yêu cầu chưa có file/đường dẫn truy cập trong workspace. Video truy cập được là `video_2026-11-02_00-09-34.mp4`, dài gần 13 giây. Không ghi nhận đã đọc bộ 20 crop. Khi bridge gửi icon HTTPS cho quà đã nhận diện, ứng dụng lưu metadata và dùng đúng ID của quà. Các icon còn thiếu được ghi trong báo cáo bàn giao.
