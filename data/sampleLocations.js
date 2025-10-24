// data/sampleLocations.js
// Script để đẩy dữ liệu mẫu lên Firebase

import { createEvent } from "../services/events";
import {
  createLocation,
  EVENT_CATEGORIES,
  LOCATION_CATEGORIES,
} from "../services/locations";

// ===== LOCATIONS DATA (Địa điểm cố định ở Hà Nội) =====
export const SAMPLE_LOCATIONS = [
  // QUÁN CAFE
  {
    name: "The Coffee House - Hoàn Kiếm",
    description:
      "Quán cafe hiện đại, view hồ Gươm, phù hợp làm việc và học tập",
    category: LOCATION_CATEGORIES.CAFE,
    latitude: 21.0285,
    longitude: 105.8542,
    address: "22 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    phone: "0243 933 9090",
    website: "https://thecoffeehouse.com",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    amenities: ["WiFi miễn phí", "Ổ cắm điện", "Điều hòa", "Nhạc nhẹ"],
    openingHours: {
      monday: "7:00-22:00",
      tuesday: "7:00-22:00",
      wednesday: "7:00-22:00",
      thursday: "7:00-22:00",
      friday: "7:00-23:00",
      saturday: "7:00-23:00",
      sunday: "8:00-22:00",
    },
    rating: 4.5,
    priceRange: "$$",
  },
  {
    name: "Cộng Cà Phê - Đinh Tiên Hoàng",
    description:
      "Không gian vintage, đậm chất Sài Gòn xưa, thích hợp chụp hình",
    category: LOCATION_CATEGORIES.CAFE,
    latitude: 21.0245,
    longitude: 105.8523,
    address: "28 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    phone: "024 3933 1858",
    imageUrl: "https://images.unsplash.com/photo-1559496417-e7f25c7e7daf?w=800",
    amenities: ["WiFi", "Không gian yên tĩnh", "Món ngon"],
    rating: 4.7,
    priceRange: "$",
  },

  // WORKSHOP / COWORKING
  {
    name: "Toong - Coworking Space",
    description:
      "Không gian làm việc chung hiện đại, sự kiện networking thường xuyên",
    category: LOCATION_CATEGORIES.WORKSHOP,
    latitude: 21.031,
    longitude: 105.847,
    address: "Tầng 5, 1 Lương Yên, Hai Bà Trưng, Hà Nội",
    phone: "024 7309 9988",
    website: "https://toong.vn",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    amenities: [
      "Phòng họp",
      "WiFi cao tốc",
      "Cafe miễn phí",
      "Sự kiện hàng tuần",
    ],
    openingHours: {
      monday: "8:00-20:00",
      tuesday: "8:00-20:00",
      wednesday: "8:00-20:00",
      thursday: "8:00-20:00",
      friday: "8:00-20:00",
      saturday: "9:00-18:00",
      sunday: "Đóng cửa",
    },
    rating: 4.8,
    priceRange: "$$$",
  },

  // KHU VUI CHƠI
  {
    name: "Lotte Cinema - Tràng Tiền",
    description: "Rạp chiếu phim hiện đại, công nghệ âm thanh đỉnh cao",
    category: LOCATION_CATEGORIES.ENTERTAINMENT,
    latitude: 21.024,
    longitude: 105.853,
    address: "24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội",
    phone: "024 3938 5777",
    website: "https://lottecinemavn.com",
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    amenities: ["4DX", "IMAX", "Đồ ăn"],
    rating: 4.6,
    priceRange: "$$",
  },
  {
    name: "TimesCity Bowling",
    description: "Sân bowling 24 làn, karaoke, trò chơi điện tử",
    category: LOCATION_CATEGORIES.ENTERTAINMENT,
    latitude: 21.0,
    longitude: 105.8653,
    address: "TimesCity, 458 Minh Khai, Hai Bà Trưng",
    phone: "024 3200 1234",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    amenities: ["Bowling", "Karaoke", "Game zone"],
    rating: 4.3,
    priceRange: "$$",
  },

  // QUÁN BIDA
  {
    name: "Billiard Hoàng Gia",
    description: "Bida cao cấp, bàn chuẩn quốc tế, không gian sang trọng",
    category: LOCATION_CATEGORIES.BILLIARDS,
    latitude: 21.032,
    longitude: 105.842,
    address: "88 Láng Hạ, Ba Đình, Hà Nội",
    phone: "024 3514 8888",
    imageUrl:
      "https://images.unsplash.com/photo-1626968361222-291e74711449?w=800",
    amenities: ["Bàn Pool", "Bàn Carom", "Đồ uống", "Điều hòa"],
    openingHours: {
      monday: "9:00-24:00",
      tuesday: "9:00-24:00",
      wednesday: "9:00-24:00",
      thursday: "9:00-24:00",
      friday: "9:00-02:00",
      saturday: "9:00-02:00",
      sunday: "9:00-24:00",
    },
    rating: 4.5,
    priceRange: "$$",
  },

  // QUÁN NET
  {
    name: "Cyber Gaming - Royal City",
    description: "Phòng net máy khủng, cấu hình cao, giá sinh viên",
    category: LOCATION_CATEGORIES.INTERNET_CAFE,
    latitude: 21.0025,
    longitude: 105.8225,
    address: "Tầng B1, Royal City, 72A Nguyễn Trãi, Thanh Xuân",
    phone: "024 3555 9999",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    amenities: ["RTX 4090", "Màn hình 240Hz", "Ghế gaming", "Đồ ăn nhanh"],
    openingHours: {
      monday: "24/7",
      tuesday: "24/7",
      wednesday: "24/7",
      thursday: "24/7",
      friday: "24/7",
      saturday: "24/7",
      sunday: "24/7",
    },
    rating: 4.7,
    priceRange: "$",
  },

  // QUÁN GAME / PES
  {
    name: "G-Station Pro Gaming",
    description: "Chuyên PES, FIFA, PS5, tổ chức giải đấu hàng tuần",
    category: LOCATION_CATEGORIES.GAMING,
    latitude: 21.0378,
    longitude: 105.852,
    address: "45 Nguyễn Lương Bằng, Đống Đa, Hà Nội",
    phone: "098 765 4321",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    amenities: ["PS5", "Xbox Series X", "TV 4K", "Giải đấu cuối tuần"],
    openingHours: {
      monday: "10:00-24:00",
      tuesday: "10:00-24:00",
      wednesday: "10:00-24:00",
      thursday: "10:00-24:00",
      friday: "10:00-02:00",
      saturday: "10:00-02:00",
      sunday: "10:00-24:00",
    },
    rating: 4.9,
    priceRange: "$$",
  },

  // BAR / PUB
  {
    name: "Polite & Co.",
    description: "Bar chill, cocktail ngon, live music cuối tuần",
    category: LOCATION_CATEGORIES.BAR,
    latitude: 21.0338,
    longitude: 105.8488,
    address: "5 Bảo Khánh, Hoàn Kiếm, Hà Nội",
    phone: "024 3935 2569",
    imageUrl:
      "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",
    amenities: ["Live music", "Cocktail bar", "Rooftop"],
    openingHours: {
      monday: "17:00-01:00",
      tuesday: "17:00-01:00",
      wednesday: "17:00-01:00",
      thursday: "17:00-02:00",
      friday: "17:00-03:00",
      saturday: "17:00-03:00",
      sunday: "17:00-01:00",
    },
    rating: 4.6,
    priceRange: "$$$",
  },

  // NHÀ HÀNG / ĂN UỐNG
  {
    name: "Nhà Hàng Món Huế - Nguyễn Du",
    description: "Ẩm thực Huế chính gốc, giá sinh viên, phục vụ nhanh",
    category: LOCATION_CATEGORIES.RESTAURANT,
    latitude: 21.0195,
    longitude: 105.8475,
    address: "18 Nguyễn Du, Hai Bà Trưng, Hà Nội",
    phone: "024 3974 3838",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    amenities: ["Bún bò Huế", "Nem lụi", "Không gian rộng"],
    rating: 4.4,
    priceRange: "$",
  },
];

