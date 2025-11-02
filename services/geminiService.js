// services/geminiService.js
import * as Location from "expo-location";
import { getLocationsNearby, LOCATION_CATEGORIES } from "./locations";
import { getLiveEventsNearby, getUpcomingEvents, EVENT_CATEGORIES } from "./events";

const GEMINI_API_KEY = "AIzaSyDkS9IVipgld-GNVf8nk5PteRxCQ8ytp7Y";
// Model: gemini-2.5-flash (theo yêu cầu)
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * System prompt cho chatbot với context về app
 */
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của ứng dụng "DiChoiKhongLoHauQua" - một app tìm kiếm sự kiện và địa điểm.

CHỨC NĂNG CỦA BẠN:
1. Tìm kiếm địa điểm và sự kiện gần người dùng dựa trên:
   - Loại địa điểm: Quán Cafe, Nhà hàng, Quán Bida, Quán Net, Quán Game/PES, Bar/Pub, Khu vui chơi, Shopping, Workshop/Coworking, Thể thao, Học tập
   - Loại sự kiện: Âm nhạc, Workshop, Ẩm thực, Thể thao, Gaming/Esports, Meetup, Party, Văn hóa, Học tập, Từ thiện
   - Khoảng cách (km)

2. Trả lời câu hỏi chung về app, chức năng, cách sử dụng

3. Chào hỏi, cảm ơn, hỗ trợ người dùng một cách thân thiện

KHI NGƯỜI DÙNG HỎI VỀ TÌM KIẾM:
- **QUAN TRỌNG**: Tất cả tìm kiếm đều dựa trên VỊ TRÍ HIỆN TẠI của người dùng
- Bán kính (5km, 10km, etc.) luôn được tính TỪ VỊ TRÍ HIỆN TẠI của người dùng
- Phân tích câu hỏi để tìm: loại địa điểm/sự kiện, khoảng cách (km)
- Nếu thiếu thông tin, hãy hỏi lại người dùng
- Trả lời ngắn gọn, rõ ràng, thân thiện bằng tiếng Việt
- Luôn nhắc rằng kết quả được tìm từ vị trí hiện tại của họ

KHI NGƯỜI DÙNG HỎI VỀ VỊ TRÍ HIỆN TẠI:
- Trả lời thân thiện về địa chỉ và tọa độ của họ
- Có thể đề xuất tìm kiếm địa điểm gần đó

