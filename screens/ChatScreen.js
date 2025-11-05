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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessageToGemini, openLocationSettings } from "../services/geminiService";

export default function ChatScreen({ navigation }) {
    const [messages, setMessages] = useState([
        {
            id: "1",
            text: "Xin chào! Tôi là trợ lý AI của ứng dụng DiChoiKhongLoHauQua. Tôi có thể giúp bạn tìm kiếm sự kiện, địa điểm hoặc trả lời các câu hỏi. Hãy hỏi tôi bất cứ điều gì! 👋",
            role: "assistant",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);
    const keyboardHeight = useRef(0);

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

            // Thêm tin nhắn lỗi
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `Xin lỗi, đã xảy ra lỗi: ${error.message}. Vui lòng thử lại sau.`,
                role: "assistant",
                timestamp: new Date(),
                isError: true,
            };

            setMessages((prev) => [...prev, errorMessage]);

            Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng và thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMap = () => {
        navigation.navigate("Map");
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
                            onPress={handleOpenMap}
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
                        <Text style={styles.headerTitle}>AI Assistant</Text>
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
                            onPress={() => handleQuickReply("Tìm quán cafe ở gần 5km")}
                        >
                            <Text style={styles.quickReplyText}>☕ Cafe gần đây</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Quán bida nào gần đây?")}
                        >
                            <Text style={styles.quickReplyText}>🎱 Quán bida</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Tìm quán net gần đây")}
                        >
                            <Text style={styles.quickReplyText}>💻 Quán net</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickRepliesRow}>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Nhà hàng nào gần đây?")}
                        >
                            <Text style={styles.quickReplyText}>🍽️ Nhà hàng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện âm nhạc cuối tuần")}
                        >
                            <Text style={styles.quickReplyText}>🎵 Sự kiện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickReplyChip}
                            onPress={() => handleQuickReply("Sự kiện nào đang diễn ra gần đây?")}
                        >
                            <Text style={styles.quickReplyText}>🎉 Sự kiện hot</Text>
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
                    disabled={loading || !inputText.trim()}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
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
});
