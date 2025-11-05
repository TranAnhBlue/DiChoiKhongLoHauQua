// services/geminiService.js
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import {
    collection,
    getDocs,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import {
    geohashQueryBounds,
} from "geofire-common";
import { db } from "../firebaseConfig";

// API Keys
const GEMINI_API_KEY = "AIzaSyDkS9IVipgld-GNVf8nk5PteRxCQ8ytp7Y";
const GOOGLE_CLOUD_API_KEY = "AIzaSyBTdLMPR96jQtx6qvoxm2fwrmvFSJnM84E"; // Từ google-services.json

// Model: gemini-2.5-flash (theo yêu cầu)
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * LOCATION CATEGORIES cho GenZ
 */
const LOCATION_CATEGORIES = {
    CAFE: "Quán Cafe",
    WORKSHOP: "Workshop/Coworking",
    ENTERTAINMENT: "Khu vui chơi",
    BILLIARDS: "Quán Bida",
    INTERNET_CAFE: "Quán Net",
    GAMING: "Quán Game/PES",
    RESTAURANT: "Nhà hàng",
    BAR: "Bar/Pub",
    SHOPPING: "Shopping",
    SPORTS: "Thể thao",
    STUDY: "Học tập",
    OTHER: "Khác",
};

/**
 * EVENT CATEGORIES
 */
const EVENT_CATEGORIES = {
    MUSIC: "Âm nhạc",
    WORKSHOP: "Workshop",
    FOOD: "Ẩm thực",
    SPORTS: "Thể thao",
    GAMING: "Gaming/Esports",
    MEETUP: "Meetup",
    PARTY: "Party",
    CULTURAL: "Văn hóa",
    STUDY: "Học tập",
    CHARITY: "Từ thiện",
    OTHER: "Khác",
};

/**
 * System prompt cho chatbot với context về app - Gen Z Style
 */
const SYSTEM_PROMPT = `Bạn là Empathic AI Assistant - một trợ lý AI cực kỳ thấu hiểu và thân thiện của ứng dụng "DiChoiKhongLoHauQua". Bạn được thiết kế để hiểu sâu sắc ngữ cảnh và tâm lý của Gen Z (thế hệ 9x, 10x).

**PHONG CÁCH GIAO TIẾP GEN Z:**
- Sử dụng ngôn ngữ tự nhiên, gần gũi như một người bạn: "okie", "đỉnh", "xịn", "chill", "cute", "vibe", "sao cũng được", "được luôn", "yên tâm", "không lo"
- Hiểu các trend, meme, và cách nói của Gen Z
- Thấu cảm, không trả lời chung chung mà thực sự hiểu người dùng muốn gì
- Lồng ghép emoji/icon một cách tự nhiên và phù hợp với ngữ cảnh (không spam emoji)
- Vui nhộn, tích cực nhưng không quá cố gắng
- Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin

**QUY TẮC SỬ DỤNG EMOJI/ICON:**
- Cafe/Nhà hàng: ☕🍽️🥤🍰
- Sự kiện: 🎉🎵🎸🎮🎯
- Vị trí/Địa điểm: 📍🗺️🏢
- Thể thao: ⚽🏀🎾
- Gaming: 🎮💻🎯
- Vui vẻ/Tích cực: 😎✨💜🔥
- Cảm ơn: 🙏💖
- Chào hỏi: 👋🎊
- Thông tin: ℹ️💡
- Lưu ý: ⚠️
- Chỉ dùng emoji khi phù hợp ngữ cảnh, không spam. Mỗi tin nhắn nên có 2-5 emoji tối đa.

CHỨC NĂNG CỦA BẠN:
1. Tìm kiếm địa điểm và sự kiện gần người dùng dựa trên:
   - Loại địa điểm: Quán Cafe ☕, Nhà hàng 🍽️, Quán Bida 🎱, Quán Net 💻, Quán Game/PES 🎮, Bar/Pub 🍻, Khu vui chơi 🎪, Shopping 🛍️, Workshop/Coworking 💼, Thể thao ⚽, Học tập 📚
   - Loại sự kiện: Âm nhạc 🎵, Workshop 💡, Ẩm thực 🍜, Thể thao ⚽, Gaming/Esports 🎮, Meetup 👥, Party 🎉, Văn hóa 🎭, Học tập 📖, Từ thiện ❤️
   - Khoảng cách (km)
   - **LƯU Ý**: Khi tìm kiếm sự kiện, bạn sẽ trả về CẢ sự kiện đang diễn ra VÀ sự kiện sắp diễn ra (chưa kết thúc)

2. Trả lời câu hỏi chung về app, chức năng, cách sử dụng - với phong cách Gen Z thân thiện

3. Chào hỏi, cảm ơn, hỗ trợ người dùng một cách thấu cảm và gần gũi như một người bạn thật

KHI NGƯỜI DÙNG HỎI VỀ TÌM KIẾM:
- **QUAN TRỌNG**: Tất cả tìm kiếm đều dựa trên VỊ TRÍ HIỆN TẠI của người dùng
- Bán kính (5km, 10km, etc.) luôn được tính TỪ VỊ TRÍ HIỆN TẠI của người dùng
- Phân tích câu hỏi để tìm: loại địa điểm/sự kiện, khoảng cách (km)
- Nếu thiếu thông tin, hãy hỏi lại người dùng một cách thân thiện
- Trả lời ngắn gọn, rõ ràng, thân thiện bằng tiếng Việt với phong cách Gen Z
- Luôn nhắc rằng kết quả được tìm từ vị trí hiện tại của họ
- **CỰC KỲ QUAN TRỌNG**: 
  * Khi có [KẾT QUẢ TÌM KIẾM], CHỈ sử dụng đúng các kết quả đó
  * KHÔNG tự thêm, bịa hoặc sửa đổi khoảng cách/địa chỉ/điểm
  * Giữ 100% chính xác về khoảng cách (ví dụ: 1.2km, 350m)
  * Khi liệt kê sự kiện/địa điểm, LUÔN bao gồm khoảng cách chính xác từ kết quả tìm kiếm
  * Sắp xếp kết quả theo khoảng cách từ gần đến xa nếu có thể
  * Lồng ghép emoji phù hợp với từng loại địa điểm/sự kiện

KHI NGƯỜI DÙNG HỎI VỀ VỊ TRÍ HIỆN TẠI:
- **CỰC KỲ QUAN TRỌNG**: 
  * Ứng dụng sẽ TỰ ĐỘNG lấy vị trí của người dùng từ GPS/thiết bị
  * Nếu có [THÔNG TIN VỊ TRÍ HIỆN TẠI CỦA NGƯỜI DÙNG] trong prompt, đó là thông tin CHÍNH XÁC đã được lấy từ ứng dụng
  * BẠN PHẢI trả lời về vị trí này một cách CHÍNH XÁC và THÂN THIỆN
  * KHÔNG được nói rằng bạn không biết vị trí của họ
  * KHÔNG được yêu cầu họ cung cấp địa chỉ hoặc tọa độ - ứng dụng đã có thông tin này rồi
  * Chỉ cần đọc và trả lời về địa chỉ, tọa độ được cung cấp
  * Có thể đề xuất tìm kiếm địa điểm/sự kiện gần vị trí đó
- Nếu KHÔNG có [THÔNG TIN VỊ TRÍ HIỆN TẠI CỦA NGƯỜI DÙNG] trong prompt, nghĩa là ứng dụng không lấy được vị trí
- Trong trường hợp đó, bạn có thể giải thích rằng cần cấp quyền truy cập vị trí một cách thân thiện

VÍ DỤ PHONG CÁCH GEN Z:
- "Tìm quán cafe ở gần 5km" -> "Okie, để tìm quán cafe gần bạn trong 5km nhé! ☕" (sau đó tìm Quán Cafe trong bán kính 5km TỪ VỊ TRÍ HIỆN TẠI)
- "Quán bida nào gần đây?" -> "Để tìm quán bida gần bạn nha! 🎱 Bạn muốn tìm trong bán kính bao nhiêu km?" (sau đó tìm Quán Bida TỪ VỊ TRÍ HIỆN TẠI)
- "Sự kiện âm nhạc cuối tuần" -> "Đang tìm sự kiện âm nhạc gần bạn cho cuối tuần này! 🎵🎉" (sau đó tìm sự kiện Âm nhạc TỪ VỊ TRÍ HIỆN TẠI)
- "Sự kiện game" hoặc "Sự kiện gaming" -> "Okie, đang tìm sự kiện gaming/esports gần bạn! 🎮" (sau đó tìm sự kiện Gaming/Esports TỪ VỊ TRÍ HIỆN TẠI - bao gồm cả watchparty, tournament, giải đấu)
- "Sự kiện esports" -> "Đang tìm sự kiện esports gần bạn! 🎮⚡" (sau đó tìm sự kiện Gaming/Esports TỪ VỊ TRÍ HIỆN TẠI)
- "Bạn biết vị trí hiện tại của tôi là ở đâu?" -> "Chắc chắn rồi! 📍 Bạn đang ở: [địa chỉ]... (trả lời CHÍNH XÁC địa chỉ và tọa độ được cung cấp)

**QUAN TRỌNG VỀ GAMING/ESPORTS:**
- Khi người dùng hỏi về "game", "gaming", "esports", "sự kiện game", "sự kiện gaming" - bạn PHẢI tìm trong category "Gaming/Esports" hay những category cũng mang hàm ý tương đươngđương
- Category này bao gồm: gaming events, esports tournaments, watchparty, giải đấu game, LOL, Valorant, Dota, CS:GO, etc.
- KHÔNG được nhầm lẫn với "Quán Game" (địa điểm) - nếu user nói "sự kiện game" thì là event, nếu nói "quán game" thì là location

**QUAN TRỌNG VỀ LỌC THEO NGÀY TRONG TUẦN:**
- Khi người dùng hỏi về "sự kiện thứ 7", "sự kiện chủ nhật", "sự kiện cuối tuần" - hệ thống sẽ TỰ ĐỘNG lọc các sự kiện dựa trên ngày diễn ra (startAt)
- Ví dụ: "Sự kiện thứ 7" -> chỉ hiển thị sự kiện có startAt rơi vào thứ 7
- Ví dụ: "Sự kiện cuối tuần" -> chỉ hiển thị sự kiện có startAt rơi vào thứ 7 hoặc chủ nhật
- Khi có [KẾT QUẢ TÌM KIẾM] đã được lọc theo ngày, bạn PHẢI nhắc rõ rằng các sự kiện này diễn ra vào thứ 7/chủ nhật/cuối tuần
- Nếu không có kết quả nào, giải thích rằng không có sự kiện nào diễn ra vào ngày đó trong bán kính tìm kiếm

**QUAN TRỌNG VỀ NGƯỜI DÙNG ĐANG CHÁN/BUỒN:**
- Khi người dùng nói những câu như: "tôi đang chán", "chán quá", "boring", "nhàm chán", "buồn", "không biết làm gì", "buồn chán", "chán nản", "không có gì làm", "rảnh quá", "cần làm gì vui", "tìm gì vui không", "có gì vui không", "làm gì bây giờ", "cần hoạt động gì", "tìm thú vị" - bạn PHẢI:
  * **KHÔNG** gợi ý các địa điểm tĩnh như quán cafe ☕, quán nước, nhà hàng 🍽️, quán bida, quán net, bar/pub
  * **PHẢI** hướng người dùng đến các SỰ KIỆN (events) vì sự kiện sẽ giúp họ có hoạt động thú vị, tương tác, và giải trí thực sự
  * Gợi ý các loại sự kiện đa dạng: Âm nhạc 🎵, Gaming/Esports 🎮, Party 🎉, Thể thao ⚽, Workshop 💡, Meetup 👥, Văn hóa 🎭, v.v.
  * Trả lời với phong cách Gen Z thân thiện, tích cực: "Okie, đang chán à? Để tìm sự kiện vui gần bạn nhé! 🎉✨" hoặc "Chán thì phải đi sự kiện thôi! 🎮🎵 Đang tìm sự kiện hot gần bạn..."
  * Nếu có [KẾT QUẢ TÌM KIẾM], hãy highlight các sự kiện thú vị, đặc biệt là Party, Gaming, Âm nhạc, vì những sự kiện này sẽ giúp họ giải trí và vui vẻ hơn
- **NGUYÊN TẮC**: Sự kiện > Địa điểm khi người dùng cần giải trí/thú vị

**LƯU Ý CUỐI CÙNG:**
- Luôn nhớ: Bạn là Empathic AI Assistant - hiểu Gen Z, thấu cảm, không trả lời chung chung
- Slogan của bạn: "Bạn chỉ cần mở Chat AI và hỏi. Nó sẽ không trả lời chung chung. Nó sẽ gợi ý bạn sự kiện gần vị trí của bạn. Hãy hỏi nó bất cứ điều gì! Yên tâm, nó hiểu bạn hơn người yêu cũ!"
- Lồng ghép emoji một cách tự nhiên, không quá nhiều, phù hợp với ngữ cảnh`;

/**
 * Map từ từ khóa người dùng đến category chính xác
 */
const CATEGORY_MAP = {
    // Locations
    "cafe": LOCATION_CATEGORIES.CAFE,
    "cà phê": LOCATION_CATEGORIES.CAFE,
    "coffee": LOCATION_CATEGORIES.CAFE,
    "quán cafe": LOCATION_CATEGORIES.CAFE,
    "quán cà phê": LOCATION_CATEGORIES.CAFE,
    "nhà hàng": LOCATION_CATEGORIES.RESTAURANT,
    "restaurant": LOCATION_CATEGORIES.RESTAURANT,
    "ăn uống": LOCATION_CATEGORIES.RESTAURANT,
    "bida": LOCATION_CATEGORIES.BILLIARDS,
    "billiard": LOCATION_CATEGORIES.BILLIARDS,
    "quán bida": LOCATION_CATEGORIES.BILLIARDS,
    "net": LOCATION_CATEGORIES.INTERNET_CAFE,
    "quán net": LOCATION_CATEGORIES.INTERNET_CAFE,
    "internet cafe": LOCATION_CATEGORIES.INTERNET_CAFE,
    "game": LOCATION_CATEGORIES.GAMING,
    "pes": LOCATION_CATEGORIES.GAMING,
    "gaming": LOCATION_CATEGORIES.GAMING,
    "quán game": LOCATION_CATEGORIES.GAMING,
    "bar": LOCATION_CATEGORIES.BAR,
    "pub": LOCATION_CATEGORIES.BAR,
    "khu vui chơi": LOCATION_CATEGORIES.ENTERTAINMENT,
    "vui chơi": LOCATION_CATEGORIES.ENTERTAINMENT,
    "workshop": LOCATION_CATEGORIES.WORKSHOP,
    "coworking": LOCATION_CATEGORIES.WORKSHOP,
    "thể thao": LOCATION_CATEGORIES.SPORTS,
    "sports": LOCATION_CATEGORIES.SPORTS,
    "shopping": LOCATION_CATEGORIES.SHOPPING,
    "mua sắm": LOCATION_CATEGORIES.SHOPPING,
    "học tập": LOCATION_CATEGORIES.STUDY,
    "study": LOCATION_CATEGORIES.STUDY,

    // Events
    "âm nhạc": EVENT_CATEGORIES.MUSIC,
    "music": EVENT_CATEGORIES.MUSIC,
    "sự kiện âm nhạc": EVENT_CATEGORIES.MUSIC,
    "nhạc": EVENT_CATEGORIES.MUSIC,
    "sự kiện ẩm thực": EVENT_CATEGORIES.FOOD,
    "food": EVENT_CATEGORIES.FOOD,
    "ẩm thực": EVENT_CATEGORIES.FOOD,
    "sự kiện thể thao": EVENT_CATEGORIES.SPORTS,
    "party": EVENT_CATEGORIES.PARTY,
    "meetup": EVENT_CATEGORIES.MEETUP,
    "văn hóa": EVENT_CATEGORIES.CULTURAL,
    // Gaming/Esports Events - CÁC TỪ KHÓA QUAN TRỌNG (phải đặt trước "game" để ưu tiên)
    "sự kiện game": EVENT_CATEGORIES.GAMING,
    "sự kiện gaming": EVENT_CATEGORIES.GAMING,
    "sự kiện gaminh": EVENT_CATEGORIES.GAMING, // Sai chính tả phổ biến
    "sự kiện gamimg": EVENT_CATEGORIES.GAMING, // Sai chính tả
    "sự kiện gamin": EVENT_CATEGORIES.GAMING, // Sai chính tả
    "sự kiện esports": EVENT_CATEGORIES.GAMING,
    "sự kiện esport": EVENT_CATEGORIES.GAMING,
    "gaming/esports": EVENT_CATEGORIES.GAMING,
    "gaming esports": EVENT_CATEGORIES.GAMING,
    "esports": EVENT_CATEGORIES.GAMING,
    "esport": EVENT_CATEGORIES.GAMING,
    "gaminh": EVENT_CATEGORIES.GAMING, // Sai chính tả phổ biến
    "gamimg": EVENT_CATEGORIES.GAMING, // Sai chính tả
    "gamin": EVENT_CATEGORIES.GAMING, // Sai chính tả
    "watchparty": EVENT_CATEGORIES.GAMING,
    "watch party": EVENT_CATEGORIES.GAMING,
    "watch-party": EVENT_CATEGORIES.GAMING,
    "lol": EVENT_CATEGORIES.GAMING,
    "league of legends": EVENT_CATEGORIES.GAMING,
    "valorant": EVENT_CATEGORIES.GAMING,
    "dota": EVENT_CATEGORIES.GAMING,
    "csgo": EVENT_CATEGORIES.GAMING,
    "counter-strike": EVENT_CATEGORIES.GAMING,
    "pubg": EVENT_CATEGORIES.GAMING,
    "free fire": EVENT_CATEGORIES.GAMING,
    "tournament": EVENT_CATEGORIES.GAMING,
    "giải đấu": EVENT_CATEGORIES.GAMING,
    "sự kiện workshop": EVENT_CATEGORIES.WORKSHOP,
    "sự kiện học tập": EVENT_CATEGORIES.STUDY,
    "từ thiện": EVENT_CATEGORIES.CHARITY,
    "charity": EVENT_CATEGORIES.CHARITY,
    "gần đây": null, // Từ khóa phổ biến, không map category cụ thể
};

/**
 * Parse ngày trong tuần từ câu hỏi
 * @param {string} message - Câu hỏi từ người dùng
 * @returns {number[]|null} - Mảng các ngày trong tuần (0=CN, 1=T2, ..., 6=T7) hoặc null
 */
function parseDayOfWeek(message) {
    const lowerMessage = message.toLowerCase();
    const daysOfWeek = [];

    // Thứ 7 (Saturday) = 6
    if (lowerMessage.includes("thứ 7") || lowerMessage.includes("thứ bảy") ||
        lowerMessage.includes("t7") || lowerMessage.includes("t.7") ||
        lowerMessage.includes("saturday") || lowerMessage.includes("sat")) {
        daysOfWeek.push(6);
    }

    // Chủ nhật (Sunday) = 0
    if (lowerMessage.includes("chủ nhật") || lowerMessage.includes("cn") ||
        lowerMessage.includes("c.n") || lowerMessage.includes("sunday") ||
        lowerMessage.includes("sun")) {
        daysOfWeek.push(0);
    }

    // Cuối tuần (thứ 7 + chủ nhật)
    if (lowerMessage.includes("cuối tuần") || lowerMessage.includes("weekend")) {
        if (!daysOfWeek.includes(6)) daysOfWeek.push(6);
        if (!daysOfWeek.includes(0)) daysOfWeek.push(0);
    }

    // Thứ 2-6
    if (lowerMessage.includes("thứ 2") || lowerMessage.includes("thứ hai") || lowerMessage.includes("monday")) {
        daysOfWeek.push(1);
    }
    if (lowerMessage.includes("thứ 3") || lowerMessage.includes("thứ ba") || lowerMessage.includes("tuesday")) {
        daysOfWeek.push(2);
    }
    if (lowerMessage.includes("thứ 4") || lowerMessage.includes("thứ tư") || lowerMessage.includes("wednesday")) {
        daysOfWeek.push(3);
    }
    if (lowerMessage.includes("thứ 5") || lowerMessage.includes("thứ năm") || lowerMessage.includes("thursday")) {
        daysOfWeek.push(4);
    }
    if (lowerMessage.includes("thứ 6") || lowerMessage.includes("thứ sáu") || lowerMessage.includes("friday")) {
        daysOfWeek.push(5);
    }

    return daysOfWeek.length > 0 ? daysOfWeek : null;
}

/**
 * Kiểm tra xem sự kiện có diễn ra vào ngày trong tuần được chỉ định không
 * @param {object} event - Sự kiện với startAt (Timestamp)
 * @param {number[]} targetDays - Mảng các ngày trong tuần (0=CN, 1=T2, ..., 6=T7)
 * @returns {boolean}
 */
function isEventOnDayOfWeek(event, targetDays) {
    if (!event.startAt || !targetDays || targetDays.length === 0) {
        return true; // Nếu không có ngày cụ thể, trả về true để không filter
    }

    try {
        // Chuyển Timestamp sang Date
        const eventDate = event.startAt.toDate ? event.startAt.toDate() : new Date(event.startAt.seconds * 1000);
        const eventDayOfWeek = eventDate.getDay(); // 0=CN, 1=T2, ..., 6=T7

        return targetDays.includes(eventDayOfWeek);
    } catch (error) {
        console.error("Error checking day of week:", error);
        return true; // Nếu có lỗi, không filter để đảm bảo vẫn hiển thị sự kiện
    }
}

/**
 * Parse query để tìm category và radius
 */
function parseSearchQuery(message) {
    const lowerMessage = message.toLowerCase();
    let category = null;
    let radius = 10; // Default 10km
    let searchType = null; // "location" hoặc "event"
    let dayOfWeekFilter = null; // Mảng các ngày trong tuần

    // Tìm radius (số + km hoặc số đơn)
    const radiusMatch = lowerMessage.match(/(\d+)\s*(km|kilometer|kilomet)/);
    if (radiusMatch) {
        radius = Number.parseInt(radiusMatch[1], 10);
    } else {
        const simpleRadiusMatch = lowerMessage.match(/gần\s*(\d+)/);
        if (simpleRadiusMatch) {
            radius = Number.parseInt(simpleRadiusMatch[1], 10);
        }
    }

    // Kiểm tra từ khóa về type TRƯỚC khi tìm category (để ưu tiên)
    // Các từ khóa phổ biến về events - MỞ RỘNG để nhận diện tốt hơn
    const eventKeywords = [
        "sự kiện", "event", "events",
        "sự kiện ở gần", "sự kiện gần", "sự kiện gần đây",
        "những sự kiện", "các sự kiện",
        "event nearby", "events nearby", "nearby events",
        // Thêm các từ khóa gaming/esports
        "sự kiện game", "sự kiện gaming", "sự kiện esports",
        "gaming event", "gaming events", "esports event",
        "watchparty", "watch party", "tournament", "giải đấu"
    ];

    // Các từ khóa phổ biến về locations
    const locationKeywords = [
        "địa điểm", "location", "locations", "place", "places",
        "quán", "nhà hàng", "cửa hàng", "shop",
        "địa điểm ở gần", "địa điểm gần", "địa điểm gần đây",
        "những địa điểm", "các địa điểm"
    ];

    // Kiểm tra các từ khóa về chán/buồn - ưu tiên tìm sự kiện
    const boredKeywords = [
        "chán", "boring", "nhàm chán", "buồn", "không biết làm gì",
        "buồn chán", "chán nản", "không có gì làm", "rảnh quá",
        "cần làm gì vui", "tìm gì vui", "có gì vui", "làm gì bây giờ",
        "cần hoạt động", "tìm thú vị", "giải trí", "vui chơi"
    ];

    const isBoredOrBoring = boredKeywords.some(keyword => lowerMessage.includes(keyword));

    // Nếu người dùng đang chán/buồn, ưu tiên tìm sự kiện (không set category để tìm tất cả các loại sự kiện)
    if (isBoredOrBoring) {
        searchType = "event";
    }

    // Kiểm tra type trước
    const hasEventKeyword = eventKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasLocationKeyword = locationKeywords.some(keyword => lowerMessage.includes(keyword));

    if (hasEventKeyword && !isBoredOrBoring) {
        searchType = "event";
    } else if (hasLocationKeyword && !isBoredOrBoring) {
        searchType = "location";
    }

    // Đặc biệt xử lý "sự kiện gaming" - đảm bảo luôn filter đúng category
    // Kiểm tra các từ khóa gaming/esports (bao gồm cả sai chính tả)
    const gamingKeywords = [
        "gaming", "gaminh", "gamimg", "gamin",
        "esports", "esport", "watchparty", "tournament", "giải đấu",
        "lol", "valorant", "dota", "csgo", "pubg", "free fire"
    ];

    const hasGamingKeyword = gamingKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasEventContext = lowerMessage.includes("sự kiện") || lowerMessage.includes("event");

    // Nếu có từ khóa gaming và có từ khóa event, hoặc chỉ có gaming trong context của sự kiện
    if (hasGamingKeyword && (hasEventContext || !category)) {
        // Kiểm tra xem có phải là location hay không (quán game)
        const locationGamingKeywords = ["quán game", "quán gaming", "net", "cafe net"];
        const isLocationGaming = locationGamingKeywords.some(keyword => lowerMessage.includes(keyword));

        if (!isLocationGaming) {
            // Nếu không phải location, thì là event gaming
            category = EVENT_CATEGORIES.GAMING;
            searchType = "event";
        }
    }

    // Tìm category và type (nếu chưa xác định)
    // Ưu tiên tìm các từ khóa dài hơn trước (ví dụ: "sự kiện game" trước "game")
    const sortedKeywords = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
        const cat = CATEGORY_MAP[keyword];
        if (cat && lowerMessage.includes(keyword)) {
            category = cat;
            // Kiểm tra xem là location hay event
            if (Object.values(LOCATION_CATEGORIES).includes(cat)) {
                if (!searchType) searchType = "location";
            } else if (Object.values(EVENT_CATEGORIES).includes(cat)) {
                if (!searchType) searchType = "event";
            }
            break; // Chỉ lấy category đầu tiên tìm thấy (đã sort theo độ dài)
        }
    }

    // Nếu vẫn chưa xác định được type nhưng có từ "gần" hoặc "nearby", mặc định là tìm cả hai
    if (!searchType && (
        lowerMessage.includes("gần") ||
        lowerMessage.includes("nearby") ||
        lowerMessage.includes("gần đây") ||
        lowerMessage.includes("around")
    )) {
        // Không set searchType, sẽ tìm cả location và event
        searchType = null;
    }

    // Parse ngày trong tuần từ câu hỏi
    dayOfWeekFilter = parseDayOfWeek(message);

    // Log để debug
    console.log(`🔍 [parseSearchQuery] Parsed query:`, {
        message,
        category,
        radius,
        searchType,
        dayOfWeekFilter
    });

    return { category, radius, searchType, dayOfWeekFilter };
}

