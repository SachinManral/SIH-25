// src/screens/CreateReportScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";

const { width, height } = Dimensions.get("window");

// Responsive helper functions
const scale = (size) => Math.min(width / 375, 1.2) * size;
const verticalScale = (size) => Math.min(height / 812, 1.1) * size;
const moderateScale = (size, factor = 0.3) => size + (scale(size) - size) * factor;

export default function CreateReportScreen({ navigation }: any) {
  // Form state
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [customLocation, setCustomLocation] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const categories = [
    { label: "Select Category", value: "", icon: "format-list-bulleted" },
    { label: "Roads & Infrastructure", value: "roads", icon: "road" },
    { label: "Garbage & Waste", value: "garbage", icon: "trash-can" },
    { label: "Street Lighting", value: "streetlight", icon: "lightbulb" },
    { label: "Water Supply", value: "water", icon: "water-pump" },
    { label: "Construction Issues", value: "construction", icon: "hammer-screwdriver" },
    { label: "Traffic Issues", value: "traffic", icon: "traffic-light" },
    { label: "Environmental", value: "environment", icon: "leaf" },
    { label: "Noise Pollution", value: "noise", icon: "volume-high" },
    { label: "Public Services", value: "services", icon: "account-group" },
    { label: "Other", value: "other", icon: "help-circle" }
  ];

  // Get user details on component mount
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email?.split('@')[0] || "Anonymous User");
    }
  }, []);

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case 'category':
        return value ? '' : 'Please select a category';
      case 'title':
        return value.trim().length >= 5 ? '' : 'Title must be at least 5 characters';
      case 'description':
        return value.trim().length >= 20 ? '' : 'Description must be at least 20 characters';
      case 'image':
        return value ? '' : 'Photo evidence is required';
      default:
        return '';
    }
  };

  const handleFieldChange = (field, value) => {
    switch (field) {
      case 'category':
        setCategory(value);
        break;
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'customLocation':
        setCustomLocation(value);
        break;
    }

    // Validate if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Image picker with camera/gallery options
  const showImagePicker = () => {
    setImageModalVisible(true);
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageModalVisible(false);
      
      // Clear image error if it exists
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageModalVisible(false);
      
      // Clear image error if it exists
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const removeImage = () => {
    setImage(null);
    setTouched(prev => ({ ...prev, image: true }));
    setErrors(prev => ({ ...prev, image: 'Photo evidence is required' }));
  };

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (imageUri: string): Promise<string> => {
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create a unique filename
      const filename = `reports/${auth.currentUser?.uid || 'anonymous'}_${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);

      // Upload the image
      await uploadBytes(imageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Location functions
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for accurate reporting.");
        setLocationLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocoding to get address
      let address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Format complete address
      let formattedAddress = '';
      if (address[0]) {
        const addr = address[0];
        const parts = [];
        
        if (addr.streetNumber && addr.street) {
          parts.push(`${addr.streetNumber} ${addr.street}`);
        } else if (addr.street) {
          parts.push(addr.street);
        }
        
        if (addr.district || addr.subregion) {
          parts.push(addr.district || addr.subregion);
        }
        
        if (addr.city) {
          parts.push(addr.city);
        }
        
        if (addr.region) {
          parts.push(addr.region);
        }
        
        if (addr.country) {
          parts.push(addr.country);
        }
        
        formattedAddress = parts.filter(part => part && part.trim()).join(', ');
      }

      const locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: formattedAddress || `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`,
      };

      setLocation(locationData);
      setCustomLocation(locationData.address);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert("Location Error", "Unable to fetch current location. Please enter manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const showLocationOptions = () => {
    setLocationModalVisible(true);
  };

  // Submit report with validation and image upload
  const submitReport = async () => {
    const fieldsToValidate = { category, title, description, image };
    const newErrors = {};

    Object.keys(fieldsToValidate).forEach(field => {
      const error = validateField(field, fieldsToValidate[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.fromEntries(Object.keys(fieldsToValidate).map(field => [field, true])));
      Alert.alert("Validation Error", "Please fix all errors before submitting.");
      return;
    }

    if (!location && !customLocation.trim()) {
      Alert.alert("Location Required", "Please provide location information for the issue.");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Authentication Error", "Please log in to submit a report.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image to Firebase Storage if image exists
      if (image) {
        try {
          imageUrl = await uploadImageToStorage(image);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          Alert.alert("Upload Error", "Failed to upload image. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Prepare report data
      const reportData = {
        category: category,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl, // Use the Firebase Storage URL
        location: location || null,
        customLocation: customLocation.trim() || null,
        status: "Pending",
        userName: userName,
        userEmail: auth.currentUser.email || "anonymous@example.com",
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Submitting report data:', reportData);

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "reports"), reportData);
      console.log('Report submitted successfully with ID:', docRef.id);

      Alert.alert(
        "Success!", 
        "Your issue has been reported successfully. You'll receive updates on the progress.",
        [{ 
          text: "OK", 
          onPress: () => {
            // Reset form
            setCategory("");
            setTitle("");
            setDescription("");
            setImage(null);
            setLocation(null);
            setCustomLocation("");
            setErrors({});
            setTouched({});
            
            // Navigate back
            navigation.goBack();
          }
        }]
      );
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = "Something went wrong. Please try again.";
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        errorMessage = "You don't have permission to submit reports. Please check your account.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Service is currently unavailable. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Submission Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field, placeholder, multiline = false) => {
    const value = { title, description, customLocation }[field];
    
    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          errors[field] && touched[field] && styles.inputError
        ]}>
          <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => handleFieldChange(field, text)}
            onBlur={() => handleFieldBlur(field, value)}
            style={[
              styles.input,
              multiline && styles.multilineInput
            ]}
            placeholderTextColor="#9E9E9E"
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        </View>
        {errors[field] && touched[field] && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#F57C00" />
            <Text style={styles.errorText}>{errors[field]}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Issue</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#0D47A1" />
              </View>
              <Text style={styles.formTitle}>Report a Civic Issue</Text>
              <Text style={styles.formSubtitle}>Help make your community better by reporting issues</Text>
            </View>

            {/* Category Dropdown */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={[
                styles.dropdownWrapper,
                errors.category && touched.category && styles.inputError
              ]}>
                <MaterialCommunityIcons 
                  name={categories.find(cat => cat.value === category)?.icon || "format-list-bulleted"} 
                  size={18} 
                  color={category ? "#0D47A1" : "#9E9E9E"} 
                  style={styles.dropdownIcon} 
                />
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => handleFieldChange('category', itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#9E9E9E"
                >
                  {categories.map((cat) => (
                    <Picker.Item 
                      key={cat.value} 
                      label={cat.label} 
                      value={cat.value}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
              {errors.category && touched.category && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#F57C00" />
                  <Text style={styles.errorText}>{errors.category}</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Issue Title *</Text>
              {renderInput('title', 'Brief issue title')}
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description *</Text>
              {renderInput('description', 'Describe the issue in detail', true)}
            </View>

            {/* Image Upload - Required */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Photo Evidence *</Text>
              <TouchableOpacity 
                style={[
                  styles.uploadBox,
                  errors.image && touched.image && styles.uploadBoxError
                ]} 
                onPress={showImagePicker}
              >
                {image ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.uploadedImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <MaterialCommunityIcons 
                      name="camera-plus" 
                      size={40} 
                      color={errors.image && touched.image ? "#F57C00" : "#42A5F5"} 
                    />
                    <Text style={[
                      styles.uploadText, 
                      {color: errors.image && touched.image ? "#F57C00" : "#0D47A1"}
                    ]}>
                      {errors.image && touched.image ? "Photo Required *" : "Add Photo"}
                    </Text>
                    <Text style={styles.uploadSubtext}>Camera or Gallery</Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.image && touched.image && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color="#F57C00" />
                  <Text style={styles.errorText}>{errors.image}</Text>
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              {renderInput('customLocation', 'Enter location details')}
              
              <TouchableOpacity style={styles.locationButton} onPress={showLocationOptions}>
                <MaterialCommunityIcons 
                  name="map-marker-plus" 
                  size={18} 
                  color="#FFFFFF" 
                  style={styles.locationIcon} 
                />
                {locationLoading ? (
                  <View style={styles.locationLoadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.locationButtonText}>Getting location...</Text>
                  </View>
                ) : (
                  <Text style={styles.locationButtonText}>Use Current Location</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={submitReport}
              style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    {image && !image.startsWith('https://') ? 'Uploading...' : 'Submitting...'}
                  </Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>

            {/* User Info Display */}
            <View style={styles.userInfoContainer}>
              <MaterialCommunityIcons name="account-circle" size={16} color="#9E9E9E" />
              <Text style={styles.userInfoText}>Reporting as: {userName}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Image Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Photo</Text>
              <Text style={styles.modalSubtitle}>Photo evidence helps authorities understand and resolve the issue faster</Text>
              
              <TouchableOpacity style={styles.modalButton} onPress={pickImageFromCamera}>
                <MaterialCommunityIcons name="camera" size={24} color="#0D47A1" />
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalButton} onPress={pickImageFromGallery}>
                <MaterialCommunityIcons name="image" size={24} color="#0D47A1" />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Options Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={locationModalVisible}
          onRequestClose={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Location Options</Text>
              
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  setLocationModalVisible(false);
                  getCurrentLocation();
                }}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#0D47A1" />
                <Text style={styles.modalButtonText}>Use Current Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setLocationModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ================== Container ==================
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },

  // ================== Header ==================
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + verticalScale(10) : verticalScale(10),
    paddingBottom: verticalScale(15),
    backgroundColor: '#0D47A1', // Dark Blue header
    elevation: 4,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowOffset: { width: 0, height: 4 },
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#FFFFFF', // White text
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(40),
  },

  // ================== Scroll Container ==================
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Ash Gray background
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
  },

  // ================== Form Card ==================
  formCard: {
    backgroundColor: "#FFFFFF", // White card
    borderRadius: moderateScale(20),
    padding: scale(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // ================== Form Header ==================
  formHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
    paddingBottom: verticalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5', // Ash Gray border
  },
  formIconContainer: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(13, 71, 161, 0.1)', // Light Dark Blue background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  formTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#0D47A1', // Dark Blue text
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: moderateScale(14),
    color: '#9E9E9E', // Gray text
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: 20,
  },

  // ================== Field Container ==================
  fieldContainer: {
    marginBottom: verticalScale(20),
  },
  fieldLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#0D47A1', // Dark Blue text
    marginBottom: verticalScale(8),
  },

  // ================== Input Styling ==================
  inputContainer: {
    marginBottom: verticalScale(4),
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5", // Ash Gray background
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#F5F5F5",
    paddingHorizontal: scale(16),
    height: 52,
    justifyContent: 'center',
  },
  multilineWrapper: {
    height: 100,
    paddingVertical: verticalScale(12),
    justifyContent: 'flex-start',
  },
  input: {
    fontSize: moderateScale(15),
    color: "#0D47A1", // Dark Blue text
    paddingVertical: 0,
    height: '100%',
  },
  multilineInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: "#F57C00", // Orange border for errors
    borderWidth: 1.5,
    backgroundColor: "#FFF8E7", // Light orange background
  },

  // ================== Dropdown ==================
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F5F5F5", // Ash Gray background
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#F5F5F5",
    paddingHorizontal: scale(16),
    minHeight: 52,
    paddingVertical: verticalScale(4),
  },
  dropdownIcon: {
    marginRight: scale(10),
  },
  picker: {
    flex: 1,
    color: "#0D47A1", // Dark Blue text
    fontSize: moderateScale(15),
    paddingVertical: Platform.OS === 'android' ? 0 : 8,
  },
  pickerItem: {
    fontSize: moderateScale(15),
    color: "#0D47A1", // Dark Blue text
  },

  // ================== Upload Box ==================
  uploadBox: {
    height: verticalScale(150),
    backgroundColor: "#F5F5F5", // Ash Gray background
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: "#42A5F5", // Light Blue border
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadBoxError: {
    borderColor: "#F57C00", // Orange border for error
    backgroundColor: "#FFF8E7", // Light orange background
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
  },
  removeImageButton: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: scale(12),
    width: scale(24),
    height: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginTop: verticalScale(8),
  },
  uploadSubtext: {
    fontSize: moderateScale(13),
    color: '#9E9E9E', // Gray text
    marginTop: verticalScale(4),
  },

  // ================== Location ==================
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#42A5F5', // Light Blue button
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    marginTop: verticalScale(8),
    shadowColor: '#42A5F5',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locationIcon: {
    marginRight: scale(8),
  },
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFFFFF', // White text
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginLeft: scale(4),
  },

  // ================== Submit Button ==================
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F57C00', // Orange button
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    marginTop: verticalScale(10),
    shadowColor: '#F57C00',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF', // White text
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginLeft: scale(8),
  },

  // ================== User Info ==================
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5', // Ash Gray border
  },
  userInfoText: {
    fontSize: moderateScale(14),
    color: '#9E9E9E', // Gray text
    fontWeight: '500',
    marginLeft: scale(6),
  },

  // ================== Error Styling ==================
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
    paddingHorizontal: scale(4),
  },
  errorText: {
    color: "#F57C00", // Orange error text
    fontSize: moderateScale(12),
    marginLeft: scale(4),
    flex: 1,
  },

  // ================== Modal Styling ==================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // White background
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#0D47A1', // Dark Blue text
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#9E9E9E', // Gray text
    textAlign: 'center',
    marginBottom: verticalScale(20),
    lineHeight: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: '#F5F5F5', // Ash Gray background
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(13, 71, 161, 0.1)', // Light Dark Blue border
  },
  modalButtonText: {
    fontSize: moderateScale(16),
    color: '#0D47A1', // Dark Blue text
    fontWeight: '600',
    marginLeft: scale(12),
  },
  modalCancelButton: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5', // Ash Gray border
    marginTop: verticalScale(8),
  },
  modalCancelText: {
    fontSize: moderateScale(16),
    color: '#9E9E9E', // Gray text
    fontWeight: '600',
  },
});