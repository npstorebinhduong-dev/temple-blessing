# Ganesha LIVE · พระพิฆเนศ

Cảnh livestream tương tác 1080 × 1920 dành cho người xem Thái: Ganesha ở trung tâm, nhân vật áo trắng/vàng đi vào và quỳ, bảng tên, xếp hạng, mục tiêu và bốn hiệu ứng dâng lễ. Bảng điều khiển bằng tiếng Việt cho người vận hành.

## Chạy bản đầu

Cài **Node.js 24 trở lên**. Trên Windows, giải nén toàn bộ gói và chạy `CHAY-LIVE.bat`. Hướng dẫn thao tác đầy đủ trong [HUONG-DAN-WINDOWS.txt](HUONG-DAN-WINDOWS.txt).

Hoặc từ thư mục dự án:

```sh
cd live
npm ci --no-audit --no-fund
npm start
```

Bảng điều khiển: `http://localhost:3000/live/control.html`.
Nguồn Browser Source cho OBS: `http://localhost:3000/live/overlay.html`, rộng **1080**, cao **1920**. Với LIVE Studio, dùng nguồn trình duyệt nếu có; hoặc chụp cửa sổ overlay và thu âm thanh của trình duyệt. Tắt tiếng các cửa sổ overlay dư để không phát âm thanh hai lần.

Ứng dụng khởi động ở **DEMO** với 24 nhân vật. Dùng các nút quà hoặc chạy mô phỏng để kiểm tra. Bản xem trước trong bảng điều khiển luôn tắt tiếng. Cửa sổ overlay có nút mở âm thanh nếu trình duyệt chặn tự phát.

## Kết nối thật

1. Mở TikFinity Desktop trên **cùng máy** chạy Ganesha LIVE.
2. Kết nối TikFinity với kênh đang LIVE và bật WebSocket server.
3. Chọn TikFinity Desktop, dùng địa chỉ nó cung cấp (thường `ws://127.0.0.1:21213/`), bấm **Kết nối LIVE**.
4. Ứng dụng đổi sang dữ liệu LIVE riêng, bỏ nhân vật demo khỏi màn hình. Bình luận tạo nhân vật; quà kích hoạt hiệu ứng và cộng xu. Lượt thích tạo tim; lượt theo dõi tạo điểm sáng. Có thể bật cho người vừa vào phòng xuất hiện.
5. Thử một bình luận và một quà thật. “Đã kết nối nguồn” chỉ xác nhận kết nối tới TikFinity, chưa xác nhận kênh đang phát sự kiện.

TikFinity tự kết nối lại sau 2 giây khi mất socket. Chế độ TikTok trực tiếp là lựa chọn thử nghiệm, phụ thuộc thư viện và dịch vụ bên ngoài; cần kết nối lại thủ công khi bị ngắt. Không nhập hoặc lưu cookie, mật khẩu TikTok trong ứng dụng.

## Quy tắc quà

| Giá trị **một quà** | Hiệu ứng |
| --- | --- |
| 1–9 xu | `lotus` · ถวายดอกบัว |
| 10–99 xu | `incense` · ถวายกำยาน |
| 100–499 xu | `garland` · ถวายพวงมาลัย |
| Từ 500 xu | `aarti` · อารตีบูชา |

Đây là cấu hình mặc định của sản phẩm, không phải bảng giá quà TikTok tại Thái. Combo 500 hoa hồng 1 xu vẫn tạo **hoa sen**, cộng đủ 500 xu. Nhận diện combo bằng `giftType`, `repeatEnd`, `repeatCount`; các gói cùng `msgId` được lọc trùng trong 5 phút. Không có `msgId` thì không thể đảm bảo chống phát lại. Bộ nhớ chống trùng không giữ qua lần khởi động server mới.

Để gắn một quà cụ thể, lấy ID từ nhật ký rồi vào **Cảnh & âm thanh → Ánh xạ ID quà thật**. Ví dụ cú pháp `123456=garland` (ID minh họa). Ánh xạ ID được ưu tiên trước mức xu; đổi tên/ngôn ngữ quà không ảnh hưởng. Bấm **Lưu cấu hình** để áp dụng.

Hàng đợi hình ảnh có tối đa 8 mục chờ, gộp các mục cùng người/cùng loại đang chờ và bỏ hiệu ứng chờ quá 40 giây; khi đầy, bỏ hiệu ứng chờ cũ nhất. **Điểm quà luôn được tính độc lập**, kể cả khi không phát lại mọi hiệu ứng trong đợt quà dồn dập.

## Dữ liệu và âm thanh

- Demo và LIVE có nhân vật, điểm và bảng xếp hạng riêng. Các nút thử quà bị khóa trong chế độ LIVE.
- Cấu hình và số liệu LIVE được lưu tại `live/data/session.json`; không đưa file này lên Git hay chia sẻ trong gói phát hành. Có thể đổi thư mục bằng `GANESHA_DATA_DIR`.
- Khi khởi động lại, chọn **Xem phiên LIVE đã lưu** hoặc kết nối nguồn để phục hồi điểm. Kết nối nguồn và âm thanh phải khởi động lại. Nhân vật quay lại khi có sự kiện mới; bảng xếp hạng đã lưu vẫn còn.
- **Dọn nhân vật** giữ nguyên điểm. **Bắt đầu phiên mới** xóa số liệu của chế độ đang chọn và chỉ cho phép khi đã ngắt nguồn.
- Cảnh hiện tối đa 60 người; khi đầy, nhân vật ít tương tác lâu nhất nhường vị trí. Điểm và bảng xếp hạng của họ được giữ.
- Hình ảnh, font Thái, âm nền nhẹ và chuông chạy cục bộ. Âm nền được tổng hợp bằng Web Audio, không sử dụng nhạc của concept trước.
- Giọng cảm ơn tiếng Thái dùng Edge TTS, **mặc định tắt**, cần Internet tới `speech.platform.bing.com`. Chọn Premwadee hoặc Niwat, bật giọng và thử trước khi phát. Có giới hạn hàng đợi/timeout; lỗi giọng không chặn quà.

## Kiểm thử và giới hạn bản 0.1

```sh
cd live
npm test
```

Bộ kiểm thử dùng TikFinity giả lập để kiểm tra combo, ánh xạ ID, reconnect, demo/LIVE, giới hạn nhân vật, lưu/khôi phục phiên và HTTP/WebSocket cục bộ. Không chứng minh tương thích phiên bản TikFinity trên máy người dùng hoặc giọng Edge TTS qua Internet.

Bộ hình mới và sprite 8 tư thế tạo bằng AI. Đây là bản 2.5D đầu tiên, chưa khớp mọi chuyển động/hiệu ứng của video tham chiếu. Nội dung tiếng Thái và âm thanh cần được nghe/đọc duyệt trong lần chạy thử. Kiểm tra hiệu năng với OBS/LIVE Studio đang encode trên máy phát thực tế.

Các bước kiểm tra trước LIVE trong [TEST-LIVE.md](TEST-LIVE.md).

## Nguồn

Nền kết nối và các nguyên lý tương tác phát triển từ `kentjuno/chanh-dien-online`, theo MIT. Giữ nguyên [LICENSE](LICENSE) và thông tin [UPSTREAM.md](UPSTREAM.md). Concept và giao diện hiện tại đã chuyển sang Ganesha. Font Noto có giấy phép đi kèm trong `assets/ganesha/fonts/LICENSE.txt`.
