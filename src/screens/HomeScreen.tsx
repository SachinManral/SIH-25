import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  FlatList,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import GradientButton from '../components/GradientButton';
import { AuthContext } from '../context/AuthContext';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// Global cache to persist user data across screen navigations
const userCache = {
  data: null,
  uid: null,
  timestamp: null,
  isValid: function(uid) {
    const cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
    return this.uid === uid && 
           this.data && 
           this.timestamp && 
           (Date.now() - this.timestamp) < cacheTimeout;
  },
  set: function(uid, userData) {
    this.uid = uid;
    this.data = userData;
    this.timestamp = Date.now();
    console.log('✅ User data cached for UID:', uid, 'Data:', userData);
  },
  get: function(uid) {
    if (this.isValid(uid)) {
      console.log('✅ Using cached user data for UID:', uid, 'Data:', this.data);
      return this.data;
    }
    console.log('❌ Cache miss or expired for UID:', uid);
    return null;
  },
  clear: function() {
    this.data = null;
    this.uid = null;
    this.timestamp = null;
    console.log('🗑️ User cache cleared');
  }
};

const categories = [
  { name: 'Roads', icon: 'road-variant', color: '#6291d7ff' },
  { name: 'Garbage', icon: 'delete-variant', color: '#6291d7ff' },
  { name: 'Streetlight', icon: 'lightbulb-on', color: '#6291d7ff' },
  { name: 'Water', icon: 'water', color: '#6291d7ff' },
  { name: 'Other', icon: 'dots-horizontal-circle', color: '#6291d7ff' },
];

const recentReports = [
  { id: '1', title: 'Pothole on Main Street', status: 'Pending', location: 'Sector 5', date: '21 Sep', icon: 'road-variant', priority: 'high' },
  { id: '2', title: 'Garbage dumping', status: 'In Progress', location: 'Park Avenue', date: '20 Sep', icon: 'delete-variant', priority: 'medium' },
  { id: '3', title: 'Streetlight not working', status: 'Resolved', location: 'Sector 12', date: '19 Sep', icon: 'lightbulb-on', priority: 'low' },
];

const statusColors = {
  'Pending': '#F57C00',
  'In Progress': '#42A5F5',
  'Resolved': '#2E7D32',
};

const priorityColors = {
  'high': '#F57C00',
  'medium': '#42A5F5',
  'low': '#2E7D32',
};

