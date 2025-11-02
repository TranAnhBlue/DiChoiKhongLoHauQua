// Script để thêm events vào Firebase
// Chạy script này trong Node.js hoặc Firebase Functions

const eventsData = [
  {
    title: "Giải Bóng đá Mini FPT Cup 2025",
    description:
      "Giải đấu bóng đá dành cho sinh viên FPT, thể thức 5v5, giải thưởng lên đến 10 triệu đồng",
    category: "Thể thao",
    address: "Sân bóng FPT Arena, Khu Công nghệ cao Hòa Lạc",
    location: {
      lat: 21.0135,
      lng: 105.527,
    },
    geohash: "w7d2qc8y3r",
    organizer: "CLB Bóng đá FPT",
    ticketPrice: "100,000 VND/đội (5 người)",
    imageUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
    startAt: new Date("2025-12-05T08:00:00+07:00"),
    endAt: new Date("2025-12-05T17:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Workshop: Khởi nghiệp công nghệ 2025",
    description:
      "Hội thảo về xu hướng khởi nghiệp, chia sẻ kinh nghiệm từ các founder thành công, networking",
    category: "Workshop",
    address: "Hội trường A, Đại học FPT Hà Nội",
    location: {
      lat: 21.0128,
      lng: 105.5265,
    },
    geohash: "w7d2qc8x9m",
    organizer: "FPT Innovation Hub",
    ticketPrice: "Miễn phí",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    startAt: new Date("2025-11-15T14:00:00+07:00"),
    endAt: new Date("2025-11-15T17:30:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "FPT Music Festival 2025",
    description:
      "Đêm nhạc sôi động với sự góp mặt của các ban nhạc sinh viên và nghệ sĩ khách mời",
    category: "Âm nhạc",
    address: "Sân khấu ngoài trời, Đại học FPT",
    location: {
      lat: 21.012,
      lng: 105.5255,
    },
    geohash: "w7d2qc8wvh",
    organizer: "CLB Âm nhạc FPT",
    ticketPrice: "50,000 VND",
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    startAt: new Date("2025-12-20T18:00:00+07:00"),
    endAt: new Date("2025-12-20T22:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Hội chợ Ẩm thực Đường phố",
    description:
      "Khám phá các món ăn đường phố từ khắp 3 miền, giá sinh viên, nhiều ưu đãi",
    category: "Ẩm thực",
    address: "Khu vực Food Court, FPT University",
    location: {
      lat: 21.0118,
      lng: 105.5262,
    },
    geohash: "w7d2qc8x2p",
    organizer: "Ban Văn hóa FPT",
    ticketPrice: "Miễn phí vào cửa",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    startAt: new Date("2025-11-25T10:00:00+07:00"),
    endAt: new Date("2025-11-25T20:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "FPT Gaming Tournament - PUBG Mobile",
    description:
      "Giải đấu PUBG Mobile quy mô lớn, phần thưởng giá trị, stream trực tiếp",
    category: "Gaming/Esports",
    address: "Phòng Esports Lab, Tòa nhà Alpha",
    location: {
      lat: 21.0132,
      lng: 105.5268,
    },
    geohash: "w7d2qc8y1k",
    organizer: "FPT Esports Club",
    ticketPrice: "150,000 VND/đội (4 người)",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    startAt: new Date("2025-11-20T09:00:00+07:00"),
    endAt: new Date("2025-11-20T18:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Meetup: AI & Machine Learning cho Beginners",
    description:
      "Gặp gỡ, trao đổi kinh nghiệm học AI/ML, demo projects, networking",
    category: "Meetup",
    address: "Phòng Lab 301, Tòa Beta",
    location: {
      lat: 21.0125,
      lng: 105.5258,
    },
    geohash: "w7d2qc8x5n",
    organizer: "FPT AI Community",
    ticketPrice: "Miễn phí",
    imageUrl:
      "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800",
    startAt: new Date("2025-11-18T19:00:00+07:00"),
    endAt: new Date("2025-11-18T21:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Halloween Party 2025 - Đêm hội ma quái",
    description:
      "Đêm tiệc Halloween hoành tráng với trang phục hóa trang, game show, DJ, quà tặng",
    category: "Party",
    address: "Nhà hát FPT Arena",
    location: {
      lat: 21.0115,
      lng: 105.525,
    },
    geohash: "w7d2qc8wsk",
    organizer: "Ban Truyền thông FPT",
    ticketPrice: "80,000 VND",
    imageUrl:
      "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800",
    startAt: new Date("2025-10-31T19:00:00+07:00"),
    endAt: new Date("2025-10-31T23:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Triển lãm Văn hóa Việt Nam",
    description:
      "Trưng bày các hiện vật, trang phục truyền thống, workshop làm đồ thủ công",
    category: "Văn hóa",
    address: "Thư viện FPT, Tầng 2",
    location: {
      lat: 21.0122,
      lng: 105.526,
    },
    geohash: "w7d2qc8x3q",
    organizer: "CLB Văn hóa Việt",
    ticketPrice: "Miễn phí",
    imageUrl:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
    startAt: new Date("2025-12-01T08:00:00+07:00"),
    endAt: new Date("2025-12-07T17:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Study Group: Luyện thi IELTS 7.0+",
    description:
      "Nhóm học IELTS, chia sẻ tài liệu, luyện speaking, writing mỗi tuần",
    category: "Học tập",
    address: "Phòng học C202",
    location: {
      lat: 21.013,
      lng: 105.5263,
    },
    geohash: "w7d2qc8x8p",
    organizer: "FPT English Club",
    ticketPrice: "Miễn phí",
    imageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    startAt: new Date("2025-11-10T18:00:00+07:00"),
    endAt: new Date("2025-11-10T20:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Chương trình từ thiện: Chia sẻ yêu thương",
    description:
      "Quyên góp sách vở, quần áo, học bổng cho học sinh vùng cao, tình nguyện viên được ưu tiên",
    category: "Từ thiện",
    address: "Sảnh chính, Tòa nhà Alpha",
    location: {
      lat: 21.0127,
      lng: 105.5267,
    },
    geohash: "w7d2qc8x9n",
    organizer: "Đoàn Thanh niên FPT",
    ticketPrice: "Miễn phí",
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
    startAt: new Date("2025-11-22T08:00:00+07:00"),
    endAt: new Date("2025-11-22T17:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Giải Cầu lông FPT Open",
    description:
      "Giải đấu cầu lông đơn và đôi, tất cả trình độ, có giải khuyến khích",
    category: "Thể thao",
    address: "Nhà thi đấu FPT Sports Center",
    location: {
      lat: 21.0138,
      lng: 105.5272,
    },
    geohash: "w7d2qc8y5r",
    organizer: "CLB Cầu lông FPT",
    ticketPrice: "60,000 VND/người",
    imageUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
    startAt: new Date("2025-12-10T07:00:00+07:00"),
    endAt: new Date("2025-12-10T12:00:00+07:00"),
    createdAt: new Date(),
  },
  {
    title: "Workshop: Thiết kế UI/UX với Figma",
    description:
      "Học thiết kế giao diện từ cơ bản đến nâng cao, thực hành project thực tế",
    category: "Workshop",
    address: "Phòng Design Lab 405",
    location: {
      lat: 21.0123,
      lng: 105.5261,
    },
    geohash: "w7d2qc8x4m",
    organizer: "FPT Design Club",
    ticketPrice: "50,000 VND",
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    startAt: new Date("2025-11-28T14:00:00+07:00"),
    endAt: new Date("2025-11-28T17:00:00+07:00"),
    createdAt: new Date(),
  },
];

// Hàm để thêm events vào Firebase
async function addEventsToFirebase() {
  const { initializeApp } = require("firebase/app");
  const {
    getFirestore,
    collection,
    addDoc,
    Timestamp,
  } = require("firebase/firestore");
  const { geohashForLocation } = require("geofire-common");

  const firebaseConfig = {
    apiKey: "AIzaSyBTdLMPR96jQtx6qvoxm2fwrmvFSJnM84E",
    authDomain: "event-finder-app-3331f.firebaseapp.com",
    projectId: "event-finder-app-3331f",
    storageBucket: "event-finder-app-3331f.appspot.com",
    messagingSenderId: "902831259261",
    appId: "1:902831259261:android:9f46331ec4a07c479bfb14",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const event of eventsData) {
    try {
      // Tính toán lại geohash để đảm bảo chính xác
      const geohash = geohashForLocation([
        event.location.lat,
        event.location.lng,
      ]);

      const docData = {
        title: event.title,
        description: event.description,
        category: event.category,
        address: event.address,
        location: event.location,
        geohash: geohash,
        organizer: event.organizer,
        ticketPrice: event.ticketPrice,
        imageUrl: event.imageUrl,
        startAt: Timestamp.fromDate(event.startAt),
        endAt: Timestamp.fromDate(event.endAt),
        createdAt: Timestamp.fromDate(event.createdAt),
        type: "event",
      };

      const docRef = await addDoc(collection(db, "events"), docData);
      console.log(`✅ Đã thêm: ${event.title} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Lỗi khi thêm ${event.title}:`, error);
    }
  }

  console.log("\n🎉 Hoàn thành việc thêm events!");
}

// Gọi hàm
addEventsToFirebase();