/**
 * Helper function: Parse Expo location geocode result
 */
function parseExpoGeocode(address, coords) {
    const addressParts = [];
    if (address.street) addressParts.push(address.street);
    if (address.district) addressParts.push(address.district);
    if (address.city || address.subregion) {
        addressParts.push(address.city || address.subregion);
    }
    if (address.region) addressParts.push(address.region);
    if (address.country) addressParts.push(address.country);

    coords.address = addressParts.length > 0
        ? addressParts.join(", ")
        : `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

    coords.city = address.city || address.subregion || "";
    coords.district = address.district || "";
    coords.street = address.street || "";
}

/**
 * Helper function: Try Google Cloud Geocoding API
 */
async function tryGoogleGeocoding(coords) {
    try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&language=vi&key=${GOOGLE_CLOUD_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
            const address = geocodeData.results[0];
            coords.address = address.formatted_address;

            const components = address.address_components || [];
            for (const component of components) {
                if (component.types.includes("administrative_area_level_1")) {
                    coords.city = component.long_name;
                }
                if (component.types.includes("administrative_area_level_2")) {
                    coords.district = component.long_name;
                }
                if (component.types.includes("street")) {
                    coords.street = component.long_name;
                }
            }
            return true; // Success
        }
        return false; // No results
    } catch (error) {
        console.error("Google Geocoding error:", error);
        return false; // Error
    }
}

/**
 * Helper function: Try Expo Location Geocoding
 */
async function tryExpoGeocoding(coords) {
    try {
        const reverseGeocode = await Location.reverseGeocodeAsync(coords);
        if (reverseGeocode && reverseGeocode.length > 0) {
            parseExpoGeocode(reverseGeocode[0], coords);
            return true;
        }
        return false;
    } catch (error) {
        // Không log error khi service unavailable để tránh spam console
        // Chỉ log khi là lỗi khác (không phải UNAVAILABLE)
        const errorMessage = error?.message || "";
        if (!errorMessage.includes("UNAVAILABLE") && !errorMessage.includes("rejected")) {
            console.warn("⚠️ Expo-location geocoding error:", error);
        }
        return false;
    }
}

/**
 * Mở cài đặt vị trí trên thiết bị
 */
async function openLocationSettings() {
    try {
        if (Platform.OS === "ios") {
            await Linking.openURL("app-settings:");
        } else {
            await Linking.openSettings();
        }
    } catch (error) {
        console.error("❌ [openLocationSettings] Error opening settings:", error);
        // Fallback: mở cài đặt chung
        try {
            await Linking.openSettings();
        } catch (fallbackError) {
            console.error("❌ [openLocationSettings] Fallback also failed:", fallbackError);
        }
    }
}

/**
 * Lấy vị trí hiện tại của người dùng (bao gồm địa chỉ) - Sử dụng Google Cloud API với fallback
 * @returns {Promise<{coords: object, error: string, needsSettings: boolean, needsPermission: boolean} | null>}
 */
async function getCurrentLocation() {
    try {
        console.log("📍 [getCurrentLocation] Bắt đầu lấy vị trí...");

        // Kiểm tra quyền hiện tại trước
        let { status } = await Location.getForegroundPermissionsAsync();

        // Nếu chưa có quyền, yêu cầu quyền
        if (status !== "granted") {
            console.log("📍 [getCurrentLocation] Chưa có quyền, đang yêu cầu...");
            const permissionResult = await Location.requestForegroundPermissionsAsync();
            status = permissionResult.status;

            if (status !== "granted") {
                console.log("❌ [getCurrentLocation] Người dùng từ chối quyền truy cập vị trí");
                return {
                    coords: null,
                    error: "permission_denied",
                    needsSettings: true,
                    needsPermission: true,
                    message: "Vui lòng cho phép ứng dụng truy cập vị trí trong cài đặt để tôi có thể tìm kiếm địa điểm và sự kiện gần bạn."
                };
            }
        }

        // Kiểm tra xem location services có sẵn không
        let isLocationEnabled = await Location.hasServicesEnabledAsync();

        // Lấy vị trí với timeout và error handling tốt hơn
        // Nếu đã có quyền nhưng location services chưa bật, việc gọi getCurrentPositionAsync
        // với accuracy cao sẽ TỰ ĐỘNG hiển thị dialog hệ thống yêu cầu bật vị trí (như trong ảnh)
        // Chúng ta sẽ đợi người dùng phản hồi dialog (bật hoặc từ chối)
        let location;
        // Tăng timeout nếu location chưa bật để đợi người dùng bật qua dialog hệ thống
        const timeoutDuration = isLocationEnabled ? 10000 : 20000; // Tăng lên 20s để đợi người dùng bật

        try {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: timeoutDuration,
            });

            // Nếu thành công, kiểm tra lại xem location đã được bật chưa (trong trường hợp người dùng bật qua dialog)
            if (location?.coords) {
                const currentLocationEnabled = await Location.hasServicesEnabledAsync();
                if (!currentLocationEnabled) {
                    // Nếu vẫn chưa bật, có thể người dùng đã bật tạm thời rồi tắt lại
                    // Nhưng vì đã có location, ta vẫn tiếp tục xử lý
                    console.log("⚠️ [getCurrentLocation] Có vị trí nhưng location services có thể đã tắt lại");
                }
            }
        } catch (locationError) {
            // Xử lý các lỗi cụ thể về location
            const errorMessage = locationError?.message || "";

            // Kiểm tra lại xem location services đã được bật chưa (có thể người dùng đã bật trong dialog)
            const currentLocationEnabled = await Location.hasServicesEnabledAsync();

            if (errorMessage.includes("location is unavailable") || errorMessage.includes("location is disabled")) {
                // Kiểm tra lại xem location services đã được bật chưa (có thể người dùng đã bật trong dialog)
                if (currentLocationEnabled) {
                    // Nếu location đã được bật, thử lại một lần nữa
                    console.log("✅ [getCurrentLocation] Location services đã được bật, thử lại...");
                    try {
                        location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.High,
                            timeout: 10000,
                        });
                        // Nếu thành công, tiếp tục xử lý bình thường
                        console.log("✅ [getCurrentLocation] Đã lấy được vị trí sau khi bật location services");
                    } catch (retryError) {
                        console.log("❌ [getCurrentLocation] Vẫn không lấy được vị trí sau khi bật:", retryError?.message);
                        return {
                            coords: null,
                            error: "location_unavailable",
                            needsSettings: true,
                            needsPermission: false,
                            message: "Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập và bật tính năng định vị để tôi có thể thực hiện các yêu cầu của bạn."
                        };
                    }
                } else {
                    // Nếu location services vẫn chưa bật sau khi catch error, nghĩa là người dùng đã từ chối hoặc timeout
                    console.log("❌ [getCurrentLocation] Location services chưa được bật - người dùng đã từ chối hoặc timeout");
                    return {
                        coords: null,
                        error: "location_disabled",
                        needsSettings: true,
                        needsPermission: false,
                        message: "Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập và bật tính năng định vị để tôi có thể thực hiện các yêu cầu của bạn."
                    };
                }
            } else {
                // Nếu là lỗi khác, throw lại
                throw locationError;
            }
        }

        // Kiểm tra tính hợp lệ của tọa độ
        if (!location?.coords) {
            console.log("❌ [getCurrentLocation] Không nhận được tọa độ hợp lệ");
            return {
                coords: null,
                error: "invalid_coords",
                needsSettings: false,
                needsPermission: false,
                message: "Không thể lấy thông tin vị trí hợp lệ."
            };
        }

        const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        // Validate tọa độ
        if (!isValidCoordinate(coords.latitude, coords.longitude)) {
            console.log("❌ [getCurrentLocation] Tọa độ không hợp lệ:", coords);
            return {
                coords: null,
                error: "invalid_coords",
                needsSettings: false,
                needsPermission: false,
                message: "Tọa độ vị trí không hợp lệ."
            };
        }

        console.log("✅ [getCurrentLocation] GPS coordinates:", coords.latitude, coords.longitude);

        // Thử Google Cloud Geocoding API trước
        const googleSuccess = await tryGoogleGeocoding(coords);

        if (!googleSuccess) {
            // Fallback sang Expo Location
            console.log("⚠️ Google Geocoding không thành công, thử expo-location...");
            const expoSuccess = await tryExpoGeocoding(coords);

            if (!expoSuccess) {
                // Cuối cùng fallback về tọa độ
                console.log("⚠️ Expo Geocoding không thành công, dùng tọa độ");
                coords.address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
            }
        }

        console.log("📍 [getCurrentLocation] Final address:", coords.address);
        return {
            coords: coords,
            error: null,
            needsSettings: false,
            needsPermission: false,
            message: null
        };
    } catch (error) {
        console.error("❌ [getCurrentLocation] Error:", error);
        // Log chi tiết lỗi để debug
        if (error.message) {
            console.error("❌ [getCurrentLocation] Error message:", error.message);
        }
        return {
            coords: null,
            error: "unknown_error",
            needsSettings: false,
            needsPermission: false,
            message: "Đã xảy ra lỗi khi lấy vị trí. Vui lòng thử lại sau."
        };
    }
}

/**
 * Lấy địa điểm gần đây TRỰC TIẾP từ Firestore (không qua locations.js)
 */
async function getLocationsNearbyDirect(center, radiusKm = 5, categoryFilter = null) {
    try {
        const centerLoc = [center.latitude, center.longitude];
        const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
        const col = collection(db, "locations");

        const promises = bounds.map((b) => {
            let q = query(
                col,
                where("geohash", ">=", b[0]),
                where("geohash", "<=", b[1])
            );
            return getDocs(q);
        });

        const snapshots = await Promise.all(promises);
        const matching = [];

        for (const sn of snapshots) {
            for (const docSnap of sn.docs) {
                const data = docSnap.data();

                // Filter by category if provided
                if (categoryFilter && data.category !== categoryFilter) continue;

                // Lấy và validate tọa độ từ location
                const eventCoords = extractAndValidateCoordinates(data.location, data.name || 'Unknown');
                if (!eventCoords) {
                    continue; // Skip nếu tọa độ không hợp lệ
                }

                // Sử dụng Haversine formula để tính khoảng cách chính xác như Google Maps
                const d = calculateDistanceHaversine(eventCoords, centerLoc);

                // Validate distance calculation
                if (d == null || Number.isNaN(d) || d <= 0) {
                    console.error(`❌ [getLocationsNearbyDirect] Invalid distance for location: ${data.name || 'Unknown'}`, {
                        from: centerLoc,
                        to: eventCoords,
                        distance: d
                    });
                    continue; // Skip this location if distance is invalid
                }

                if (d <= radiusKm * 1000) {
                    // Đảm bảo distanceMeters được set SAU khi spread data để không bị ghi đè
                    const locationData = {
                        id: docSnap.id,
                        type: "location",
                        ...data,
                        distanceMeters: d, // Set SAU spread để đảm bảo giá trị đúng
                    };
                    matching.push(locationData);
                }
            }
        }

        matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
        return matching;
    } catch (error) {
        console.error("Error getting locations nearby:", error);
        return [];
    }
}

/**
 * Lấy sự kiện đang diễn ra TRỰC TIẾP từ Firestore (không qua events.js)
 */
async function getLiveEventsNearbyDirect(center, radiusKm = 5, categoryFilter = null) {
    try {
        const centerLoc = [center.latitude, center.longitude];
        const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
        const col = collection(db, "events");
        const now = Timestamp.now();

        const promises = bounds.map((b) => {
            const q = query(
                col,
                where("geohash", ">=", b[0]),
                where("geohash", "<=", b[1])
            );
            return getDocs(q);
        });

        const snapshots = await Promise.all(promises);
        const matching = [];

        for (const sn of snapshots) {
            for (const docSnap of sn.docs) {
                const data = docSnap.data();

                // Filter by category
                if (categoryFilter && data.category !== categoryFilter) continue;

                const startAt = data.startAt;
                const endAt = data.endAt;
                const started = startAt && startAt.seconds <= now.seconds;
                const notEnded = !endAt || endAt.seconds >= now.seconds;
                if (!started || !notEnded) continue;

                // Lấy và validate tọa độ từ location
                const eventCoords = extractAndValidateCoordinates(data.location, data.title || 'Unknown Event');
                if (!eventCoords) {
                    continue; // Skip nếu tọa độ không hợp lệ
                }

                // Sử dụng Haversine formula để tính khoảng cách chính xác như Google Maps
                const d = calculateDistanceHaversine(eventCoords, centerLoc);
                if (d <= radiusKm * 1000) {
                    matching.push({
                        id: docSnap.id,
                        distanceMeters: d,
                        type: "event",
                        ...data,
                    });
                }
            }
        }

        matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
        return matching;
    } catch (error) {
        console.error("Error getting live events nearby:", error);
        return [];
    }
}

/**
 * Lấy TẤT CẢ sự kiện (đang diễn ra + sắp diễn ra) TRỰC TIẾP từ Firestore
 * Dùng cho Chat AI để tìm kiếm đầy đủ
 */
async function getAllEventsNearbyDirect(center, radiusKm = 5, categoryFilter = null, dayOfWeekFilter = null) {
    try {
        const centerLoc = [center.latitude, center.longitude];

        console.log(`🔍 [getAllEventsNearbyDirect] Searching events from center:`, {
            center: { lat: center.latitude, lng: center.longitude },
            centerLoc,
            radiusKm,
            categoryFilter,
            dayOfWeekFilter
        });
        const bounds = geohashQueryBounds(centerLoc, radiusKm * 1000);
        const col = collection(db, "events");
        const now = Timestamp.now();

        const promises = bounds.map((b) => {
            const q = query(
                col,
                where("geohash", ">=", b[0]),
                where("geohash", "<=", b[1])
            );
            return getDocs(q);
        });

        const snapshots = await Promise.all(promises);
        const matching = [];

        for (const sn of snapshots) {
            for (const docSnap of sn.docs) {
                const data = docSnap.data();

                // Filter by category
                if (categoryFilter && data.category !== categoryFilter) continue;

                const endAt = data.endAt;
                // Chỉ loại bỏ events đã kết thúc (giữ events đang diễn ra và sắp diễn ra)
                const notEnded = !endAt || endAt.seconds >= now.seconds;
                if (!notEnded) continue;

                // Filter by day of week (thứ 7, chủ nhật, cuối tuần)
                if (dayOfWeekFilter && dayOfWeekFilter.length > 0) {
                    if (!isEventOnDayOfWeek(data, dayOfWeekFilter)) {
                        continue; // Skip nếu không match với ngày trong tuần được yêu cầu
                    }
                }

                // Lấy và validate tọa độ từ location
                const eventCoords = extractAndValidateCoordinates(data.location, data.title || 'Unknown Event');
                if (!eventCoords) {
                    continue; // Skip nếu tọa độ không hợp lệ
                }

                // Sử dụng Haversine formula để tính khoảng cách chính xác như Google Maps
                const d = calculateDistanceHaversine(eventCoords, centerLoc);

                // Validate distance calculation
                if (d == null || Number.isNaN(d) || d <= 0) {
                    console.error(`❌ [getAllEventsNearbyDirect] Invalid distance for event: ${data.title || 'Unknown'}`, {
                        from: centerLoc,
                        to: eventCoords,
                        distance: d
                    });
                    continue; // Skip this event if distance is invalid
                }

                console.log(`📏 [Distance Debug] Event: ${data.title || 'Unknown'}`, {
                    from: centerLoc,
                    to: eventCoords,
                    distanceMeters: d,
                    formatted: (d / 1000).toFixed(3) + "km",
                    rawDistance: d,
                    centerLat: centerLoc[0],
                    centerLng: centerLoc[1],
                    eventLat: eventCoords[0],
                    eventLng: eventCoords[1]
                });

                // Nếu khoảng cách quá nhỏ (< 5m), có thể là lỗi trong dữ liệu hoặc tính toán
                if (d < 5) {
                    console.warn(`⚠️ [getAllEventsNearbyDirect] Suspiciously small distance (${d}m) for event: ${data.title || 'Unknown'}`);
                }

                if (d <= radiusKm * 1000) {
                    // Đảm bảo distanceMeters được set SAU khi spread data để không bị ghi đè
                    const eventData = {
                        id: docSnap.id,
                        type: "event",
                        ...data,
                        distanceMeters: d, // Set SAU spread để đảm bảo giá trị đúng
                    };
                    matching.push(eventData);
                }
            }
        }

        matching.sort((a, b) => a.distanceMeters - b.distanceMeters);
        console.log(`✅ [getAllEventsNearbyDirect] Found ${matching.length} events after filtering`);
        return matching;
    } catch (error) {
        console.error("Error getting all events nearby:", error);
        return [];
    }
}

/**
 * Lấy sự kiện sắp diễn ra TRỰC TIẾP từ Firestore
 */
async function getUpcomingEventsDirect(limit = 5, categoryFilter = null) {
    try {
        const col = collection(db, "events");
        const now = Timestamp.now();
        const q = query(col, where("startAt", ">=", now));
        const snap = await getDocs(q);
        const items = [];

        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            if (categoryFilter && data.category !== categoryFilter) continue;
            items.push({ id: docSnap.id, type: "event", ...data });
        }

        items.sort((a, b) => (a.startAt?.seconds || 0) - (b.startAt?.seconds || 0));
        return items.slice(0, limit);
    } catch (error) {
        console.error("Error getting upcoming events:", error);
        return [];
    }
}

/**
 * Validate tọa độ có hợp lệ không (phạm vi Việt Nam và chung)
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {boolean} true nếu hợp lệ
 */
function isValidCoordinate(lat, lng) {
    // Kiểm tra null/undefined
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
        return false;
    }

    // Kiểm tra phạm vi hợp lệ (tọa độ trên Trái Đất)
    // Latitude: -90 đến 90
    // Longitude: -180 đến 180
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }

    // Kiểm tra phạm vi Việt Nam (tùy chọn, nhưng hữu ích cho validation)
    // Việt Nam: lat: 8.5 - 23.4, lng: 102.1 - 109.5
    // Nếu ngoài phạm vi này có thể là lỗi nhập liệu
    const isInVietnamRange = lat >= 8.5 && lat <= 23.4 && lng >= 102.1 && lng <= 109.5;

    if (!isInVietnamRange) {
        console.warn(`⚠️ [isValidCoordinate] Coordinates out of Vietnam range: lat=${lat}, lng=${lng}`);
        // Vẫn cho phép nhưng cảnh báo
    }

    return true;
}

/**
 * Lấy và validate tọa độ từ location object
 * @param {object} location - Object có dạng { lat, lng }
 * @param {string} itemName - Tên item (để log)
 * @returns {number[]|null} [lat, lng] hoặc null nếu không hợp lệ
 */
function extractAndValidateCoordinates(location, itemName = "Unknown") {
    if (!location) {
        console.warn(`⚠️ [extractAndValidateCoordinates] Missing location for: ${itemName}`);
        return null;
    }

    const lat = location.lat ?? null;
    const lng = location.lng ?? null;

    if (lat == null || lng == null) {
        console.warn(`⚠️ [extractAndValidateCoordinates] Missing lat/lng for: ${itemName}`, {
            location,
            lat,
            lng
        });
        return null;
    }

    if (!isValidCoordinate(lat, lng)) {
        console.error(`❌ [extractAndValidateCoordinates] Invalid coordinates for: ${itemName}`, {
            lat,
            lng,
            location
        });
        return null;
    }

    // Log để debug (chỉ log một vài lần đầu)
    if (Math.random() < 0.1) { // 10% chance để không log quá nhiều
        console.log(`✅ [extractAndValidateCoordinates] Valid coordinates for: ${itemName}`, {
            lat,
            lng
        });
    }

    return [lat, lng];
}

/**
 * Tính khoảng cách bằng công thức Haversine (chính xác như Google Maps)
 * @param {number[]} point1 - [lat1, lng1]
 * @param {number[]} point2 - [lat2, lng2]
 * @returns {number} Khoảng cách tính bằng mét
 */
function calculateDistanceHaversine(point1, point2) {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;

    // Kiểm tra input hợp lệ bằng hàm validate
    if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
        console.error("❌ [calculateDistanceHaversine] Invalid coordinates:", { point1, point2 });
        return 0;
    }

    // Bán kính Trái Đất (mét)
    const R = 6371000; // 6371 km = 6371000 m

    // Chuyển đổi độ sang radian
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    // Công thức Haversine
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Khoảng cách (mét)
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Làm tròn đến 2 chữ số thập phân
}

/**
 * Helper function: Format distance từ meters sang đơn vị phù hợp
 */
function formatDistance(meters) {
    // Kiểm tra và validate input
    if (meters == null || Number.isNaN(meters) || meters < 0) {
        console.warn(`⚠️ [formatDistance] Invalid meters value: ${meters}`);
        return "0m"; // Default fallback
    }

    const numMeters = Number(meters);

    // Log để debug
    console.log(`🔍 [formatDistance] Input: ${meters} -> ${numMeters}m`);

    if (numMeters < 1000) {
        // Dưới 1km, hiển thị theo mét
        if (numMeters < 10) {
            // < 10m: hiển thị chính xác đến mét
            const result = Math.round(numMeters) + "m";
            console.log(`📏 [formatDistance] < 10m: ${numMeters}m -> ${result}`);
            return result;
        } else {
            // 10m-999m: làm tròn đến 10m
            const roundedMeters = Math.round(numMeters / 10) * 10;
            const result = roundedMeters + "m";
            console.log(`📏 [formatDistance] 10-999m: ${numMeters}m -> ${result}`);
            return result;
        }
    } else {
        // Trên 1km, hiển thị theo km, làm tròn đến 0.1km
        const result = (numMeters / 1000).toFixed(1) + "km";
        console.log(`📏 [formatDistance] >= 1km: ${numMeters}m -> ${result}`);
        return result;
    }
}

/**
 * Kiểm tra xem câu hỏi có phải về vị trí hiện tại không
 */
function isLocationQuestion(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Kiểm tra các cụm từ phổ biến về vị trí hiện tại
    return lowerMessage.includes("vị trí") ||
        lowerMessage.includes("địa chỉ") ||
        lowerMessage.includes("tọa độ") ||
        lowerMessage.includes("tôi đang ở") ||
        lowerMessage.includes("tôi ở đâu") ||
        lowerMessage.includes("where am i") ||
        lowerMessage.includes("my location") ||
        lowerMessage.includes("current location");
}

/**
 * Tìm kiếm dữ liệu dựa trên query - SỬ DỤNG FUNCTIONS TRỰC TIẾP
 */
async function performSearch(parsedQuery, userLocation) {
    const { category, radius, searchType, dayOfWeekFilter } = parsedQuery;

    if (!userLocation) {
        return {
            success: false,
            message: "Không thể lấy vị trí của bạn. Vui lòng cho phép ứng dụng truy cập vị trí.",
            results: [],
        };
    }

    try {
        let results = [];

        if (searchType === "location" || !searchType) {
            // Tìm locations - SỬ DỤNG DIRECT FUNCTION
            const locations = await getLocationsNearbyDirect(
                userLocation,
                radius,
                category || null
            );
            results = locations.map((loc) => {
                // Đảm bảo distanceMeters có giá trị hợp lệ
                const distanceMeters = loc.distanceMeters;
                if (distanceMeters == null || Number.isNaN(distanceMeters)) {
                    console.error(`❌ [performSearch] Location "${loc.name}" has invalid distanceMeters:`, distanceMeters);
                    // Nếu không có distanceMeters hợp lệ, tính lại từ location
                    const locCoords = extractAndValidateCoordinates(loc.location, loc.name);
                    if (locCoords && userLocation) {
                        const userCoords = [userLocation.latitude, userLocation.longitude];
                        const recalcDistance = calculateDistanceHaversine(locCoords, userCoords);
                        console.log(`🔧 [performSearch] Recalculated distance for location "${loc.name}": ${recalcDistance}m`);
                        return {
                            type: "location",
                            id: loc.id,
                            name: loc.name,
                            category: loc.category,
                            distance: formatDistance(recalcDistance),
                            distanceMeters: recalcDistance,
                            address: loc.address || "Chưa có địa chỉ",
                        };
                    } else {
                        console.warn(`⚠️ [performSearch] Cannot recalculate distance for location "${loc.name}", using 0m`);
                        return {
                            type: "location",
                            id: loc.id,
                            name: loc.name,
                            category: loc.category,
                            distance: "0m",
                            distanceMeters: 0,
                            address: loc.address || "Chưa có địa chỉ",
                        };
                    }
                }

                return {
                    type: "location",
                    id: loc.id,
                    name: loc.name,
                    category: loc.category,
                    distance: formatDistance(distanceMeters),
                    distanceMeters: distanceMeters,
                    address: loc.address || "Chưa có địa chỉ",
                };
            });
        }

        if (searchType === "event" || !searchType) {
            // Tìm events - SỬ DỤNG FUNCTION LẤY TẤT CẢ (đang diễn ra + sắp diễn ra)
            console.log(`🔍 [performSearch] Searching events with:`, {
                center: { lat: userLocation.latitude, lng: userLocation.longitude },
                radius,
                category: category || "all",
                dayOfWeekFilter: dayOfWeekFilter || "all"
            });
            const events = await getAllEventsNearbyDirect(
                userLocation,
                radius,
                category || null,
                dayOfWeekFilter || null
            );
            console.log(`✅ [performSearch] Found ${events.length} events`);

            const eventResults = events.map((evt) => {
                // Đảm bảo distanceMeters có giá trị hợp lệ
                const distanceMeters = evt.distanceMeters;
                if (distanceMeters == null || Number.isNaN(distanceMeters)) {
                    console.error(`❌ [performSearch] Event "${evt.title}" has invalid distanceMeters:`, distanceMeters);
                    // Nếu không có distanceMeters hợp lệ, tính lại từ location
                    const evtCoords = extractAndValidateCoordinates(evt.location, evt.title);
                    if (evtCoords && userLocation) {
                        const userCoords = [userLocation.latitude, userLocation.longitude];
                        const recalcDistance = calculateDistanceHaversine(evtCoords, userCoords);
                        console.log(`🔧 [performSearch] Recalculated distance for "${evt.title}": ${recalcDistance}m`);
                        const distanceFormatted = formatDistance(recalcDistance);
                        return {
                            type: "event",
                            id: evt.id,
                            name: evt.title,
                            category: evt.category,
                            distance: distanceFormatted,
                            distanceMeters: recalcDistance,
                            address: evt.address || "Chưa có địa chỉ",
                        };
                    } else {
                        console.warn(`⚠️ [performSearch] Cannot recalculate distance for "${evt.title}", using 0m`);
                        return {
                            type: "event",
                            id: evt.id,
                            name: evt.title,
                            category: evt.category,
                            distance: "0m",
                            distanceMeters: 0,
                            address: evt.address || "Chưa có địa chỉ",
                        };
                    }
                }

                // Kiểm tra nếu khoảng cách quá nhỏ (có thể là lỗi)
                let finalDistance = distanceMeters;
                if (distanceMeters < 50 && distanceMeters > 0) {
                    console.warn(`⚠️ [performSearch] Very small distance (${distanceMeters}m) for event "${evt.title}". Recalculating...`);
                    // Tính lại để đảm bảo chính xác
                    const evtCoords = extractAndValidateCoordinates(evt.location, evt.title);
                    if (evtCoords && userLocation) {
                        const userCoords = [userLocation.latitude, userLocation.longitude];
                        const recalcDistance = calculateDistanceHaversine(evtCoords, userCoords);
                        console.log(`🔧 [performSearch] Recalculated: ${distanceMeters}m -> ${recalcDistance}m`);
                        // Nếu chênh lệch lớn hơn 10m, dùng giá trị mới (có thể giá trị cũ sai)
                        if (Math.abs(recalcDistance - distanceMeters) > 10) {
                            finalDistance = recalcDistance;
                            console.log(`✅ [performSearch] Using recalculated distance: ${finalDistance}m`);
                        } else {
                            console.log(`ℹ️ [performSearch] Original distance seems correct: ${distanceMeters}m`);
                        }
                    }
                }

                const distanceFormatted = formatDistance(finalDistance);
                console.log(`📏 [performSearch] Event "${evt.title}": ${finalDistance}m (final) = ${distanceFormatted} (formatted)`);
                return {
                    type: "event",
                    id: evt.id,
                    name: evt.title,
                    category: evt.category,
                    distance: distanceFormatted,
                    distanceMeters: finalDistance, // Dùng giá trị đã được validate/recalculate
                    address: evt.address || "Chưa có địa chỉ",
                };
            });

            results = [
                ...results,
                ...eventResults,
            ];
        }

        return {
            success: true,
            results,
            count: results.length,
        };
    } catch (error) {
        console.error("Search error:", error);
        return {
            success: false,
            message: "Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.",
            results: [],
        };
    }
}

/**
 * Format kết quả tìm kiếm thành text để trả về cho user
 */
function formatSearchResults(searchData) {
    if (!searchData.success) {
        return searchData.message;
    }

    if (searchData.count === 0) {
        return `Không tìm thấy kết quả nào trong bán kính bạn yêu cầu. Bạn có thể thử tăng bán kính tìm kiếm hoặc chọn loại địa điểm/sự kiện khác.`;
    }

    // Phân loại results theo type
    const events = searchData.results.filter(r => r.type === "event");
    const locations = searchData.results.filter(r => r.type === "location");

    let text = `Tôi đã tìm thấy ${searchData.count} kết quả`;

    if (events.length > 0 && locations.length > 0) {
        text += ` (${events.length} sự kiện, ${locations.length} địa điểm)`;
    } else if (events.length > 0) {
        text += ` (${events.length} sự kiện)`;
    } else if (locations.length > 0) {
        text += ` (${locations.length} địa điểm)`;
    }

    text += `:\n\n`;

    // Sắp xếp lại theo khoảng cách (nếu có distanceMeters)
    const sortedResults = [...searchData.results].sort((a, b) => {
        const distA = a.distanceMeters || (a.distance ? Number.parseFloat(a.distance) * 1000 : 999999);
        const distB = b.distanceMeters || (b.distance ? Number.parseFloat(b.distance) * 1000 : 999999);
        return distA - distB;
    });

    for (let i = 0; i < Math.min(sortedResults.length, 20); i++) {
        const item = sortedResults[i];
        const typeLabel = item.type === "event" ? "🎉 Sự kiện" : "📍 Địa điểm";
        const eventName = item.name || "Chưa có tên";
        const distance = item.distance || "Chưa xác định";
        const category = item.category || "Chưa có danh mục";
        const address = item.address || "Chưa có địa chỉ";

        // Đảm bảo format đầy đủ và rõ ràng
        text += `${i + 1}. **${eventName}**\n`;
        text += `   ${typeLabel} | 📏 Khoảng cách: ${distance} | 🏷️ Thể loại: ${category}\n`;
        text += `   📍 Địa chỉ: ${address}\n\n`;
    }

    if (searchData.count > 20) {
        text += `\n... và còn ${searchData.count - 20} kết quả khác. Bạn có thể xem thêm trên bản đồ hoặc danh sách sự kiện.`;
    }

    return text;
}

/**
 * Gửi tin nhắn đến Gemini API và nhận phản hồi
 * @param {string} message - Tin nhắn từ người dùng
 * @param {Array} conversationHistory - Lịch sử cuộc trò chuyện (optional)
 * @returns {Promise<{text: string, searchResults?: any}>} - Phản hồi từ AI và kết quả tìm kiếm (nếu có)
 */
export async function sendMessageToGemini(message, conversationHistory = []) {
    // Khai báo các biến ở đầu function để đảm bảo chúng luôn tồn tại trong catch block
    let hasSearchIntent = false;
    let searchData = null;
    let searchResults = null;
    let parsedQuery = null;

    try {
        // Kiểm tra xem có phải câu hỏi về vị trí hiện tại không
        const isLocationQ = isLocationQuestion(message);

        // Parse query để xem có phải là câu hỏi tìm kiếm không
        parsedQuery = parseSearchQuery(message);
        // Phát hiện search intent: có category, có searchType, hoặc có từ khóa về tìm kiếm gần
        const lowerMessage = message.toLowerCase();
        const hasNearbyKeywords = lowerMessage.includes("gần") ||
            lowerMessage.includes("nearby") ||
            lowerMessage.includes("gần đây") ||
            lowerMessage.includes("around") ||
            lowerMessage.includes("ở đâu") ||
            lowerMessage.includes("where");
        hasSearchIntent = parsedQuery.category ||
            parsedQuery.searchType ||
            hasNearbyKeywords;

        // Lấy vị trí hiện tại nếu cần (cho câu hỏi về vị trí hoặc tìm kiếm)
        let locationResult = null;
        let userLocation = null;
        if (isLocationQ || hasSearchIntent) {
            console.log(`📍 [sendMessageToGemini] Requesting location... isLocationQ: ${isLocationQ}, hasSearchIntent: ${hasSearchIntent}`);
            locationResult = await getCurrentLocation();

            if (locationResult?.coords) {
                userLocation = locationResult.coords;
                console.log(`✅ [sendMessageToGemini] Location retrieved successfully:`, {
                    address: userLocation.address,
                    lat: userLocation.latitude,
                    lng: userLocation.longitude
                });
            } else {
                console.warn(`⚠️ [sendMessageToGemini] Failed to get location`);
            }
        }

        // Nếu có intent tìm kiếm, thực hiện tìm kiếm trước (LUÔN dùng vị trí hiện tại)
        if (hasSearchIntent) {
            if (!userLocation) {
                // Nếu không lấy được vị trí, trả về thông báo với flag để mở settings
                const locationMessage = locationResult?.message ||
                    "Tôi không thể lấy vị trí hiện tại của bạn. Vui lòng cho phép ứng dụng truy cập vị trí trong cài đặt để tôi có thể tìm kiếm địa điểm và sự kiện gần bạn.";

                return {
                    text: locationMessage,
                    needsSettings: locationResult?.needsSettings || false,
                    needsPermission: locationResult?.needsPermission || false,
                    locationError: locationResult?.error || "unknown"
                };
            }
            searchData = await performSearch(parsedQuery, userLocation);
            searchResults = formatSearchResults(searchData);
        }

        // Xây dựng prompt với context
        let userMessage = message;

        // Thêm context về vị trí hiện tại nếu được hỏi
        if (isLocationQ && userLocation) {
            const cityInfo = userLocation.city ? `🏙️ Thành phố: ${userLocation.city}\n` : "";
            const districtInfo = userLocation.district ? `📍 Quận/Huyện: ${userLocation.district}\n` : "";
            const coordinates = `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;

            console.log("📍 [Location] User location retrieved:", {
                address: userLocation.address,
                city: userLocation.city,
                district: userLocation.district,
                coords: coordinates
            });

            userMessage = `${message}\n\n[THÔNG TIN VỊ TRÍ HIỆN TẠI CỦA NGƯỜI DÙNG]\n` +
                `📍 Địa chỉ: ${userLocation.address}\n` +
                `🌐 Tọa độ: ${coordinates}\n` +
                `${cityInfo}` +
                `${districtInfo}` +
                `\n\n**QUAN TRỌNG**: Đây là thông tin vị trí CHÍNH XÁC của người dùng được lấy từ ứng dụng. ` +
                `Bạn phải trả lời về vị trí này MỘT CÁCH CHÍNH XÁC. KHÔNG được nói rằng bạn không biết vị trí của họ. ` +
                `KHÔNG được yêu cầu họ cung cấp thông tin vị trí. ` +
                `Chỉ cần trả lời về địa chỉ và tọa độ được cung cấp ở trên một cách thân thiện bằng tiếng Việt.`;
        } else if (isLocationQ && !userLocation) {
            // Nếu hỏi về vị trí nhưng không lấy được
            console.error(`❌ [sendMessageToGemini] Location question detected but location is null`);
            const locationMessage = locationResult?.message ||
                "Xin lỗi, tôi không thể lấy vị trí hiện tại của bạn từ ứng dụng. Vui lòng:\n\n" +
                "1. Kiểm tra xem bạn đã cho phép ứng dụng truy cập vị trí trong cài đặt điện thoại chưa\n" +
                "2. Đảm bảo GPS/Wifi đã được bật\n" +
                "3. Thử lại sau vài giây\n\n" +
                "Nếu vấn đề vẫn tiếp tục, bạn có thể cung cấp địa chỉ hoặc tọa độ hiện tại để tôi có thể giúp bạn tìm kiếm địa điểm và sự kiện gần đó.";

            return {
                text: locationMessage,
                needsSettings: locationResult?.needsSettings || false,
                needsPermission: locationResult?.needsPermission || false,
                locationError: locationResult?.error || "unknown"
            };
        }

        // Thêm context về kết quả tìm kiếm nếu có (nhấn mạnh rằng tìm từ vị trí hiện tại)
        if (searchResults && searchData?.success && userLocation) {
            userMessage = `${message}\n\n[KẾT QUẢ TÌM KIẾM TỪ VỊ TRÍ HIỆN TẠI CỦA BẠN]\n` +
                `📍 Vị trí tìm kiếm: ${userLocation.address}\n` +
                `🌐 Tọa độ: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}\n` +
                `📏 Bán kính: ${parsedQuery.radius}km\n\n` +
                `${searchResults}\n\n` +
                `**QUAN TRỌNG - ĐỌC KỸ**:\n` +
                `1. CHỈ liệt kê CHÍNH XÁC các kết quả tìm kiếm ở trên, KHÔNG tự thêm, sửa hoặc bịa ra kết quả mới\n` +
                `2. Khoảng cách (như "1.2km", "350m", "2.3km") đã được tính CHÍNH XÁC từ vị trí hiện tại của người dùng - PHẢI sử dụng ĐÚNG các giá trị này, KHÔNG ĐƯỢC THAY ĐỔI\n` +
                `3. KHÔNG tự tính toán, ước lượng, làm tròn, hoặc "điều chỉnh" khoảng cách - dùng CHÍNH XÁC giá trị trong kết quả\n` +
                `4. Nếu khoảng cách hiển thị là "2.3km" thì bạn phải nói "2.3km", KHÔNG được nói "2km" hay "khoảng 2km"\n` +
                `5. Nếu khoảng cách hiển thị là "350m" thì bạn phải nói "350m", KHÔNG được nói "gần đây" hay "cách vài trăm mét"\n` +
                `6. Sắp xếp kết quả theo khoảng cách từ gần đến xa khi liệt kê\n` +
                `7. **CỰC KỲ QUAN TRỌNG - Mỗi kết quả PHẢI có ĐẦY ĐỦ**: tên, khoảng cách CHÍNH XÁC (copy nguyên từ kết quả), loại (sự kiện/địa điểm), danh mục (category), địa chỉ (address). KHÔNG được bỏ sót bất kỳ thông tin nào\n` +
                `8. **KHÔNG được cắt ngắn hoặc làm tròn** - phải hiển thị TẤT CẢ các sự kiện với ĐẦY ĐỦ thông tin. Nếu có 10 sự kiện thì phải liệt kê đầy đủ 10 sự kiện, không được chỉ hiển thị một vài sự kiện đầu\n` +
                `9. **ĐẢM BẢO MỖI SỰ KIỆN CÓ ĐẦY ĐỦ**: Tên sự kiện, khoảng cách, category, và địa chỉ. Nếu thiếu bất kỳ thông tin nào thì bạn đang làm sai\n` +
                `10. Trả lời bằng tiếng Việt, thân thiện, và nhắc rằng kết quả được tìm từ vị trí hiện tại của họ\n` +
                `11. **CỰC KỲ QUAN TRỌNG**: Nếu bạn thấy khoảng cách là "2m" hoặc rất nhỏ (< 10m) nhưng người dùng ở xa, CÓ THỂ là lỗi trong tính toán - nhưng BẠN VẪN PHẢI hiển thị đúng giá trị từ kết quả, KHÔNG tự sửa`;
        }

        // Xây dựng lịch sử cuộc trò chuyện
        const contents = [
            // Thêm system prompt ở đầu
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }],
            },
            {
                role: "model",
                parts: [{ text: "Tôi hiểu rồi. Tôi sẽ giúp bạn tìm kiếm địa điểm và sự kiện, cũng như trả lời các câu hỏi về ứng dụng." }],
            },
        ];

        // Thêm lịch sử nếu có (chỉ lấy 8 tin nhắn gần nhất để tiết kiệm token)
        const recentHistory = conversationHistory.slice(-8);
        if (recentHistory.length > 0) {
            for (const msg of recentHistory) {
                contents.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.text }],
                });
            }
        }

        // Thêm tin nhắn hiện tại
        contents.push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096, // Tăng lên để hiển thị đầy đủ tất cả thông tin cho nhiều sự kiện
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        };

        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();

        // Lấy text từ phản hồi
        let aiResponse = "";
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiResponse = data.candidates[0].content.parts[0].text;
        } else if (data.candidates?.[0]?.finishReason === "SAFETY") {
            aiResponse = "Xin lỗi, tôi không thể trả lời câu hỏi này do nội dung không phù hợp. Vui lòng thử câu hỏi khác.";
        } else {
            // Nếu không có text từ AI nhưng có search results, vẫn trả về kết quả tìm kiếm
            if (hasSearchIntent && searchData?.success) {
                return {
                    text: searchResults || "Đã tìm thấy kết quả nhưng không thể tạo phản hồi tự nhiên. Kết quả ở trên.",
                    searchResults: searchData.results,
                    searchType: parsedQuery?.searchType,
                    radius: parsedQuery?.radius,
                };
            }
            // Chỉ throw error nếu không có search results
            throw new Error("Không nhận được phản hồi từ AI");
        }

        // Nếu có kết quả tìm kiếm, kết hợp với response của AI
        if (hasSearchIntent && searchData) {
            return {
                text: aiResponse,
                searchResults: searchData.results,
                searchType: parsedQuery?.searchType,
                radius: parsedQuery?.radius,
            };
        }

        return { text: aiResponse };
    } catch (error) {
        // Nếu có kết quả tìm kiếm nhưng AI lỗi, vẫn trả về kết quả tìm kiếm (KHÔNG throw error)
        if (hasSearchIntent && searchData?.success) {
            // Chỉ log warning thay vì error để không trigger error banner
            console.warn("⚠️ [sendMessageToGemini] AI response failed but returning search results:", error?.message);
            return {
                text: searchResults || "Đã tìm thấy kết quả nhưng không thể tạo phản hồi tự nhiên. Kết quả ở trên.",
                searchResults: searchData.results,
                searchType: parsedQuery?.searchType,
                radius: parsedQuery?.radius,
            };
        }

        // Chỉ log error nếu thực sự không có kết quả để trả về
        console.error("Gemini API error:", error);

        // Tạo error message thân thiện dựa trên loại lỗi
        const errorMessage = error?.message || "";
        let friendlyError = "";

        if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
            friendlyError = "Oops! 😅 Mình đang gặp vấn đề với kết nối mạng. Bạn kiểm tra lại WiFi/4G giúp mình nha, rồi thử lại sau vài giây nhé! 📶✨";
        } else if (errorMessage.includes("timeout")) {
            friendlyError = "Hmm, mình đang xử lý hơi lâu quá! ⏰ Bạn thử hỏi lại mình một lần nữa được không? Mình sẽ cố gắng trả lời nhanh hơn! 💪";
        } else if (errorMessage.includes("API") || errorMessage.includes("HTTP") || errorMessage.includes("400") || errorMessage.includes("500")) {
            friendlyError = "Xin lỗi bạn nhé! 😔 Mình đang gặp chút vấn đề kỹ thuật. Bạn thử lại sau một chút được không? Mình sẽ cố gắng sửa lại ngay! 🔧💜";
        } else {
            // Lỗi không xác định hoặc câu lệnh không xử lý được
            friendlyError = "Xin lỗi bạn nhé! 😅 Mình chưa hiểu rõ yêu cầu này của bạn. Bạn có thể:\n\n" +
                "• Hỏi mình về sự kiện gần đây (ví dụ: \"Sự kiện cuối tuần\", \"Sự kiện gaming gần đây\")\n" +
                "• Hỏi về vị trí hiện tại của bạn\n" +
                "• Hoặc hỏi mình về chức năng của app\n\n" +
                "Mình sẽ cố gắng giúp bạn tốt nhất có thể! 💜✨";
        }

        // Tạo một error object với message thân thiện
        const friendlyErrorObj = new Error(friendlyError);
        friendlyErrorObj.originalError = error;
        throw friendlyErrorObj;
    }
}

/**
 * Lấy danh sách sự kiện gần đây để làm context (nếu cần)
 * Có thể sử dụng để cung cấp thông tin cho chatbot
 * SỬ DỤNG FUNCTION TRỰC TIẾP
 */
export async function getEventsContext() {
    try {
        const events = await getUpcomingEventsDirect(5);
        return events.map((e) => ({
            title: e.title,
            category: e.category,
            startAt: e.startAt?.toDate?.()?.toLocaleString("vi-VN") || "Chưa xác định",
            address: e.address || "Chưa có địa chỉ",
        }));
    } catch (error) {
        console.error("Error getting events context:", error);
        return [];
    }
}

// Export categories và hàm mở settings để các file khác có thể sử dụng
export { LOCATION_CATEGORIES, EVENT_CATEGORIES, openLocationSettings };