// ===== EVENTS DATA (Sự kiện tạm thời) =====
export const SAMPLE_EVENTS = [
  {
    title: "Hội chợ Ẩm thực Nhật Bản",
    description:
      "Thưởng thức món ăn Nhật chính gốc: sushi, ramen, takoyaki tại Crescent Mall",
    category: EVENT_CATEGORIES.FOOD,
    latitude: 10.7302,
    longitude: 106.7215,
    address: "Crescent Mall, Q.7, TP.HCM",
    startAt: new Date("2025-10-25T17:00:00"),
    endAt: new Date("2025-10-27T22:00:00"),
    imageUrl:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
    organizer: "Japan Foundation",
    ticketPrice: "Miễn phí",
  },
  {
    title: "Workshop: Làm website với React",
    description:
      "Học React cơ bản, build ứng dụng thực tế cùng mentor từ Google",
    category: EVENT_CATEGORIES.WORKSHOP,
    latitude: 21.031,
    longitude: 105.847,
    address: "Toong Coworking, Lương Yên, Hà Nội",
    startAt: new Date("2025-10-26T14:00:00"),
    endAt: new Date("2025-10-26T17:00:00"),
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    organizer: "Google Developer Groups Hanoi",
    ticketPrice: "100,000 VND",
  },
  {
    title: "Giải đấu PES 2024 - Cúp Mùa Thu",
    description: "Thi đấu PES chuyên nghiệp, giải thưởng 20 triệu đồng",
    category: EVENT_CATEGORIES.GAMING,
    latitude: 21.0378,
    longitude: 105.852,
    address: "G-Station Pro Gaming, Nguyễn Lương Bằng",
    startAt: new Date("2025-10-27T09:00:00"),
    endAt: new Date("2025-10-27T18:00:00"),
    imageUrl:
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800",
    organizer: "G-Station",
    ticketPrice: "50,000 VND (phí dự thi)",
  },
  {
    title: "Live Music: Indie Rock Night",
    description: "Đêm nhạc indie với 3 ban nhạc: The Flickers, Ngọt, Chillies",
    category: EVENT_CATEGORIES.MUSIC,
    latitude: 21.0338,
    longitude: 105.8488,
    address: "Polite & Co., Bảo Khánh, Hà Nội",
    startAt: new Date("2025-10-25T20:00:00"),
    endAt: new Date("2025-10-25T23:30:00"),
    imageUrl:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
    organizer: "Polite & Co.",
    ticketPrice: "150,000 VND",
  },
  {
    title: "Meetup: GenZ Startup Community",
    description:
      "Gặp gỡ các founder trẻ, networking, chia sẻ kinh nghiệm khởi nghiệp",
    category: EVENT_CATEGORIES.MEETUP,
    latitude: 21.0285,
    longitude: 105.8542,
    address: "The Coffee House, Lý Thường Kiệt",
    startAt: new Date("2025-10-26T18:00:00"),
    endAt: new Date("2025-10-26T21:00:00"),
    imageUrl:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
    organizer: "Startup Hanoi",
    ticketPrice: "Miễn phí",
  },
  {
    title: "Giải Bowling Sinh viên Hà Nội",
    description:
      "Thi đấu bowling đồng đội, giải thưởng hấp dẫn, kết bạn bốn phương",
    category: EVENT_CATEGORIES.SPORTS,
    latitude: 21.0,
    longitude: 105.8653,
    address: "TimesCity Bowling, Minh Khai",
    startAt: new Date("2025-10-28T13:00:00"),
    endAt: new Date("2025-10-28T17:00:00"),
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    organizer: "Hội Sinh viên Hà Nội",
    ticketPrice: "80,000 VND/đội (4 người)",
  },
];

// ===== SCRIPT ĐẨY DỮ LIỆU LÊN FIREBASE =====
export async function uploadSampleData() {
  console.log("🚀 Bắt đầu upload dữ liệu mẫu...");

  try {
    // Upload locations
    console.log("📍 Đang upload locations...");
    for (const loc of SAMPLE_LOCATIONS) {
      const id = await createLocation(loc);
      console.log(`✅ Location created: ${loc.name} (${id})`);
    }

    // Upload events
    console.log("📅 Đang upload events...");
    for (const evt of SAMPLE_EVENTS) {
      const id = await createEvent(evt);
      console.log(`✅ Event created: ${evt.title} (${id})`);
    }

    console.log("🎉 Upload hoàn tất!");
    console.log(`- Đã upload ${SAMPLE_LOCATIONS.length} locations`);
    console.log(`- Đã upload ${SAMPLE_EVENTS.length} events`);
  } catch (error) {
    console.error("❌ Lỗi upload:", error);
  }
}

// Chạy script này để upload (uncomment dòng dưới)
uploadSampleData();
