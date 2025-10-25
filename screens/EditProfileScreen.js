import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditProfileScreen({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Address states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  
  // Modal states for dropdowns
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  // Load profile info
  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setProfile(snap.data());
        else
          setProfile({
            email: auth.currentUser?.email,
            displayName: "",
            phone: "",
            bio: "",
            address: "",
            specificAddress: "",
            birthDate: "",
            gender: "",
            provinceCode: "",
            districtCode: "",
            wardCode: "",
          });
      } catch (e) {
        console.log("Load profile error", e);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, [uid]);

  // Load provinces
  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      console.log('Loading provinces from provinces.open-api.vn...');
      
      const response = await fetch('https://provinces.open-api.vn/api/p/');
      console.log('Provinces response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Provinces API response:', data);
      console.log('Provinces data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('Setting provinces:', data.length, 'items');
        setProvinces(data);
      } else {
        console.log('Unexpected provinces data structure:', data);
        // Fallback: try alternative API or use hardcoded data
        const fallbackProvinces = [
          { code: '01', name: 'Hà Nội' },
          { code: '79', name: 'TP. Hồ Chí Minh' },
          { code: '48', name: 'Đà Nẵng' },
          { code: '15', name: 'Hải Phòng' },
          { code: '31', name: 'Cần Thơ' },
        ];
        console.log('Using fallback provinces:', fallbackProvinces.length, 'items');
        setProvinces(fallbackProvinces);
      }
    } catch (error) {
      console.log('Load provinces error:', error);
      // Fallback on error
      const fallbackProvinces = [
        { code: '01', name: 'Hà Nội' },
        { code: '79', name: 'TP. Hồ Chí Minh' },
        { code: '48', name: 'Đà Nẵng' },
        { code: '15', name: 'Hải Phòng' },
        { code: '31', name: 'Cần Thơ' },
      ];
      console.log('Using fallback provinces due to error:', fallbackProvinces.length, 'items');
      setProvinces(fallbackProvinces);
      Alert.alert('Cảnh báo', `Không thể tải danh sách đầy đủ. Sử dụng danh sách cơ bản.`);
    } finally {
      setLoadingProvinces(false);
    }
  };

  

  // Load districts by province
  const loadDistricts = async (provinceId) => {
    if (!provinceId) return;
    try {
      setLoadingDistricts(true);
      console.log('Loading districts for province:', provinceId);
      
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`);
      console.log('Districts response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Districts API response:', data);
      
      if (data && data.districts && Array.isArray(data.districts)) {
        console.log('Setting districts:', data.districts.length, 'items');
        setDistricts(data.districts);
      } else {
        console.log('Unexpected districts data structure:', data);
        Alert.alert('Lỗi', 'Không thể tải danh sách quận/huyện');
      }
    } catch (error) {
      console.log('Load districts error:', error);
      Alert.alert('Lỗi', `Không thể tải danh sách quận/huyện: ${error.message}`);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Load wards by district
  const loadWards = async (districtId) => {
    if (!districtId) return;
    try {
      setLoadingWards(true);
      console.log('Loading wards for district:', districtId);
      
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`);
      console.log('Wards response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Wards API response:', data);
      
      if (data && data.wards && Array.isArray(data.wards) && data.wards.length > 0) {
        console.log('Setting wards:', data.wards.length, 'items');
        setWards(data.wards);
      } else {
        console.log('Unexpected wards data structure:', data);
        // Fallback: try alternative API or use hardcoded data
        const fallbackWards = [
          { code: '001', name: 'Phường 1' },
          { code: '002', name: 'Phường 2' },
          { code: '003', name: 'Phường 3' },
          { code: '004', name: 'Phường 4' },
          { code: '005', name: 'Phường 5' },
        ];
        console.log('Using fallback wards:', fallbackWards.length, 'items');
        setWards(fallbackWards);
      }
    } catch (error) {
      console.log('Load wards error:', error);
      // Fallback on error
      const fallbackWards = [
        { code: '001', name: 'Phường 1' },
        { code: '002', name: 'Phường 2' },
        { code: '003', name: 'Phường 3' },
        { code: '004', name: 'Phường 4' },
        { code: '005', name: 'Phường 5' },
      ];
      console.log('Using fallback wards due to error:', fallbackWards.length, 'items');
      setWards(fallbackWards);
      Alert.alert('Cảnh báo', `Không thể tải danh sách đầy đủ. Sử dụng danh sách cơ bản.`);
    } finally {
      setLoadingWards(false);
    }
  };

  // Restore address selections from saved profile
  const restoreAddressSelections = async () => {
    if (!profile?.provinceCode) return;
    
    // Set province
    setSelectedProvince(profile.provinceCode);
    
    // Load districts for this province
    if (profile.districtCode) {
      await loadDistricts(profile.provinceCode);
      setSelectedDistrict(profile.districtCode);
      
      // Load wards for this district
      if (profile.wardCode) {
        await loadWards(profile.districtCode);
        setSelectedWard(profile.wardCode);
      }
    }
  };

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Restore address selections when provinces are loaded and profile exists
  useEffect(() => {
    if (provinces.length > 0 && profile?.provinceCode) {
      restoreAddressSelections();
    }
  }, [provinces, profile?.provinceCode]);

  // Handle province selection
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);
    if (provinceId) {
      loadDistricts(provinceId);
    }
  };

  // Handle district selection
  const handleDistrictChange = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedWard('');
    setWards([]);
    if (districtId) {
      loadWards(districtId);
    }
  };

  // Handle ward selection
  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
  };

  // Get full address string
  const getFullAddress = () => {
    const province = provinces.find(p => p.code === selectedProvince);
    const district = districts.find(d => d.code === selectedDistrict);
    const ward = wards.find(w => w.code === selectedWard);
    
    let address = '';
    if (ward) address += ward.name + ', ';
    if (district) address += district.name + ', ';
    if (province) address += province.name;
    
    return address.trim();
  };

  // Format birth date automatically
  const formatBirthDate = (text) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Limit to 8 digits (DDMMYYYY)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Format based on length
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 4) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
    } else {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2, 4)}/${limitedNumbers.slice(4)}`;
    }
  };

  // Validate birth date
  const validateBirthDate = (dateStr) => {
    // Yêu cầu phải nhập đủ ngày/tháng/năm (10 ký tự)
    if (!dateStr || dateStr.length !== 10) return false;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Kiểm tra các phần có phải là số hợp lệ không
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    // Kiểm tra tháng phải từ 1-12
    if (month < 1 || month > 12) return false;
    
    // Kiểm tra năm hợp lệ
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Kiểm tra ngày hợp lệ với tháng đó
    if (day < 1 || day > 31) return false;
    
    // Kiểm tra ngày có tồn tại trong tháng đó không
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  // Validate required fields
  const validateRequiredFields = () => {
    const errors = [];
    
    if (!profile?.displayName?.trim()) {
      errors.push('Họ tên không được để trống');
    }
    
    if (!profile?.phone?.trim()) {
      errors.push('Số điện thoại không được để trống');
    }
    
    if (!selectedProvince) {
      errors.push('Vui lòng chọn tỉnh/thành phố');
    }
    
    if (!selectedDistrict) {
      errors.push('Vui lòng chọn quận/huyện');
    }
    
    if (!selectedWard) {
      errors.push('Vui lòng chọn phường/xã');
    }
    
    if (!profile?.birthDate?.trim()) {
      errors.push('Ngày sinh không được để trống');
    } else if (!validateBirthDate(profile.birthDate)) {
      errors.push('Ngày sinh không hợp lệ. Vui lòng nhập đủ ngày/tháng/năm (DD/MM/YYYY)');
    }
    
    if (!profile?.gender?.trim()) {
      errors.push('Vui lòng chọn giới tính');
    }
    
    return errors;
  };

  // Save profile info
  const handleSave = async () => {
    if (!profile) return;
    
    // Validate required fields
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      Alert.alert("Thiếu thông tin bắt buộc", validationErrors.join('\n'));
      return;
    }
    
    setSaving(true);
    try {
      // Get full address
      const fullAddress = getFullAddress();
      
      await updateDoc(doc(db, "users", uid), {
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        address: fullAddress || "",
        specificAddress: profile.specificAddress || "",
        birthDate: profile.birthDate || "",
        gender: profile.gender || "",
        // Save address codes for easy restoration
        provinceCode: selectedProvince || "",
        districtCode: selectedDistrict || "",
        wardCode: selectedWard || "",
      });
      Alert.alert("✅ Đã lưu", "Thông tin cá nhân đã được cập nhật!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.log("Save error", err);
      Alert.alert("Lỗi", "Không thể lưu thông tin.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8E2DE2" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView 
      style={styles.keyboardAvoidingView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
    >
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>

      {/* Avatar Display */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 36 }}>
            {profile?.email?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
      </View>

      {/* Form fields */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyText}>{profile?.email || "Chưa có"}</Text>
        </View>

        <Text style={styles.label}>Họ tên <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[
            styles.input,
            !profile?.displayName?.trim() && styles.inputRequired
          ]}
          placeholder="Nhập họ tên..."
          value={profile?.displayName || ""}
          onChangeText={(t) => setProfile({ ...profile, displayName: t })}
        />

        <Text style={styles.label}>Số điện thoại <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[
            styles.input,
            !profile?.phone?.trim() && styles.inputRequired
          ]}
          placeholder="Nhập số điện thoại..."
          keyboardType="phone-pad"
          value={profile?.phone || ""}
          onChangeText={(t) => setProfile({ ...profile, phone: t })}
        />

        <Text style={styles.label}>Giới thiệu</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          placeholder="Mô tả ngắn về bạn..."
          value={profile?.bio || ""}
          onChangeText={(t) => setProfile({ ...profile, bio: t })}
        />

        <Text style={styles.label}>Địa chỉ</Text>
        
        {/* Province Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Tỉnh/Thành phố <Text style={styles.required}>*</Text></Text>
          {loadingProvinces ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8E2DE2" />
              <Text style={styles.loadingText}>Đang tải danh sách tỉnh/thành phố...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedProvince ? 
                  provinces.find(p => p.code === selectedProvince)?.name || 'Chọn tỉnh/thành phố...' 
                  : 'Chọn tỉnh/thành phố...'
                }
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* District Picker */}
        {selectedProvince && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Quận/Huyện <Text style={styles.required}>*</Text></Text>
            {loadingDistricts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8E2DE2" />
                <Text style={styles.loadingText}>Đang tải danh sách quận/huyện...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedDistrict ? 
                    districts.find(d => d.code === selectedDistrict)?.name || 'Chọn quận/huyện...' 
                    : 'Chọn quận/huyện...'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Ward Picker */}
        {selectedDistrict && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Phường/Xã <Text style={styles.required}>*</Text></Text>
            {loadingWards ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8E2DE2" />
                <Text style={styles.loadingText}>Đang tải danh sách phường/xã...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowWardModal(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedWard ? 
                    wards.find(w => w.code === selectedWard)?.name || 'Chọn phường/xã...' 
                    : 'Chọn phường/xã...'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Specific Address Input */}
        <Text style={styles.label}>Địa chỉ cụ thể</Text>
        <TextInput
          style={styles.input}
          placeholder="Số nhà, tên đường, tòa nhà..."
          value={profile?.specificAddress || ""}
          onChangeText={(t) => setProfile({ ...profile, specificAddress: t })}
        />

        {/* Display full address */}
        {getFullAddress() && (
          <View style={styles.addressDisplay}>
            <Text style={styles.addressLabel}>Địa chỉ đã chọn:</Text>
            <Text style={styles.addressText}>
              {profile?.specificAddress ? `${profile.specificAddress}, ` : ''}{getFullAddress()}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Ngày sinh <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[
            styles.input,
            (!profile?.birthDate?.trim() || (profile?.birthDate && !validateBirthDate(profile.birthDate))) && styles.inputRequired
          ]}
          placeholder="DD/MM/YYYY"
          value={profile?.birthDate || ""}
          onChangeText={(text) => {
            console.log('Input text:', text);
            const formatted = formatBirthDate(text);
            console.log('Formatted text:', formatted);
            setProfile({ ...profile, birthDate: formatted });
          }}
          keyboardType="numeric"
          maxLength={10}
        />
        {profile?.birthDate && !validateBirthDate(profile.birthDate) && (
          <Text style={styles.errorText}>
            {profile.birthDate.length < 10 
              ? 'Vui lòng nhập đủ ngày/tháng/năm (DD/MM/YYYY)' 
              : 'Ngày sinh không hợp lệ'
            }
          </Text>
        )}

        <Text style={styles.label}>Giới tính <Text style={styles.required}>*</Text></Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Nam" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Nam" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Nam" && styles.genderButtonTextSelected
            ]}>
               Nam
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Nữ" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Nữ" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Nữ" && styles.genderButtonTextSelected
            ]}>
               Nữ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Khác" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Khác" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Khác" && styles.genderButtonTextSelected
            ]}>
              🏳️ Khác
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? "Đang lưu..." : " Lưu thay đổi"}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.btnCancel} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnCancelText}> Hủy</Text>
      </TouchableOpacity>

      {/* Province Selection Modal */}
      <Modal
        visible={showProvinceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Tỉnh/Thành phố</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowProvinceModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={provinces}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedProvince === item.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    handleProvinceChange(item.code);
                    setShowProvinceModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedProvince === item.code && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Quận/Huyện</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDistrictModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={districts}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedDistrict === item.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    handleDistrictChange(item.code);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedDistrict === item.code && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Ward Selection Modal */}
      <Modal
        visible={showWardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Phường/Xã</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowWardModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={wards}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedWard === item.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    handleWardChange(item.code);
                    setShowWardModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedWard === item.code && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F7F7FB",
    paddingBottom: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2D1B69",
    marginTop: 30,
  },
  avatarWrap: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#8E2DE2",
    borderRadius: 90,
    padding: 4,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ddd",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8E2DE2",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  label: { fontWeight: "600", color: "#333", marginTop: 6, marginBottom: 3 },
  input: {
    backgroundColor: "#F7F7FB",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: "#8E2DE2",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    minHeight: 50,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "#8E2DE2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 44,
  },
  btnOutlineText: { color: "#8E2DE2", fontWeight: "600" },
  btnCancel: {
    backgroundColor: "#FF4E4E",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    minHeight: 50,
  },
  btnCancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 3,
    alignItems: "center",
    minHeight: 48,
  },
  genderButtonSelected: {
    backgroundColor: "#8E2DE2",
    borderColor: "#8E2DE2",
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  genderButtonTextSelected: {
    color: "#fff",
  },
  readOnlyField: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  readOnlyText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },
  inputError: {
    borderColor: "#FF4E4E",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF4E4E",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    fontSize: 14,
  },
  pickerWrapper: {
    backgroundColor: "#F7F7FB",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 48,
    backgroundColor: "#F7F7FB",
  },
  addressDisplay: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addressLabel: {
    fontWeight: "600",
    color: "#2E7D32",
    fontSize: 12,
    marginBottom: 4,
  },
  addressText: {
    color: "#1B5E20",
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F7F7FB",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  debugContainer: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFEAA7",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 4,
  },
  dropdownButton: {
    backgroundColor: "#F7F7FB",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemSelected: {
    backgroundColor: "#8E2DE2",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  modalItemTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  required: {
    color: "#FF4E4E",
    fontWeight: "bold",
  },
  inputRequired: {
    borderColor: "#FF4E4E",
    borderWidth: 2,
    backgroundColor: "#FFF5F5",
  },
});
