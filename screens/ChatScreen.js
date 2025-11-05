// screens/ChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessageToGemini, openLocationSettings } from "../services/geminiService";
import { getEventById } from "../services/events";

export default function ChatScreen({ navigation }) {
    const initialMessage = {
        id: "1",
        text: "Xin chào! 🎉 Mình là Empathic AI Assistant của DiChoiKhongLoHauQua! ✨\n\nMình ở đây để giúp bạn tìm những sự kiện siêu hot gần bạn! 🔥\n\nChỉ cần hỏi mình thôi, mình sẽ không trả lời chung chung đâu. Mình sẽ gợi ý những sự kiện đang diễn ra hoặc sắp diễn ra gần vị trí của bạn luôn! 💜\n\nHỏi mình bất cứ gì nhé! Mình hiểu bạn hơn người yêu cũ đấy! 😎✨",
        role: "assistant",
        timestamp: new Date(),
    };

    const [messages, setMessages] = useState([initialMessage]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);
    const keyboardHeight = useRef(0);
    const resetTimeoutRef = useRef(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);

    // Tự động scroll xuống tin nhắn mới nhất
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Xử lý keyboard show/hide để tự động scroll
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => {
                keyboardHeight.current = e.endCoordinates.height;
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                keyboardHeight.current = 0;
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Cleanup timeout khi component unmount
    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);

    const handleSend = async () => {
        const trimmedText = inputText.trim();
        if (!trimmedText || loading) return;

        // Thêm tin nhắn của người dùng
        const userMessage = {
            id: Date.now().toString(),
            text: trimmedText,
            role: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setLoading(true);

        try {
            // Chuẩn bị lịch sử cuộc trò chuyện (chỉ lấy 10 tin nhắn gần nhất để tiết kiệm token)
            const recentHistory = messages.slice(-10).map((msg) => ({
                role: msg.role,
                text: msg.text,
            }));

            // Gọi API Gemini
            const response = await sendMessageToGemini(trimmedText, recentHistory);

            // Xử lý response (có thể là string hoặc object)
            const responseText = typeof response === "string" ? response : response.text;
            const searchResults = response.searchResults;

            // Thêm phản hồi từ AI
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                role: "assistant",
                timestamp: new Date(),
                searchResults: searchResults, // Lưu kết quả tìm kiếm để có thể mở bản đồ
                searchType: response.searchType,
                radius: response.radius,
                needsSettings: response.needsSettings || false, // Flag để mở settings
                needsPermission: response.needsPermission || false,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);

            // Xác định loại lỗi và tạo message phù hợp
            let errorText = "";
            const errorMessage = error?.message || "";

            // Kiểm tra các loại lỗi phổ biến
            if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
                // Lỗi mạng
                errorText = "Oops! 😅 Mình đang gặp vấn đề với kết nối mạng. Bạn kiểm tra lại WiFi/4G giúp mình nha, rồi thử lại sau vài giây nhé! 📶✨";
            } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                // Lỗi timeout
                errorText = "Hmm, mình đang xử lý hơi lâu quá! ⏰ Bạn thử hỏi lại mình một lần nữa được không? Mình sẽ cố gắng trả lời nhanh hơn! 💪";
            } else if (errorMessage.includes("API") || errorMessage.includes("Gemini") || errorMessage.includes("HTTP")) {
                // Lỗi API
                errorText = "Xin lỗi bạn nhé! 😔 Mình đang gặp chút vấn đề kỹ thuật. Bạn thử lại sau một chút được không? Mình sẽ cố gắng sửa lại ngay! 🔧💜";
            } else if (errorMessage.includes("location") || errorMessage.includes("permission")) {
                // Lỗi liên quan đến vị trí
                errorText = "Mình không thể lấy vị trí của bạn được! 📍 Bạn kiểm tra giúp mình:\n\n1. Đã bật định vị trên điện thoại chưa?\n2. Đã cho phép ứng dụng truy cập vị trí chưa?\n\nSau đó thử lại nhé! ✨";
            } else {
                // Lỗi khác hoặc câu lệnh không xử lý được
                errorText = "Xin lỗi bạn nhé! 😅 Mình chưa hiểu rõ yêu cầu này của bạn. Bạn có thể:\n\n" +
                    "• Hỏi mình về sự kiện gần đây (ví dụ: \"Sự kiện cuối tuần\", \"Sự kiện gaming gần đây\")\n" +
                    "• Hỏi về vị trí hiện tại của bạn\n" +
                    "• Hoặc hỏi mình về chức năng của app\n\n" +
                    "Mình sẽ cố gắng giúp bạn tốt nhất có thể! 💜✨";
            }

            // Thêm tin nhắn lỗi
            const errorMessageObj = {
                id: (Date.now() + 1).toString(),
                text: errorText,
                role: "assistant",
                timestamp: new Date(),
                isError: true,
            };

            setMessages((prev) => [...prev, errorMessageObj]);

            // Chỉ hiển thị Alert cho lỗi nghiêm trọng
            if (errorMessage.includes("network") || errorMessage.includes("connection")) {
                Alert.alert("Lỗi kết nối", "Vui lòng kiểm tra kết nối mạng và thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMap = async (searchResults) => {
        if (!searchResults || searchResults.length === 0) {
            // Nếu không có kết quả, chỉ navigate đến Map
            navigation.navigate("Map");
            return;
        }

        // Lọc các sự kiện (events) từ kết quả tìm kiếm
        const events = searchResults.filter((result) => result.type === "event");

        if (events.length === 0) {
            // Nếu không có sự kiện nào, chỉ navigate đến Map
            navigation.navigate("Map");
            return;
        }

        if (events.length === 1) {
            // Nếu chỉ có 1 sự kiện, lấy đầy đủ thông tin và navigate
            const event = events[0];

            // Lấy đầy đủ thông tin event từ Firestore
            try {
                const fullEventData = await getEventById(event.id);

                if (fullEventData?.location?.lat && fullEventData?.location?.lng) {
                    // Navigate với đầy đủ thông tin như EventsListScreen
                    navigation.navigate("Map", {
                        center: {
                            latitude: fullEventData.location.lat,
                            longitude: fullEventData.location.lng,
                        },
                        focusEventId: event.id,
                        autoOpenDetail: true,
                        eventData: {
                            id: fullEventData.id,
                            title: fullEventData.title || fullEventData.name,
                            category: fullEventData.category,
                            location: fullEventData.location,
                            address: fullEventData.address,
                            description: fullEventData.description,
                        },
                    });
                } else {
                    // Nếu không có location, chỉ navigate với focusEventId
                    navigation.navigate("Map", {
                        focusEventId: event.id,
                        autoOpenDetail: true,
                    });
                }
            } catch (error) {
                console.error("Error getting event data:", error);
                // Fallback: navigate với ID
                navigation.navigate("Map", {
                    focusEventId: event.id,
                    autoOpenDetail: true,
                });
            }
        } else {
            // Nếu có nhiều sự kiện, hiển thị modal để người dùng chọn
            setModalEvents(events);
            setShowEventModal(true);
        }
    };

    const handleOpenSettings = async () => {
        try {
            await openLocationSettings();
        } catch (error) {
            console.error("Error opening settings:", error);
            Alert.alert(
                "Lỗi",
                "Không thể mở cài đặt. Vui lòng mở cài đặt thủ công và cho phép ứng dụng truy cập vị trí."
            );
        }
    };

    const handleQuickReply = (text) => {
        setInputText(text);
    };

    // Reset cuộc trò chuyện về ban đầu
    const resetConversation = () => {
        setMessages([{
            ...initialMessage,
            timestamp: new Date(),
        }]);
        setInputText("");
        Keyboard.dismiss();
    };

    // Xử lý khi bắt đầu giữ nút gửi
    const handleSendPressIn = () => {
        // Nếu nút disabled, không làm gì
        if (loading || !inputText.trim()) return;

        // Bắt đầu đếm 2 giây
        resetTimeoutRef.current = setTimeout(() => {
            // Sau 2 giây, reset cuộc trò chuyện
            resetConversation();
            Alert.alert(
                "Đã reset",
                "Cuộc trò chuyện đã được reset về ban đầu.",
                [{ text: "OK" }]
            );
        }, 2000); // 2 giây
    };

    // Xử lý khi thả nút gửi
    const handleSendPressOut = () => {
        // Nếu chưa đến 2 giây, hủy timeout và gửi tin nhắn bình thường
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.role === "user";
        const hasSearchResults = item.searchResults && item.searchResults.length > 0;
        const needsSettings = item.needsSettings || false;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                        item.isError && styles.errorBubble,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isUser ? styles.userMessageText : styles.assistantMessageText,
                        ]}
                    >
                        {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                    {hasSearchResults && !isUser && (
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => handleOpenMap(item.searchResults)}
                        >
                            <Ionicons name="map-outline" size={16} color="#8E2DE2" />
                            <Text style={styles.mapButtonText}>Xem trên bản đồ</Text>
                        </TouchableOpacity>
                    )}
                    {needsSettings && !isUser && (
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={handleOpenSettings}
                        >
                            <Ionicons name="settings-outline" size={16} color="#FF6B00" />
                            <Text style={styles.settingsButtonText}>Mở cài đặt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>🤖</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Empathic AI Assistant</Text>
                        <Text style={styles.headerSubtitle}>
                            {loading ? "Đang suy nghĩ..." : "Sẵn sàng hỗ trợ"}
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onContentSizeChange={() => {
                    if (keyboardHeight.current > 0) {
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }
                }}
                ListFooterComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#8E2DE2" />
                            <Text style={styles.loadingText}>AI đang trả lời...</Text>
                        </View>
                    ) : null
                }
            />

            {/* Quick Replies */}
            {!loading && inputText === "" && messages.length <= 1 && (
                <View style={styles.quickRepliesContainer}>
                    <Text style={styles.quickRepliesTitle}>Gợi ý câu hỏi:</Text>
                    <View style={styles.quickRepliesRow}>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện nào đang diễn ra gần đây?")}
                        >
                            <Text style={styles.quickReplyText}>🎉 Sự kiện hot</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện âm nhạc cuối tuần")}
                        >
                            <Text style={styles.quickReplyText}>🎵 Sự kiện âm nhạc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện party cuối tuần")}
                        >
                            <Text style={styles.quickReplyText}>🎊 Party</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện thể thao gần đây")}
                        >
                            <Text style={styles.quickReplyText}>⚽ Sự kiện thể thao</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    editable={!loading}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (loading || !inputText.trim()) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    onPressIn={handleSendPressIn}
                    onPressOut={handleSendPressOut}
                    disabled={loading || !inputText.trim()}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal chọn sự kiện */}
            <Modal
                visible={showEventModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEventModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn sự kiện</Text>
                            <TouchableOpacity
                                onPress={() => setShowEventModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Tìm thấy {modalEvents.length} sự kiện. Bạn muốn xem sự kiện nào?
                        </Text>
                        <FlatList
                            data={modalEvents}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={styles.modalEventItem}
                                    onPress={async () => {
                                        setShowEventModal(false);

                                        // Lấy đầy đủ thông tin event từ Firestore
                                        try {
                                            const fullEventData = await getEventById(item.id);

                                            if (fullEventData?.location?.lat && fullEventData?.location?.lng) {
                                                // Navigate với đầy đủ thông tin như EventsListScreen
                                                navigation.navigate("Map", {
                                                    center: {
                                                        latitude: fullEventData.location.lat,
                                                        longitude: fullEventData.location.lng,
                                                    },
                                                    focusEventId: item.id,
                                                    autoOpenDetail: true,
                                                    // Pass the event data directly to avoid race condition
                                                    eventData: {
                                                        id: fullEventData.id,
                                                        title: fullEventData.title || fullEventData.name,
                                                        category: fullEventData.category,
                                                        location: fullEventData.location,
                                                        address: fullEventData.address,
                                                        description: fullEventData.description,
                                                    },
                                                });
                                            } else {
                                                // Nếu không có location, chỉ navigate với focusEventId
                                                navigation.navigate("Map", {
                                                    focusEventId: item.id,
                                                    autoOpenDetail: true,
                                                });
                                            }
                                        } catch (error) {
                                            console.error("Error getting event data:", error);
                                            // Fallback: navigate với ID
                                            navigation.navigate("Map", {
                                                focusEventId: item.id,
                                                autoOpenDetail: true,
                                            });
                                        }
                                    }}
                                >
                                    <View style={styles.modalEventContent}>
                                        <Text style={styles.modalEventNumber}>{index + 1}</Text>
                                        <View style={styles.modalEventInfo}>
                                            <Text style={styles.modalEventName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.modalEventDistance}>
                                                {item.distance} • {item.category}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#8E2DE2" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            style={styles.modalEventList}
                            showsVerticalScrollIndicator={true}
                        />
                        <TouchableOpacity
                            style={styles.modalViewAllButton}
                            onPress={async () => {
                                setShowEventModal(false);

                                if (modalEvents.length > 0) {
                                    const firstEvent = modalEvents[0];

                                    // Lấy đầy đủ thông tin event đầu tiên
                                    try {
                                        const fullEventData = await getEventById(firstEvent.id);

                                        if (fullEventData?.location?.lat && fullEventData?.location?.lng) {
                                            navigation.navigate("Map", {
                                                center: {
                                                    latitude: fullEventData.location.lat,
                                                    longitude: fullEventData.location.lng,
                                                },
                                                focusEventId: firstEvent.id,
                                                autoOpenDetail: false,
                                            });
                                        } else {
                                            navigation.navigate("Map", {
                                                focusEventId: firstEvent.id,
                                                autoOpenDetail: false,
                                            });
                                        }
                                    } catch (error) {
                                        console.error("Error getting event data:", error);
                                        navigation.navigate("Map", {
                                            focusEventId: firstEvent.id,
                                            autoOpenDetail: false,
                                        });
                                    }
                                } else {
                                    // Nếu không có events, chỉ navigate đến Map
                                    navigation.navigate("Map");
                                }
                            }}
                        >
                            <Ionicons name="map-outline" size={20} color="#fff" />
                            <Text style={styles.modalViewAllText}>Xem tất cả trên bản đồ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

ChatScreen.propTypes = {
    navigation: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
    }).isRequired,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F7FB",
    },
    header: {
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#8E2DE2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 12,
    },
    userMessageContainer: {
        alignItems: "flex-end",
    },
    assistantMessageContainer: {
        alignItems: "flex-start",
    },
    messageBubble: {
        maxWidth: "75%",
        padding: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: "#8E2DE2",
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#eee",
    },
    errorBubble: {
        backgroundColor: "#FFEBEE",
        borderColor: "#FF4E4E",
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userMessageText: {
        color: "#fff",
    },
    assistantMessageText: {
        color: "#333",
    },
    timestamp: {
        fontSize: 11,
        color: "rgba(0,0,0,0.4)",
        marginTop: 4,
        alignSelf: "flex-end",
    },
    mapButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#F0E6FF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#8E2DE2",
    },
    mapButtonText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: "600",
        color: "#8E2DE2",
    },
    settingsButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#FFF3E0",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FF6B00",
    },
    settingsButtonText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: "600",
        color: "#FF6B00",
    },
    quickRepliesContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    quickRepliesTitle: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
        fontWeight: "600",
    },
    quickRepliesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    quickReplyChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#F7F7FB",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    quickReplyText: {
        fontSize: 13,
        color: "#333",
        fontWeight: "500",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 13,
        color: "#666",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
    },
    input: {
        flex: 1,
        backgroundColor: "#F7F7FB",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: "#333",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#8E2DE2",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: "#ccc",
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
        paddingBottom: Platform.OS === "ios" ? 30 : 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
    },
    modalCloseButton: {
        padding: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#666",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    modalEventList: {
        maxHeight: 400,
    },
    modalEventItem: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    modalEventContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    modalEventNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#8E2DE2",
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
        textAlignVertical: "center",
        marginRight: 12,
    },
    modalEventInfo: {
        flex: 1,
        marginRight: 8,
    },
    modalEventName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222",
        marginBottom: 4,
    },
    modalEventDistance: {
        fontSize: 13,
        color: "#666",
    },
    modalViewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#8E2DE2",
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 12,
    },
    modalViewAllText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
});
