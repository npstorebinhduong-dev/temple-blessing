# Artwork của Ganesha LIVE

Ba asset bổ sung cho bản 0.9, tạo bằng image generation ngày 02/11/2026, tham chiếu artwork Ganesha/nhân vật của chính dự án:

- `mushika.png`: Mushika nhìn nghiêng sang trái, trang sức vàng/đỏ, nền alpha.
- `whisper-poses.png`: atlas 4 × 2; hàng trên nữ, hàng dưới nam; đứng, nghiêng, ghé tai, wai. Không gian alpha giữa các ô, không tải lại mỗi lượt.
- `ganesha-apparition.png`: Ganesha bốn tay, lotus, búa, mâm Modak và bàn tay trước ban phước. Renderer tạo hai lớp thân/tay ở bộ nhớ để diễn hoạt; file gốc giữ nguyên.

Đây là hình minh họa nghi thức nghệ thuật trong ứng dụng; không phải asset hay icon chính thức của TikTok. Icon quà Galaxy và tình trạng xác minh được ghi trong `docs/QUA-MOI.md`.

Nhạc và font giữ giấy phép riêng trong `music/LICENSE.txt`, `fonts/LICENSE.txt`.

## Bổ sung 0.10

`ganesha-standing.png` được tạo mới bằng image generation ngày 02/11/2026, tham chiếu phong cách artwork của dự án: Ganesha đứng hoàn chỉnh, hai chân/bàn chân, bốn tay, bàn tay ban phước, vương miện, vòi, áo đỏ/vàng, PNG alpha. Không kéo giãn hoặc ghép đứng ảnh ngồi. Renderer tách tay trong bộ nhớ, dùng mask hiện từ chân lên đầu; PNG gốc không chỉnh. Asset `ganesha-apparition.png` của 0.9 được giữ làm lịch sử, không còn được overlay nạp.

Đám đông dùng phần đầu/cổ/vai từ hai atlas nhân vật đi/quỳ hiện có, tạo tám sprite dùng lại trong bộ nhớ. Cơ thể các hàng trước che tự nhiên hàng sau; không tải ảnh đại diện TikTok. Mushika dùng cùng hình gốc với phần đầu được tách ở runtime để ngẩng nhẹ. Dải sáng, mandala, sen, quầng sáng, hạt/cánh hoa được vẽ bằng engine hiện có.

Icon Corgi và Galaxy dùng URL TikTok đúng trong hai danh mục công khai; tham khảo `docs/QUA-MOI.md`. Artwork của ứng dụng không thay cho icon TikTok.