export default function HomeScreen({ navigation }: any) {
  const { user: contextUser } = useContext(AuthContext);
  const [greeting, setGreeting] = useState('Good Morning');
  const [currentLocation, setCurrentLocation] = useState('Gurugram, Haryana');
  const [userName, setUserName] = useState('User');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Use ref to track if we've already processed this user
  const processedUserRef = useRef(null);
  const isMountedRef = useRef(true);
  const locationFetchedRef = useRef(false);

  // Determine the active user (prefer currentUser from auth listener over context)
  const activeUser = currentUser || contextUser;
  
  console.log('HomeScreen rendered, activeUser:', activeUser?.email || 'No user');
  console.log('Context user:', contextUser?.email || 'No context user');
  console.log('Current user from auth:', currentUser?.email || 'No current user');

  // Get dynamic greeting based on current time
  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Evening';
  }, []);

  // Helper function to get fallback name from auth
  const getAuthFallbackName = useCallback((authUser = null) => {
    const userToUse = authUser || activeUser;
    console.log('Getting auth fallback name for user:', userToUse?.email);
    
    if (userToUse?.displayName && userToUse.displayName.trim()) {
      const name = userToUse.displayName.trim();
      console.log('Using auth displayName:', name);
      return name;
    }
    
    if (userToUse?.email) {
      // Extract name from email
      const emailName = userToUse.email.split('@')[0];
      const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      console.log('Using email-based name:', name);
      return name;
    }
    
    console.log('Using default fallback: User');
    return 'User';
  }, [activeUser]);

  // Helper function to extract username from Firestore data
  const extractUsername = useCallback((userData) => {
    console.log('Extracting username from userData:', userData);
    
    // Priority order for username extraction
    
    // 1. Check fullName first (handle trailing spaces)
    if (userData.fullName && typeof userData.fullName === 'string' && userData.fullName.trim()) {
      const fullName = userData.fullName.trim();
      console.log('Using fullName (trimmed):', fullName);
      return fullName;
    }
    
    // 2. Try to construct name from firstName + lastName
    if (userData.firstName && typeof userData.firstName === 'string' && userData.firstName.trim()) {
      const firstName = userData.firstName.trim();
      const lastName = userData.lastName && typeof userData.lastName === 'string' && userData.lastName.trim() 
        ? userData.lastName.trim() 
        : '';
      
      if (lastName) {
        const constructedName = `${firstName} ${lastName}`;
        console.log('Using constructed name:', constructedName);
        return constructedName;
      } else {
        console.log('Using firstName only:', firstName);
        return firstName;
      }
    }
    
    // 3. Try other name fields
    if (userData.name && typeof userData.name === 'string' && userData.name.trim()) {
      console.log('Using name field:', userData.name.trim());
      return userData.name.trim();
    }
    
    if (userData.displayName && typeof userData.displayName === 'string' && userData.displayName.trim()) {
      console.log('Using displayName field:', userData.displayName.trim());
      return userData.displayName.trim();
    }
    
    // If no Firestore name found, use auth fallback
    console.log('No valid name found in Firestore, using auth fallback');
    return getAuthFallbackName();
  }, [getAuthFallbackName]);

  // Enhanced user fetching with caching
  const fetchUserFromFirestore = useCallback(async (authUser = null) => {
    const userToFetch = authUser || activeUser;
    
    console.log('=== FETCHING USER DATA ===');
    console.log('User to fetch:', userToFetch?.email);
    console.log('User UID:', userToFetch?.uid);
    
    if (!userToFetch?.uid) {
      console.log('No user UID found');
      const fallbackName = getAuthFallbackName(userToFetch);
      console.log('Using immediate fallback:', fallbackName);
      if (isMountedRef.current) {
        setUserName(fallbackName);
        setIsLoadingUser(false);
      }
      return;
    }

    // Check cache first
    const cachedData = userCache.get(userToFetch.uid);
    if (cachedData) {
      console.log('✅ Using cached username:', cachedData);
      if (isMountedRef.current) {
        setUserName(cachedData);
        setIsLoadingUser(false);
      }
      return;
    }

    // Only fetch from Firestore if not in cache
    try {
      console.log('🔄 Fetching from Firestore for UID:', userToFetch.uid);
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling fetch');
        return;
      }

      if (isLoadingUser) {
        console.log('Already loading, skipping duplicate fetch');
        return;
      }

      if (isMountedRef.current) {
        setIsLoadingUser(true);
      }
      
      // Check if we have proper Firestore access
      if (!db) {
        throw new Error('Firestore database not initialized');
      }
      
      const userDocRef = doc(db, 'users', userToFetch.uid);
      console.log('Document reference path:', userDocRef.path);
      
      // Add timeout to prevent hanging
      const fetchPromise = getDoc(userDocRef);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout after 10 seconds')), 10000)
      );
      
      const userDoc = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!isMountedRef.current) {
        console.log('Component unmounted during fetch, ignoring result');
        return;
      }
      
      console.log('Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Raw Firestore data:', userData);
        
        // Extract username with priority order
        const username = extractUsername(userData);
        console.log('✅ Final extracted username:', `"${username}"`);
        
        // Cache the result
        userCache.set(userToFetch.uid, username);
        
        if (isMountedRef.current) {
          setUserName(username);
        }
      } else {
        console.log('❌ No user document found in Firestore for UID:', userToFetch.uid);
        throw new Error('Document does not exist');
      }
    } catch (error) {
      console.error('❌ Firestore fetch failed:');
      console.error('Error message:', error.message);
      
      // Always use auth fallback on any error
      const fallbackName = getAuthFallbackName(userToFetch);
      console.log('Using error fallback name:', fallbackName);
      
      // Cache the fallback name too (so we don't keep retrying)
      userCache.set(userToFetch.uid, fallbackName);
      
      if (isMountedRef.current) {
        setUserName(fallbackName);
      }
    } finally {
      if (isMountedRef.current) {
        console.log('Setting loading to false');
        setIsLoadingUser(false);
      }
    }
  }, [activeUser, isLoadingUser, getAuthFallbackName, extractUsername]);

  // Get current location with high accuracy (only once)
  const getCurrentLocation = useCallback(async () => {
    if (locationFetchedRef.current) {
      console.log('Location already fetched, skipping');
      return;
    }

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      locationFetchedRef.current = true; // Mark as fetched before API call

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });

      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0] && isMountedRef.current) {
        const addr = address[0];
        let locationString = '';
        
        if (addr.district && addr.city && addr.region) {
          locationString = `${addr.district}, ${addr.city}, ${addr.region}`;
        } else if (addr.city && addr.region) {
          locationString = `${addr.city}, ${addr.region}`;
        } else if (addr.city && addr.country) {
          locationString = `${addr.city}, ${addr.country}`;
        } else if (addr.region && addr.country) {
          locationString = `${addr.region}, ${addr.country}`;
        } else if (addr.city) {
          locationString = addr.city;
        } else if (addr.region) {
          locationString = addr.region;
        } else {
          locationString = 'Current Location';
        }
        
        setCurrentLocation(locationString);
        console.log('Location updated:', locationString);
      }
    } catch (error) {
      console.log('Error getting location:', error);
      locationFetchedRef.current = false; // Reset on error so we can retry
    }
  }, []);

  // Process user data with optimization
  const processUserData = useCallback((authUser) => {
    console.log('🔄 Processing user data for:', authUser?.email || 'No user');
    
    if (!authUser) {
      console.log('No user, setting default name');
      if (isMountedRef.current) {
        setUserName('User');
        setIsLoadingUser(false);
      }
      processedUserRef.current = null;
      return;
    }

    // Skip if we've already processed this exact user
    if (processedUserRef.current === authUser.uid) {
      console.log('✅ Already processed user:', authUser.uid, '- skipping');
      return;
    }

    console.log('🆕 Processing new/different user:', authUser.uid);
    processedUserRef.current = authUser.uid;
    
    // Try cache first, then fetch if needed
    const cachedData = userCache.get(authUser.uid);
    if (cachedData) {
      console.log('✅ Using cached data immediately for:', authUser.uid);
      if (isMountedRef.current) {
        setUserName(cachedData);
        setIsLoadingUser(false);
      }
    } else {
      console.log('🔄 Need to fetch data for:', authUser.uid);
      // Set initial fallback while we fetch
      const fallback = getAuthFallbackName(authUser);
      if (isMountedRef.current) {
        setUserName(fallback);
        fetchUserFromFirestore(authUser);
      }
    }
  }, [getAuthFallbackName, fetchUserFromFirestore]);

  // Listen to auth state changes (only once)
  useEffect(() => {
    console.log('🔧 Setting up auth state listener');
    isMountedRef.current = true;
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log('🔄 Auth state changed:', authUser?.email || 'No user');
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, ignoring auth change');
        return;
      }
      
      setCurrentUser(authUser);
      
      if (authUser) {
        processUserData(authUser);
      } else {
        // User signed out - clear cache and reset
        console.log('🚪 User signed out - clearing cache');
        userCache.clear();
        processedUserRef.current = null;
        setUserName('User');
        setIsLoadingUser(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  // Handle initial setup and periodic updates
  useEffect(() => {
    console.log('🔧 Setting up greeting and location');
    
    setGreeting(getTimeBasedGreeting());
    getCurrentLocation();
    
    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      if (isMountedRef.current) {
        setGreeting(getTimeBasedGreeting());
      }
    }, 60000);

    return () => {
      console.log('🧹 Cleaning up greeting interval');
      clearInterval(greetingInterval);
    };
  }, [getTimeBasedGreeting, getCurrentLocation]); // Add dependencies

  // Simple display name function
  const getUserDisplayName = useCallback(() => {
    if (isLoadingUser) {
      return 'Loading...';
    }
    return userName;
  }, [isLoadingUser, userName]);

  // Debug tap handler for development (force refresh)
  const handleUserNamePress = useCallback(() => {
    if (__DEV__) {
      console.log('🔄 Manual refresh triggered - clearing cache');
      const currentUid = activeUser?.uid;
      if (currentUid) {
        userCache.clear();
        processedUserRef.current = null;
        setIsLoadingUser(true);
        fetchUserFromFirestore(activeUser);
      }
    }
  }, [activeUser, fetchUserFromFirestore]);

  // Memoize render functions to prevent unnecessary re-renders
  const renderCategory = useCallback(({ item }: any) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('CreateReport', { category: item.name })}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={32} color="#fff" />
      </View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderReport = useCallback(({ item }: any) => (
    <TouchableOpacity style={styles.reportCard} activeOpacity={0.9}>
      <View style={[styles.reportIconContainer, { backgroundColor: statusColors[item.status] + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={28} color={statusColors[item.status]} />
      </View>
      <View style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.reportLocation}>📍 {item.location}</Text>
        <View style={styles.reportFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status}</Text>
          </View>
          <Text style={styles.reportDate}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  const NavItem = useCallback(({ icon, label, isActive, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.navItem, isActive && styles.navItemActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.navIconContainer, isActive && styles.navIconContainerActive]}>
        <Image source={icon} style={[styles.navIcon, isActive && styles.navIconActive]} />
      </View>
      <Text style={[styles.navText, isActive && styles.navTextActive]}>{label}</Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header with Dynamic Greeting */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{greeting},</Text>
                <TouchableOpacity onPress={handleUserNamePress} activeOpacity={0.8}>
                  <Text style={styles.welcomeText}>{getUserDisplayName()}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <MaterialCommunityIcons name="city" size={120} color="rgba(255,255,255,0.08)" style={styles.decorativeIcon} />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>24</Text>
            <Text style={styles.statsLabel}>Reports Filed</Text>
            <MaterialCommunityIcons name="trending-up" size={16} color="#2E7D32" />
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>18</Text>
            <Text style={styles.statsLabel}>Resolved</Text>
            <MaterialCommunityIcons name="check-circle" size={16} color="#0D47A1" />
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>6</Text>
            <Text style={styles.statsLabel}>In Progress</Text>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#F57C00" />
          </View>
        </View>

        {/* Main Action */}
        <View style={styles.mainAction}>
          <Text style={styles.tagline}>Your city, your responsibility!</Text>
          <Text style={styles.subTagline}>Report issues as a citizen and help build a better community</Text>
          
          <TouchableOpacity 
            style={styles.reportButtonContainer}
            onPress={() => navigation.navigate('CreateReport')}
            activeOpacity={0.9}
          >
            <View style={styles.reportButton}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#fff" />
              <Text style={styles.reportButtonText}>Report an Issue</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategory}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentReports}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderReport}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reportsContainer}
          />
        </View>

        {/* Civic Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color="#F57C00" />
              <Text style={styles.tipTitle}>Daily Civic Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Keep your neighborhood clean by reporting overflowing garbage bins immediately. Together, we can maintain a healthier environment! 🌱
            </Text>
          </View>
        </View>

        {/* Achievement Badge */}
        <View style={styles.achievementContainer}>
          <View style={styles.achievement}>
            <MaterialCommunityIcons name="account-heart" size={32} color="#0D47A1" />
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>Active Citizen</Text>
              <Text style={styles.achievementDesc}>You're making a difference in your community! Keep reporting and help us build a smarter city together.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <NavItem
            icon={require('../../assets/home.png')}
            label="Home"
            isActive={true}
            onPress={() => {}}
          />
          
          <NavItem
            icon={require('../../assets/statisctics.png')}
            label="Dashboard"
            isActive={false}
            onPress={() => {
              navigation.navigate('Dashboard');
            }}
          />

          {/* Center Floating Button */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate('CreateReport')}
            activeOpacity={0.9}
          >
            <View style={styles.floatingButtonContainer}>
              <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </View>
            <Text style={styles.floatingButtonText}>Report</Text>
          </TouchableOpacity>

          <NavItem
            icon={require('../../assets/podium.png')}
            label="Leadership"
            isActive={false}
            onPress={() => {
              navigation.navigate('Leadership');
            }}
          />

          <NavItem
            icon={require('../../assets/account.png')}
            label="Profile"
            isActive={false}
            onPress={() => {
              navigation.navigate('Profile');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ================== Container ==================
  container: { 
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ================== Header ==================
  headerContainer: {
    backgroundColor: '#0D47A1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 15,
    zIndex: 2,
    position: 'relative',
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 25,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F57C00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  decorativeContainer: {
    position: 'absolute',
    right: -20,
    top: 10,
    zIndex: 1,
    opacity: 0.6,
  },
  decorativeIcon: {
    transform: [{ rotate: '15deg' }],
  },

  // ================== Stats Cards ==================
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
    zIndex: 3,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D47A1',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 8,
  },

  // ================== Main Action ==================
  mainAction: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTagline: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  reportButtonContainer: {
    width: width * 0.85,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#18349bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(12, 84, 193, 1)',
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // ================== Sections ==================
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1',
  },
  viewAllText: {
    fontSize: 14,
    color: '#42A5F5',
    fontWeight: '600',
  },

  // ================== Categories ==================
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center',
  },

  // ================== Reports ==================
  reportsContainer: {
    paddingHorizontal: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    width: 280,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reportContent: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D47A1',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  reportLocation: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },

  // ================== Tip ==================
  tipContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9933',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D47A1',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ================== Achievement ==================
  achievementContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  achievement: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  achievementContent: {
    flex: 1,
    marginLeft: 16,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D47A1',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 18,
  },

  // ================== Bottom Navigation ==================
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  navIconContainer: {
    marginBottom: 4,
  },
  navIconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  navIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navText: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1976D2',
  },

  // ================== Floating Button ==================
  floatingButton: {
    alignItems: 'center',
    marginTop: -20,
  },
  floatingButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 84, 193, 1)',
    elevation: 8,
    shadowColor: 'rgba(12, 84, 193, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 4,
  },
  floatingButtonText: {
    fontSize: 11,
    color: 'rgba(12, 84, 193, 1)',
    fontWeight: '700',
  },
});