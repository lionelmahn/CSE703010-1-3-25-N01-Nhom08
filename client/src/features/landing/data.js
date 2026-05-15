/**
 * Mock data cho Landing Page public.
 * Khi backend UC6.1 sẵn sàng có thể thay thế các mảng này bằng
 * dữ liệu thực qua axios trong từng component cha.
 */

export const NAV_LINKS = [
  { id: 'trang-chu', label: 'Trang chủ' },
  { id: 'dich-vu', label: 'Dịch vụ' },
  { id: 've-chung-toi', label: 'Về chúng tôi' },
  { id: 'bac-si', label: 'Bác sĩ' },
  { id: 'bang-gia', label: 'Bảng giá' },
];

export const HERO_STATS = [
  { value: '5000+', label: 'Khách hàng tin tưởng' },
  { value: '15+', label: 'Năm kinh nghiệm' },
  { value: '20+', label: 'Bác sĩ chuyên khoa' },
  { value: '99%', label: 'Đánh giá 5 sao' },
];

export const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'general', label: 'Nha khoa tổng quát' },
  { id: 'cosmetic', label: 'Nha khoa thẩm mỹ' },
  { id: 'restoration', label: 'Phục hình răng' },
];

export const FEATURED_SERVICE = {
  icon: '🦷',
  title: 'Cấy Ghép Implant',
  description:
    'Giải pháp khôi phục răng mất hoàn hảo nhất, bền chắc trọn đời, ăn nhai như răng thật. Sử dụng trụ Implant nhập khẩu chính hãng.',
  cta: 'Tìm hiểu thêm',
};

export const SERVICES = [
  {
    id: 'veneer',
    icon: '✨',
    title: 'Bọc răng sứ thẩm mỹ',
    description:
      'Mang lại nụ cười đều đẹp, trắng sáng tự nhiên với các dòng sứ cao cấp, không đen viền nướu.',
    category: 'cosmetic',
  },
  {
    id: 'braces',
    icon: '😁',
    title: 'Niềng răng (Chỉnh nha)',
    description:
      'Khắc phục hô, móm, thưa, lệch lạc. Đa dạng phương pháp: mắc cài kim loại, sứ, khay trong suốt Invisalign.',
    category: 'cosmetic',
  },
  {
    id: 'whitening',
    icon: '🪄',
    title: 'Tẩy trắng răng',
    description:
      'Công nghệ tẩy trắng Laser hiện đại, an toàn, không ê buốt, bật 3-5 tone ngay sau 45 phút.',
    category: 'cosmetic',
  },
  {
    id: 'wisdom-tooth',
    icon: '🩺',
    title: 'Nhổ răng khôn (Piezotome)',
    description:
      'Sử dụng máy siêu âm Piezotome cắt đứt dây chằng nhổ răng nhẹ nhàng, nhanh lành thương.',
    category: 'general',
  },
];

export const PROCESS_HIGHLIGHTS = [
  {
    icon: '🏆',
    title: 'Đội ngũ chuyên gia',
    description: '100% Bác sĩ tốt nghiệp RHM, tu nghiệp chuyên sâu.',
  },
  {
    icon: '🔬',
    title: 'Công nghệ hiện đại',
    description: 'Trang bị máy CT Conebeam 3D, Scan iTero, Labo tại chỗ.',
  },
  {
    icon: '🛡️',
    title: 'Vô trùng tuyệt đối',
    description:
      'Phòng nha vô trùng chuẩn Sở Y Tế, mỗi KH một bộ dụng cụ riêng.',
  },
  {
    icon: '🤝',
    title: 'Chăm sóc tận tâm',
    description: 'Minh bạch chi phí, bảo hành dài hạn, hỗ trợ 24/7.',
  },
];

export const ABOUT_HIGHLIGHTS = [
  'Cơ sở vật chất khang trang, không gian thư giãn.',
  'Vật liệu nha khoa chính hãng 100% (Mỹ, Đức, Thuỵ Sĩ).',
  'Hợp đồng chỉnh nha, cấy ghép rõ ràng pháp lý.',
];

export const DOCTORS = [
  {
    id: 'huy',
    name: 'BS. Trần Quang Huy',
    role: 'Trưởng khoa Implant',
    image:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'minh-anh',
    name: 'BS. Nguyễn Minh Anh',
    role: 'Chuyên gia Chỉnh nha',
    image:
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'nam',
    name: 'BS. Phạm Hoàng Nam',
    role: 'Bác sĩ Phục hình sứ',
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&auto=format&fit=crop',
  },
];

