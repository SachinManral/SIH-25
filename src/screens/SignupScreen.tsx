import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

const { width, height } = Dimensions.get("window");

// Type definitions
interface NavigationProps {
  navigation: {
    goBack: () => void;
    replace: (screen: string) => void;
    navigate: (screen: string) => void;
  };
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  govtId?: string;
  address?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
}

interface TouchedFields {
  fullName?: boolean;
  email?: boolean;
  phone?: boolean;
  gender?: boolean;
  govtId?: boolean;
  address?: boolean;
  city?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export default function SignupScreen({ navigation }: NavigationProps) {
  // ----- Form state -----
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [govtId, setGovtId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ----- Validation state -----
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  // ----- Google Sign-In -----
  const redirectUri = makeRedirectUri({
    scheme: "nagarni", // set your app scheme here
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((user) => {
          Alert.alert("Success", `Logged in as ${user.user.email}`);
          navigation.replace("Home");
        })
        .catch((err) => Alert.alert("Google Login Error", err.message));
    }
  }, [response, navigation]);

  // ----- Validation functions -----
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number validation
    return phoneRegex.test(phone);
  };

  const validateAadhaar = (aadhaar: string): boolean => {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar);
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        return validateName(value) ? '' : 'Name must be at least 2 characters and contain only letters';
      case 'email':
        return validateEmail(value) ? '' : 'Please enter a valid email address';
      case 'phone':
        return validatePhone(value) ? '' : 'Please enter a valid 10-digit phone number';
      case 'gender':
        return value ? '' : 'Please select your gender';
      case 'govtId':
        return validateAadhaar(value) ? '' : 'Please enter a valid 12-digit Aadhaar number';
      case 'address':
        return value.trim().length >= 10 ? '' : 'Address must be at least 10 characters';
      case 'city':
        return value.trim().length >= 2 ? '' : 'Please enter a valid city name';
      case 'password':
        return validatePassword(value) ? '' : 'Password must be 8+ characters with uppercase, lowercase, and number';
      case 'confirmPassword':
        return value === password ? '' : 'Passwords do not match';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Update the field value
    switch (field) {
      case 'fullName':
        setFullName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'gender':
        setGender(value);
        break;
      case 'govtId':
        setGovtId(value);
        break;
      case 'address':
        setAddress(value);
        break;
      case 'city':
        setCity(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }

    // Validate if field has been touched
    if (touched[field as keyof TouchedFields]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = (): boolean => {
    const fields = ['fullName', 'email', 'phone', 'gender', 'govtId', 'address', 'city', 'password', 'confirmPassword'];
    const newErrors: ValidationErrors = {};
    const values: Record<string, string> = { 
      fullName, email, phone, gender, govtId, address, city, password, confirmPassword 
    };

    fields.forEach(field => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field as keyof ValidationErrors] = error;
    });

    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map(field => [field, true])) as TouchedFields);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignup = () => {
    if (request) {
      promptAsync();
    }
  };

  // ----- Email/Password Signup -----
  const handleSignup = async () => {
  if (!validateAllFields()) {
    Alert.alert("Error", "Please fix all validation errors before proceeding");
    return;
  }

  if (!agreeTerms) {
    Alert.alert("Error", "You must agree to Terms & Conditions");
    return;
  }

  setLoading(true);

  try {
    // 1️⃣ Create Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2️⃣ Split full name for storage
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 3️⃣ Save profile to Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      firstName,
      lastName,
      email,
      phone,
      gender,
      govtId,
      address,
      city,
      createdAt: new Date(),
    });

    Alert.alert("Success", `Account created for ${user.email}`);

    // 4️⃣ Navigate to HomeScreen directly — user is already logged in
    navigation.replace("Home"); 

  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code === "auth/email-already-in-use") {
      Alert.alert("Error", "Email already in use");
    } else if (error.code === "auth/invalid-email") {
      Alert.alert("Error", "Invalid email address");
    } else if (error.code === "auth/weak-password") {
      Alert.alert("Error", "Password should be at least 6 characters");
    } else {
      Alert.alert("Signup Failed", error.message);
    }
  } finally {
    setLoading(false);
  }
};


  const getFieldValue = (field: string): string => {
    const fieldValues: Record<string, string> = {
      fullName, email, phone, govtId, address, city, password, confirmPassword
    };
    return fieldValues[field] || '';
  };

  const renderInput = (
    field: string, 
    placeholder: string, 
    icon: string, 
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default', 
    multiline = false
  ) => {
    const value = getFieldValue(field);
    const isPassword = field === 'password' || field === 'confirmPassword';
    const showPasswordToggle = field === 'password' ? showPassword : showConfirmPassword;
    const fieldError = errors[field as keyof ValidationErrors];
    const fieldTouched = touched[field as keyof TouchedFields];
    
    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          fieldError && fieldTouched && styles.inputError
        ]}>
          <MaterialCommunityIcons name={icon as any} size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => handleFieldChange(field, text)}
            onBlur={() => handleFieldBlur(field, value)}
            keyboardType={keyboardType}
            autoCapitalize={field === 'email' ? 'none' : 'sentences'}
            secureTextEntry={isPassword && !showPasswordToggle}
            style={[
              styles.input,
              multiline && styles.multilineInput
            ]}
            placeholderTextColor="#9E9E9E"
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textContentType={field === 'password' ? 'newPassword' : undefined}
          />
          {isPassword && (
            <TouchableOpacity 
              onPress={() => {
                if (field === 'password') {
                  setShowPassword(!showPassword);
                } else {
                  setShowConfirmPassword(!showConfirmPassword);
                }
              }}
              style={styles.eyeIcon}
              accessibilityLabel={showPasswordToggle ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons 
                name={showPasswordToggle ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          )}
        </View>
        {fieldError && fieldTouched && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#E53E3E" />
            <Text style={styles.errorText}>{fieldError}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Background Pattern */}
        <Image
          source={require("../../assets/map-image.png")}
          style={styles.backgroundPattern}
          resizeMode="repeat"
        />

        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0D47A1" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image 
              source={require("../../assets/logo.png")} 
              style={styles.logo}
              accessibilityLabel="NagarNigrani Logo"
            />
          </View>
        </View>

        {/* Scrollable Form Container */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* Header Text */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.heading}>
                Create Account
              </Text>
              <Text style={styles.subheading}>
                Join NagarNigrani and make your city better!🌟
              </Text>
            </View>

            {/* Google Signup */}
            <TouchableOpacity
              onPress={handleGoogleSignup}
              style={[styles.googleBtn, { opacity: request ? 1 : 0.5 }]}
              disabled={!request}
              activeOpacity={0.8}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>or sign up with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {/* Full Name Input */}
              {renderInput('fullName', 'Full Name', 'account-outline')}

              {/* Email Input */}
              {renderInput('email', 'Email Address', 'email-outline', 'email-address')}

              {/* Phone Input */}
              {renderInput('phone', 'Phone Number', 'phone-outline', 'phone-pad')}

              {/* Gender Picker */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  errors.gender && touched.gender && styles.inputError
                ]}>
                  <MaterialCommunityIcons name="human-male-female" size={20} color="#666" style={styles.inputIcon} />
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => {
                      handleFieldChange('gender', itemValue);
                      if (!touched.gender) {
                        setTouched(prev => ({ ...prev, gender: true }));
                      }
                    }}
                    style={styles.picker}
                    accessibilityLabel="Select gender"
                  >
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
                {errors.gender && touched.gender && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#E53E3E" />
                    <Text style={styles.errorText}>{errors.gender}</Text>
                  </View>
                )}
              </View>

              {/* Government ID Input */}
              {renderInput('govtId', 'Aadhaar Number (12 digits)', 'card-account-details-outline', 'numeric')}

              {/* Address Input */}
              {renderInput('address', 'Address', 'home-outline', 'default', true)}

              {/* City Input */}
              {renderInput('city', 'City', 'city-variant-outline')}

              {/* Password Input */}
              {renderInput('password', 'Password', 'lock-outline')}

              {/* Confirm Password Input */}
              {renderInput('confirmPassword', 'Confirm Password', 'lock-check-outline')}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
              accessibilityLabel={agreeTerms ? "Uncheck terms agreement" : "Check terms agreement"}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeTerms }}
            >
              <View style={[
                styles.checkbox,
                { backgroundColor: agreeTerms ? "#0D47A1" : "transparent" },
              ]}>
                {agreeTerms && (
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              style={[styles.signupBtn, { opacity: loading ? 0.7 : 1 }]}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityLabel="Create account"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.signupBtnText}>Create Account</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("Login")}
                accessibilityLabel="Go to login screen"
                accessibilityRole="button"
              >
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  backgroundPattern: {
    position: "absolute",
    width: width,
    height: height + 100,
    opacity: 0.15,
    top: 0,
    left: 0,
  },

  // ================== Header ==================
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 71, 161, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 56, // To center the logo accounting for back button
  },
  logo: {
    width: 120,
    height: 100,
    marginBottom: -20,
    resizeMode: "contain",
  },

  // ================== Scroll Container ==================
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },

  // ================== Form Card ==================
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginTop: 10,
    minHeight: height * 0.7,
  },

  // ================== Header Text ==================
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0D47A1",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  // ================== Google Button ==================
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleText: {
    marginLeft: 12,
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },

  // ================== Divider ==================
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    textAlign: "center",
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
    fontWeight: '500',
  },

  // ================== Form Fields ==================
  formFields: {
    marginBottom: 24,
  },

  // ================== Input Containers ==================
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    minHeight: 56,
  },
  multilineWrapper: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    textAlignVertical: 'center',
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 76,
  },
  inputError: {
    borderColor: "#E53E3E",
    borderWidth: 2,
  },
  eyeIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // ================== Error Styling ==================
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
    lineHeight: 16,
  },

  // ================== Picker ==================
  picker: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    height: 56,
  },

  // ================== Checkbox ==================
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: "#0D47A1",
    fontWeight: '600',
  },

  // ================== Signup Button ==================
  signupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#0D47A1",
    marginBottom: 24,
    shadowColor: "#0D47A1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 56,
  },
  signupBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 8,
  },

  // ================== Login Link ==================
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginLinkText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#0D47A1",
    fontWeight: "700",
    fontSize: 14,
  },
});