VÍ DỤ:
- "Tìm quán cafe ở gần 5km" -> Tìm Quán Cafe trong bán kính 5km TỪ VỊ TRÍ HIỆN TẠI
- "Quán bida nào gần đây?" -> Tìm Quán Bida TỪ VỊ TRÍ HIỆN TẠI, hỏi bán kính nếu chưa có
- "Sự kiện âm nhạc cuối tuần" -> Tìm sự kiện Âm nhạc TỪ VỊ TRÍ HIỆN TẠI
- "Bạn biết vị trí hiện tại của tôi là ở đâu?" -> Trả lời địa chỉ và tọa độ hiện tại`;

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
    "sự kiện ẩm thực": EVENT_CATEGORIES.FOOD,
    "food": EVENT_CATEGORIES.FOOD,
    "sự kiện thể thao": EVENT_CATEGORIES.SPORTS,
    "party": EVENT_CATEGORIES.PARTY,
    "meetup": EVENT_CATEGORIES.MEETUP,
    "văn hóa": EVENT_CATEGORIES.CULTURAL,
};

/**
 * Parse query để tìm category và radius
 */
function parseSearchQuery(message) {
    const lowerMessage = message.toLowerCase();
    let category = null;
    let radius = 10; // Default 10km
    let searchType = null; // "location" hoặc "event"

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

    // Tìm category và type
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
        if (lowerMessage.includes(keyword)) {
            category = cat;
            // Kiểm tra xem là location hay event
            if (Object.values(LOCATION_CATEGORIES).includes(cat)) {
                searchType = "location";
            } else if (Object.values(EVENT_CATEGORIES).includes(cat)) {
                searchType = "event";
            }
            break;
        }
    }

    // Kiểm tra từ khóa về type
    if (lowerMessage.includes("sự kiện") || lowerMessage.includes("event")) {
        searchType = "event";
    } else if (
        lowerMessage.includes("địa điểm") ||
        lowerMessage.includes("location") ||
        lowerMessage.includes("place") ||
        lowerMessage.includes("quán") ||
        lowerMessage.includes("nhà hàng")
    ) {
        searchType = "location";
    }

    return { category, radius, searchType };
}

/**
 * Lấy vị trí hiện tại của người dùng (bao gồm địa chỉ)
 */
async function getCurrentLocation() {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            return null;
        }
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        // Reverse geocoding để lấy địa chỉ
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync(coords);
            if (reverseGeocode && reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                // Format địa chỉ từ reverse geocode
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

                // Thêm thông tin chi tiết
                coords.city = address.city || address.subregion || "";
                coords.district = address.district || "";
                coords.street = address.street || "";
            } else {
                // Fallback nếu không có địa chỉ
                coords.address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
            }
        } catch (geocodeError) {
            console.error("Reverse geocoding error:", geocodeError);
            // Fallback nếu reverse geocoding lỗi
            coords.address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        }

        return coords;
    } catch (error) {
        console.error("Error getting location:", error);
        return null;
    }
}

/**
 * Kiểm tra xem câu hỏi có phải về vị trí hiện tại không
 */
function isLocationQuestion(message) {
    const lowerMessage = message.toLowerCase();
    const locationKeywords = [
        "vị trí hiện tại",
        "vị trí của tôi",
        "tôi đang ở đâu",
        "địa chỉ của tôi",
        "tọa độ của tôi",
        "vị trí bạn",
        "bạn biết vị trí",
        "location",
        "where am i",
        "my location",
    ];

    return locationKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Tìm kiếm dữ liệu dựa trên query
 */
async function performSearch(parsedQuery, userLocation) {
    const { category, radius, searchType } = parsedQuery;

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
            // Tìm locations
            const locations = await getLocationsNearby(
                userLocation,
                radius,
                category || null
            );
            results = locations.map((loc) => ({
                type: "location",
                id: loc.id,
                name: loc.name,
                category: loc.category,
                distance: (loc.distanceMeters / 1000).toFixed(1) + "km",
                address: loc.address || "Chưa có địa chỉ",
            }));
        }

        if (searchType === "event" || !searchType) {
            // Tìm events
            const events = await getLiveEventsNearby(
                userLocation,
                radius,
                category || null
            );
            results = [
                ...results,
                ...events.map((evt) => ({
                    type: "event",
                    id: evt.id,
                    name: evt.title,
                    category: evt.category,
                    distance: (evt.distanceMeters / 1000).toFixed(1) + "km",
                    address: evt.address || "Chưa có địa chỉ",
                })),
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

    let text = `Tôi đã tìm thấy ${searchData.count} kết quả:\n\n`;

    for (let i = 0; i < Math.min(searchData.results.length, 10); i++) {
        const item = searchData.results[i];
        text += `${i + 1}. **${item.name}**\n`;
        text += `   📍 ${item.distance} - ${item.category}\n`;
        text += `   ${item.address}\n\n`;
    }

    if (searchData.count > 10) {
        text += `\n... và còn ${searchData.count - 10} kết quả khác. Bạn có thể xem thêm trên bản đồ hoặc danh sách sự kiện.`;
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
    try {
        // Kiểm tra xem có phải câu hỏi về vị trí hiện tại không
        const isLocationQ = isLocationQuestion(message);

        // Parse query để xem có phải là câu hỏi tìm kiếm không
        const parsedQuery = parseSearchQuery(message);
        const hasSearchIntent = parsedQuery.category || parsedQuery.searchType;

        // Lấy vị trí hiện tại nếu cần (cho câu hỏi về vị trí hoặc tìm kiếm)
        let userLocation = null;
        if (isLocationQ || hasSearchIntent) {
            userLocation = await getCurrentLocation();
        }

        let searchResults = null;
        let searchData = null;

        // Nếu có intent tìm kiếm, thực hiện tìm kiếm trước (LUÔN dùng vị trí hiện tại)
        if (hasSearchIntent) {
            if (!userLocation) {
                // Nếu không lấy được vị trí, trả về lỗi ngay
                return {
                    text: "Tôi không thể lấy vị trí hiện tại của bạn. Vui lòng cho phép ứng dụng truy cập vị trí trong cài đặt để tôi có thể tìm kiếm địa điểm và sự kiện gần bạn.",
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

            userMessage = `${message}\n\n[THÔNG TIN VỊ TRÍ HIỆN TẠI]\n` +
                `📍 Địa chỉ: ${userLocation.address}\n` +
                `🌐 Tọa độ: ${coordinates}\n` +
                `${cityInfo}` +
                `${districtInfo}` +
                `\nHãy trả lời một cách thân thiện và tự nhiên về vị trí hiện tại của người dùng.`;
        } else if (isLocationQ && !userLocation) {
            // Nếu hỏi về vị trí nhưng không lấy được
            return {
                text: "Xin lỗi, tôi không thể lấy vị trí hiện tại của bạn. Vui lòng cho phép ứng dụng truy cập vị trí trong cài đặt để tôi có thể biết bạn đang ở đâu.",
            };
        }

        // Thêm context về kết quả tìm kiếm nếu có (nhấn mạnh rằng tìm từ vị trí hiện tại)
        if (searchResults && searchData?.success && userLocation) {
            userMessage = `${message}\n\n[KẾT QUẢ TÌM KIẾM TỪ VỊ TRÍ HIỆN TẠI CỦA BẠN]\n` +
                `📍 Vị trí tìm kiếm: ${userLocation.address}\n` +
                `📏 Bán kính: ${parsedQuery.radius}km\n\n` +
                `${searchResults}\n\n` +
                `Hãy trả lời dựa trên kết quả tìm kiếm này một cách tự nhiên và hữu ích. Nhấn mạnh rằng các kết quả được tìm từ vị trí hiện tại của người dùng.`;
        }

        // Xây dựng lịch sử cuộc trò chuyện
        const contents = [];

        // Thêm system prompt ở đầu
        contents.push({
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
        });
        contents.push({
            role: "model",
            parts: [{ text: "Tôi hiểu rồi. Tôi sẽ giúp bạn tìm kiếm địa điểm và sự kiện, cũng như trả lời các câu hỏi về ứng dụng." }],
        });

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
                maxOutputTokens: 1024,
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
            throw new Error("Không nhận được phản hồi từ AI");
        }

        // Nếu có kết quả tìm kiếm, kết hợp với response của AI
        if (hasSearchIntent && searchData) {
            return {
                text: aiResponse,
                searchResults: searchData.results,
                searchType: parsedQuery.searchType,
                radius: parsedQuery.radius,
            };
        }

        return { text: aiResponse };
    } catch (error) {
        console.error("Gemini API error:", error);

        // Nếu có kết quả tìm kiếm nhưng AI lỗi, vẫn trả về kết quả tìm kiếm
        if (hasSearchIntent && searchData?.success) {
            return {
                text: searchResults || "Đã tìm thấy kết quả nhưng không thể tạo phản hồi tự nhiên. Kết quả ở trên.",
                searchResults: searchData.results,
                searchType: parsedQuery.searchType,
                radius: parsedQuery.radius,
            };
        }

        throw error;
    }
}

/**
 * Lấy danh sách sự kiện gần đây để làm context (nếu cần)
 * Có thể sử dụng để cung cấp thông tin cho chatbot
 */
export async function getEventsContext() {
    try {
        const events = await getUpcomingEvents(5);
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