export const PRICING_PLANS = [
  {
    id: 'basic',
    title: 'Khám tổng quát',
    price: '150.000đ',
    unit: '/lần',
    features: [
      { text: 'Khám tư vấn cùng Bác sĩ', included: true },
      { text: 'Chụp X-Quang Panorama', included: true },
      { text: 'Lên phác đồ điều trị', included: true },
      { text: 'Cạo vôi răng', included: false },
    ],
    cta: 'Đặt hẹn khám',
    highlight: false,
  },
  {
    id: 'veneer-package',
    title: 'Gói Răng Sứ Thẩm Mỹ',
    price: '2.500.000đ',
    originalPrice: '3.000.000đ',
    unit: '/răng',
    features: [
      { text: 'Miễn phí khám & tư vấn', included: true },
      { text: 'Sứ Cercon HT chính hãng', included: true },
      { text: 'Thiết kế nụ cười 3D Smile', included: true },
      { text: 'Bảo hành thẻ hãng 10 năm', included: true },
    ],
    cta: 'Nhận ưu đãi',
    badge: 'Phổ biến nhất',
    highlight: true,
  },
  {
    id: 'implant',
    title: 'Trồng Răng Implant',
    price: '8.000.000đ',
    prefix: 'Từ',
    unit: '/trụ',
    features: [
      { text: 'Trụ Hàn Quốc / Mỹ / Thuỵ Sĩ', included: true },
      { text: 'Miễn phí chụp CT Conebeam', included: true },
      { text: 'Tặng răng sứ Titan trên Implant', included: true },
      { text: 'Bảo hành trọn đời', included: true },
    ],
    cta: 'Nhận tư vấn',
    highlight: false,
  },
];

export const TESTIMONIALS = [
  {
    id: 't1',
    rating: 5,
    quote:
      'Mình niềng răng ở đây được 2 năm và mới tháo niềng tuần trước. Bác sĩ Huy rất nhẹ nhàng, mát tay, phòng khám sạch sẽ. Rất hài lòng với nụ cười hiện tại!',
    author: 'Thu Hương',
    role: 'Khách hàng Chỉnh nha',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    id: 't2',
    rating: 5,
    quote:
      'Đưa bố đến trồng Implant, lúc đầu cụ sợ đau nhưng làm xong cụ bảo êm ru. Giờ cụ ăn nhai ngon lành, khen bác sĩ suốt. Cảm ơn phòng khám rất nhiều.',
    author: 'Hoàng Nam',
    role: 'Người nhà KH Implant',
    avatar: 'https://i.pravatar.cc/100?img=11',
  },
  {
    id: 't3',
    rating: 5,
    quote:
      'Dịch vụ bọc sứ cực kỳ chuyên nghiệp. Form răng thiết kế đẹp, màu sắc tự nhiên đúng ý mình. Làm xong ai cũng khen trẻ ra mấy tuổi.',
    author: 'Mai Anh',
    role: 'Khách hàng Răng sứ',
    avatar: 'https://i.pravatar.cc/100?img=9',
  },
];

export const BEFORE_AFTER_CASES = [
  {
    id: 'braces-ceramic',
    title: 'Chỉnh nha mắc cài sứ',
    image:
      'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'veneer-16',
    title: 'Bọc 16 răng sứ Cercon',
    image:
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=800&auto=format&fit=crop',
  },
];

export const FAQS = [
  {
    id: 'pain',
    question: 'Niềng răng có đau không?',
    answer:
      'Trong khoảng 3-5 ngày đầu sau khi gắn mắc cài hoặc thay khay bạn có thể hơi ê răng nhẹ, đây là phản ứng bình thường khi răng dịch chuyển. Bác sĩ sẽ kê thuốc giảm đau và hướng dẫn chế độ ăn mềm để bạn thấy thoải mái nhất.',
  },
  {
    id: 'wisdom',
    question: 'Nhổ răng khôn bao lâu thì lành?',
    answer:
      'Với công nghệ máy siêu âm Piezotome, nhổ răng khôn diễn ra rất nhanh chóng và ít tổn thương mô mềm. Thông thường bạn sẽ hơi ê nhẹ trong 1-2 ngày đầu và vết thương sẽ hoàn toàn lành lặn sau 7-10 ngày.',
    open: true,
  },
  {
    id: 'veneer',
    question: 'Răng sứ có bền không? Sử dụng được bao lâu?',
    answer:
      'Tuỳ loại sứ và cách chăm sóc, răng sứ thẩm mỹ có tuổi thọ trung bình 7-20 năm. Sứ cao cấp như Cercon, Lava Plus có thể duy trì trên 15 năm khi vệ sinh đúng cách và khám định kỳ.',
  },
  {
    id: 'installment',
    question: 'Có hỗ trợ trả góp không?',
    answer:
      'Có. Chúng tôi hỗ trợ trả góp 0% qua các ngân hàng đối tác cho gói niềng răng và Implant. Vui lòng liên hệ tư vấn viên để được hướng dẫn thủ tục cụ thể.',
  },
];

export const CLINIC_CONTACT = {
  address: '123 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
  hotline: '0398224130',
  socials: [
    { name: 'Facebook', label: 'f', href: '#', accent: 'hover:bg-blue-600 hover:border-blue-600' },
    { name: 'Youtube', label: '▶', href: '#', accent: 'hover:bg-red-600 hover:border-red-600' },
    { name: 'LinkedIn', label: 'in', href: '#', accent: 'hover:bg-blue-400 hover:border-blue-400' },
  ],
};

export const BOOKING_SERVICE_OPTIONS = [
  'Khám tổng quát',
  'Niềng răng',
  'Bọc răng sứ',
  'Trồng răng Implant',
];

export const FOOTER_LINKS = [
  { label: 'Về chúng tôi', href: '#ve-chung-toi' },
  { label: 'Bảng giá', href: '#bang-gia' },
  { label: 'Tuyển dụng', href: '#' },
  { label: 'Chính sách bảo mật', href: '#' },
];
