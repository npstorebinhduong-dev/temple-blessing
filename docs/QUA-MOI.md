# Quà 299 / 1.000 xu — kết quả đối chiếu ngày 02/11/2026

Không truy cập được Google trong môi trường cloud (proxy trả HTTP 403). Đã đọc các danh sách công khai trên GitHub; không chạy mã trong các kho bên ngoài.

## Galaxy / Thiên hà — 1.000 xu

Hai nguồn ghi cùng **giftId 11046**, giá **1.000**, cùng URL icon:

- [WaGi-Coding/tiktok-gift-ids, bản lưu 07/08/2026](https://github.com/WaGi-Coding/tiktok-gift-ids/blob/d402f8673e53e3b73204dd3bfe1bf82b625749a5/gift-ids.json#L2121): `Galaxy`, `id: 11046`, `coins: 1000`.
- [kkkaoru/tiktok-gift-list-per-regison, dữ liệu LIVE Nhật 22/10/2026](https://github.com/kkkaoru/tiktok-gift-list-per-regison/blob/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/live/signed-in.json): `銀河`, `giftId: "11046"`, `coins: 1000`. [Giải thích cách thu thập](https://github.com/kkkaoru/tiktok-gift-list-per-regison/blob/53a95d05e952a421d072f6da2148e044f9b30e87/results/2026-10-22/README.md).

Icon từ dữ liệu: `https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp`.

Đây là **đối chiếu dữ liệu công khai**, chưa phải xác nhận quà hiện có trên tài khoản/phiên LIVE Thái của chủ dự án. Không có tên Thái chính thức trong các nguồn đã đọc. Bản 0.9 nhận ID 11046 + đúng 1.000 xu; có ô thay ID.

## “Bạn đồng hành” — 299 xu

**Chưa xác minh được giftId, tên Thái và icon.** Có nhiều quà 299 xu trong nguồn công khai (Corgi, Fruit Friends, Music Mate, v.v.); không thể suy ra món nào là “Bạn đồng hành” từ giá hoặc bản dịch tên. Không gắn bất kỳ món nào trong số đó vào nghi thức Mushika mặc định.

Trong bảng điều khiển → **Hai quà mới**, điền ID thật khi thấy trong nhật ký, tên từ danh mục TikTok Thái và URL icon nếu có. Ô ID để trống nghĩa là nghi thức 299 chỉ dùng được bằng nút DEMO hoặc ID được người vận hành gắn trong phần nâng cao (`ID=mushika`).

## Hiển thị và tự nhận metadata

- Trong DEMO, hai mục mới có thể dùng **tên nghi thức tiếng Thái**, không trình bày chúng là tên chính thức của quà TikTok.
- Trong LIVE, chỉ hiện mục mới trên bảng quà khi đã có tên quà Thái và ID. Nếu một sự kiện LIVE có ID đã khớp và tên chứa tiếng Thái, ứng dụng tự điền tên còn trống/icon từ sự kiện đó. Không ghi đè tên người vận hành đã nhập.
- Icon Galaxy dùng URL thật ở trên; trình duyệt tải một lần và ẩn nếu lỗi. Mushika không có icon TikTok giả. Hai hình nghi thức mới là artwork của ứng dụng, không phải icon quà.
- Mỗi ID vẫn phải khớp **giá của một món**. Combo 3 × 1.000 vẫn là Galaxy, không đổi thành quà 3.000 xu. Một combo đã kết thúc = một lượt có nhãn ×3. Các sự kiện kết thúc khác nhau giữ các lượt riêng theo FIFO.
