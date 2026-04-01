// src/screens/LoginScreen.tsx
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
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  // ----- Form state -----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ----- Validation state -----
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ----- Google Sign-In -----
  const redirectUri = makeRedirectUri({
    scheme: "nagarni", // set your app scheme here
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    redirectUri,
  });

  // Handle Google login response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          // Save profile in Firestore (merge to avoid overwriting existing data)
          await setDoc(
            doc(db, "users", user.uid),
            { email: user.email, loginMethod: "google" },
            { merge: true }
          );
          Alert.alert("Success", `Logged in as ${user.email}`);
          navigation.replace("Home");
        })
        .catch((error) => Alert.alert("Google Login Failed", error.message))
        .finally(() => setLoading(false));
    }
  }, [response]);

  // ----- Validation functions -----
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        return validateEmail(value) ? '' : 'Please enter a valid email address';
      case 'password':
        return value.length >= 6 ? '' : 'Password must be at least 6 characters';
      default:
        return '';
    }
  };

  const handleFieldChange = (field, value) => {
    // Update the field value
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
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

  const validateAllFields = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    setTouched({ email: true, password: true });
    
    return Object.keys(newErrors).length === 0;
  };

  // Email/Password login
  const handleLogin = async () => {
    if (!validateAllFields()) {
      Alert.alert("Error", "Please fix all validation errors before proceeding");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", `Logged in as ${userCredential.user.email}`);
      navigation.replace("Home");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "User not found");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email address");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many failed attempts. Please try again later.");
      } else {
        Alert.alert("Login Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset functionality will be implemented soon!");
  };

  const renderInput = (field, placeholder, icon, keyboardType = 'default', secureTextEntry = false) => {
    const value = field === 'email' ? email : password;
    const isPassword = secureTextEntry;
    
    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          errors[field] && touched[field] && styles.inputError
        ]}>
          <MaterialCommunityIcons name={icon} size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => handleFieldChange(field, text)}
            onBlur={() => handleFieldBlur(field, value)}
            keyboardType={keyboardType}
            autoCapitalize={field === 'email' ? 'none' : 'sentences'}
            secureTextEntry={isPassword && !showPassword}
            style={styles.input}
            placeholderTextColor="#9E9E9E"
          />
          {isPassword && (
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[field] && touched[field] && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#E53E3E" />
            <Text style={styles.errorText}>{errors[field]}</Text>
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
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0D47A1" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
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
                Welcome back! 👋
              </Text>
              <Text style={styles.subheading}>
                Sign in to your NagarNigrani account
              </Text>
            </View>

            {/* Google Login */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              style={styles.googleBtn}
              disabled={!request || loading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {/* Email Input */}
              {renderInput('email', 'Email Address', 'email-outline', 'email-address')}

              {/* Password Input */}
              {renderInput('password', 'Password', 'lock-outline', 'default', true)}

              {/* Remember Me + Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.checkbox,
                    { backgroundColor: rememberMe ? "#0D47A1" : "transparent" },
                  ]}>
                    {rememberMe && (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.loginBtn, { opacity: loading ? 0.7 : 1 }]}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                  <Text style={styles.registerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
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
    width: 120,  // Increased from 60
    height: 100, // Increased from 60
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
    justifyContent: 'center',
    flexGrow: 1,
  },

  // ================== Form Card ==================
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginTop: 10,
  },

  // ================== Header Text ==================
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heading: {
    fontSize: 32,
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
    marginBottom: 32,
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
    width: "100%",
  },

  // ================== Input Containers ==================
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
    textAlignVertical: 'center',
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
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },

  // ================== Options Row ==================
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    color: "#666",
    fontSize: 14,
  },
  forgotText: {
    color: "#0D47A1",
    fontSize: 14,
    fontWeight: "600",
  },

  // ================== Login Button ==================
  loginBtn: {
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
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 8,
  },

  // ================== Register Link ==================
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
  },
  registerLinkText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#0D47A1",
    fontWeight: "700",
    fontSize: 14,
  },

  // ================== Bottom Spacing ==================
  bottomSpacing: {
    height: 50,
  },
});