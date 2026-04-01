import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import moment from 'moment';

const { width } = Dimensions.get('window');

// Enhanced dummy data with priority levels and status
const reports = [
  {
    id: '1',
    title: 'Overflowing Garbage Bin',
    description: 'Garbage bin near Sector 10 park is overflowing and causing unhygienic conditions in the area.',
    image: 'https://picsum.photos/400/200?random=1',
    user: { 
      id: 'u1', 
      name: 'Rahul Sharma',
      avatar: 'https://i.pravatar.cc/150?u=rahul',
      level: 'Community Champion'
    },
    location: 'Sector 10, Gurugram',
    createdAt: moment().subtract(2, 'hours').toISOString(),
    upvotes: 12,
    comments: 4,
    priority: 'high',
    status: 'in_progress',
    category: 'waste_management',
  },
  {
    id: '2',
    title: 'Streetlight Not Working',
    description: 'Multiple streetlights are not working on the main road, creating safety concerns for pedestrians.',
    image: 'https://picsum.photos/400/200?random=2',
    user: { 
      id: 'u2', 
      name: 'Sneha Verma',
      avatar: 'https://i.pravatar.cc/150?u=sneha',
      level: 'Active Reporter'
    },
    location: 'Main Road, Block A',
    createdAt: moment().subtract(1, 'days').toISOString(),
    upvotes: 8,
    comments: 2,
    priority: 'medium',
    status: 'pending',
    category: 'infrastructure',
  },
  {
    id: '3',
    title: 'Pothole on Main Road',
    description: 'Large pothole causing traffic congestion and risk of accidents. Immediate attention required.',
    image: 'https://picsum.photos/400/200?random=3',
    user: { 
      id: 'u3', 
      name: 'Amit Kumar',
      avatar: 'https://i.pravatar.cc/150?u=amit',
      level: 'Smart Citizen'
    },
    location: 'Traffic Signal, Sector 15',
    createdAt: moment().subtract(3, 'days').toISOString(),
    upvotes: 20,
    comments: 10,
    priority: 'high',
    status: 'resolved',
    category: 'roads',
  },
  {
    id: '4',
    title: 'Water Leakage in Park',
    description: 'Continuous water leakage in the community park is creating muddy conditions and wasting water.',
    image: 'https://picsum.photos/400/200?random=4',
    user: { 
      id: 'u4', 
      name: 'Priya Singh',
      avatar: 'https://i.pravatar.cc/150?u=priya',
      level: 'Eco Warrior'
    },
    location: 'Community Park, Sector 7',
    createdAt: moment().subtract(5, 'hours').toISOString(),
    upvotes: 6,
    comments: 3,
    priority: 'medium',
    status: 'pending',
    category: 'utilities',
  },
];

const categories = ['All', 'High Priority', 'Infrastructure', 'Waste Management', 'Roads', 'Utilities'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#F57C00'; // Orange for high priority
    case 'medium': return '#42A5F5'; // Light Blue for medium
    case 'low': return '#2E7D32'; // Green for low
    default: return '#9E9E9E'; // Gray default
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved': return '#2E7D32'; // Green for resolved
    case 'in_progress': return '#42A5F5'; // Light Blue for in progress
    case 'pending': return '#F57C00'; // Orange for pending
    default: return '#9E9E9E'; // Gray default
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'resolved': return 'Resolved';
    case 'in_progress': return 'In Progress';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'waste_management': return 'delete-outline';
    case 'infrastructure': return 'city-variant-outline';
    case 'roads': return 'road-variant';
    case 'utilities': return 'water-outline';
    default: return 'alert-circle-outline';
  }
};

export default function DashboardScreen({ navigation }: any) {
  const [data, setData] = useState(reports);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentLocation, setCurrentLocation] = useState('Gurugram, Haryana');
  const [greeting, setGreeting] = useState('Good Morning');
  
  // Add refs to track location state
  const lastKnownLocation = useRef(null);
  const locationUpdateTime = useRef(null);
  const isLocationLoading = useRef(false);

  // Get dynamic greeting based on current time
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Evening'; // Late night/early morning hours show "Good Evening"
  };

  // Check if significant location change occurred
  const hasSignificantLocationChange = (newCoords, oldCoords, threshold = 100) => {
    if (!oldCoords) return true;
    
    // Calculate distance using Haversine formula (simplified)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (oldCoords.latitude * Math.PI) / 180;
    const φ2 = (newCoords.latitude * Math.PI) / 180;
    const Δφ = ((newCoords.latitude - oldCoords.latitude) * Math.PI) / 180;
    const Δλ = ((newCoords.longitude - oldCoords.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance > threshold; // Return true if moved more than threshold meters
  };

  // Get current location with persistence
  const getCurrentLocation = async (forceUpdate = false) => {
    // Prevent multiple simultaneous location requests
    if (isLocationLoading.current && !forceUpdate) {
      console.log('Location request already in progress');
      return;
    }

    // Check if we should skip location update (within 10 minutes and not forced)
    if (!forceUpdate && locationUpdateTime.current) {
      const timeSinceLastUpdate = Date.now() - locationUpdateTime.current;
      if (timeSinceLastUpdate < 10 * 60 * 1000) { // 10 minutes
        console.log('Using cached location, last update:', timeSinceLastUpdate / 1000, 'seconds ago');
        return;
      }
    }

    isLocationLoading.current = true;
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        isLocationLoading.current = false;
        return;
      }

      // Use high accuracy for better location detection
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // 15 seconds timeout
        maximumAge: 300000, // Accept cached location within 5 minutes
      });

      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Check if location has changed significantly
      if (!forceUpdate && lastKnownLocation.current && 
          !hasSignificantLocationChange(newCoords, lastKnownLocation.current)) {
        console.log('Location change not significant, keeping current location');
        isLocationLoading.current = false;
        return;
      }

      // Reverse geocoding to get detailed address
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const addr = address[0];
        let locationString = '';
        
        // Priority order for building location string
        if (addr.district && addr.city && addr.region) {
          // Most detailed: "Sector 10, Gurugram, Haryana"
          locationString = `${addr.district}, ${addr.city}, ${addr.region}`;
        } else if (addr.subregion && addr.city && addr.region) {
          // "Gurugram, Haryana, India"
          locationString = `${addr.city}, ${addr.region}`;
        } else if (addr.city && addr.region) {
          // "Mumbai, Maharashtra"
          locationString = `${addr.city}, ${addr.region}`;
        } else if (addr.city && addr.country) {
          // "Mumbai, India"
          locationString = `${addr.city}, ${addr.country}`;
        } else if (addr.region && addr.country) {
          // "Maharashtra, India"
          locationString = `${addr.region}, ${addr.country}`;
        } else if (addr.city) {
          locationString = addr.city;
        } else if (addr.region) {
          locationString = addr.region;
        } else if (addr.country) {
          locationString = addr.country;
        } else {
          locationString = 'Current Location';
        }
        
        // Update location only if we got a valid location string
        if (locationString && locationString !== 'Current Location') {
          setCurrentLocation(locationString);
          lastKnownLocation.current = newCoords;
          locationUpdateTime.current = Date.now();
          console.log('Location updated:', locationString);
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
      // Don't change current location on error - keep the last known good location
    } finally {
      isLocationLoading.current = false;
    }
  };

  // Update greeting and location on component mount
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    
    // Only get location if we don't have a recent one
    getCurrentLocation(false);
    
    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000); // 1 minute

    // Optionally, set up location tracking for significant changes
    const locationInterval = setInterval(() => {
      getCurrentLocation(false); // Check for location changes every 5 minutes
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(greetingInterval);
      clearInterval(locationInterval);
    };
  }, []);

  const handleUpvote = (id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
      )
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Update greeting on refresh
    setGreeting(getTimeBasedGreeting());
    
    // Force location update only on manual refresh
    getCurrentLocation(true);
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const filteredData = selectedCategory === 'All' 
    ? data 
    : data.filter(item => {
        if (selectedCategory === 'High Priority') return item.priority === 'high';
        return item.category === selectedCategory.toLowerCase().replace(' ', '_');
      });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.welcomeText}>{greeting} 👋</Text>
          <Text style={styles.locationText}>📍 {currentLocation}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color="#0D47A1" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Active Reports</Text>
          <MaterialCommunityIcons name="clipboard-text" size={16} color="#42A5F5" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>Resolved Today</Text>
          <MaterialCommunityIcons name="check-circle" size={16} color="#2E7D32" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>89%</Text>
          <Text style={styles.statLabel}>Resolution Rate</Text>
          <MaterialCommunityIcons name="trending-up" size={16} color="#FF9933" />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderReport = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetails', { reportId: item.id })}
      activeOpacity={0.95}
    >
      {/* Priority & Status Badges */}
      <View style={styles.badgeContainer}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userRow}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
        >
          <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.userLevel}>{item.user.level}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.timeContainer}>
          <Text style={styles.timeAgo}>{moment(item.createdAt).fromNow()}</Text>
          <View style={styles.categoryTag}>
            <MaterialCommunityIcons 
              name={getCategoryIcon(item.category)} 
              size={12} 
              color="#9E9E9E" 
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
      </View>

      {/* Issue Image */}
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.upvoteButton]}
          onPress={() => handleUpvote(item.id)}
        >
          <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#0D47A1" />
          <Text style={[styles.actionText, { color: '#0D47A1' }]}>{item.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.commentButton]}
          onPress={() => navigation.navigate('Comments', { reportId: item.id })}
        >
          <MaterialCommunityIcons name="comment-outline" size={20} color="#42A5F5" />
          <Text style={[styles.actionText, { color: '#42A5F5' }]}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.supportButton]}
          onPress={() => {/* Handle support/follow */}}
        >
          <MaterialCommunityIcons name="account-heart-outline" size={20} color="#F57C00" />
          <Text style={[styles.actionText, { color: '#F57C00' }]}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.bookmarkButton]}
          onPress={() => {/* Handle bookmark */}}
        >
          <MaterialCommunityIcons name="bookmark-outline" size={20} color="#9E9E9E" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Bottom Navigation Component
  const NavItem = ({ icon, label, isActive, onPress }: any) => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />



      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <NavItem
            icon={require('../../assets/home.png')}
            label="Home"
            isActive={activeTab === 'Home'}
            onPress={() => {
              setActiveTab('Home');
              navigation.navigate('Home');
            }}
          />
          
          <NavItem
            icon={require('../../assets/statisctics.png')}
            label="Dashboard"
            isActive={activeTab === 'Dashboard'}
            onPress={() => {
              setActiveTab('Dashboard');
              // Already on Dashboard
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
            isActive={activeTab === 'Leadership'}
            onPress={() => {
              setActiveTab('Leadership');
              navigation.navigate('Leadership');
            }}
          />

          <NavItem
            icon={require('../../assets/account.png')}
            label="Profile"
            isActive={activeTab === 'Profile'}
            onPress={() => {
              setActiveTab('Profile');
              navigation.navigate('Profile');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  
  listContainer: {
    paddingBottom: 120, // Account for bottom navigation
  },

  // Header Styles - Updated with color palette
  headerContainer: {
    backgroundColor: '#0D47A1', 
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF', // White text
    marginBottom: 4,
  },

  locationText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)', // Light white text
    fontWeight: '500',
  },

  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },

  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F57C00', // Orange notification badge
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationCount: {
    color: '#FFFFFF', // White text
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Styles - Updated colors
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: -10,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D47A1', // Dark Blue numbers
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#9E9E9E', // Gray labels
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Category Filter - Updated colors
  categoryScroll: {
    marginBottom: 4,
  },

  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', // Light white background
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  categoryChipActive: {
    backgroundColor: '#FFFFFF', // White active background
    borderColor: '#FFFFFF',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)', // Light white text
  },

  categoryTextActive: {
    color: '#0D47A1', // Dark Blue active text
  },

  // Card Styles - Updated colors
  card: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },

  badgeContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    gap: 4,
  },

  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  badgeText: {
    color: '#FFFFFF', // White text
    fontSize: 9,
    fontWeight: '700',
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 28, // Further increased to avoid overlap
    paddingBottom: 12,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F5F5F5', // Ash Gray border
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1', // Dark Blue text
    marginBottom: 2,
  },

  userLevel: {
    fontSize: 12,
    color: '#9E9E9E', // Gray text
    fontWeight: '500',
  },

  timeContainer: {
    alignItems: 'flex-end',
  },

  timeAgo: {
    fontSize: 12,
    color: '#9E9E9E', // Gray text
    marginBottom: 4,
  },

  categoryTag: {
    backgroundColor: '#F5F5F5', // Ash Gray background
    borderRadius: 10,
    padding: 4,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1', // Dark Blue text
    marginBottom: 6,
    lineHeight: 24,
  },

  description: {
    fontSize: 15,
    color: '#9E9E9E', // Gray text
    lineHeight: 20,
    marginBottom: 8,
  },

  location: {
    fontSize: 14,
    color: '#9E9E9E', // Gray text
    fontWeight: '500',
  },

  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5', // Ash Gray placeholder
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5', // Ash Gray border
    gap: 20,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },

  upvoteButton: {
    backgroundColor: 'rgba(13, 71, 161, 0.1)', // Light Dark Blue background
  },

  commentButton: {
    backgroundColor: 'rgba(66, 165, 245, 0.1)', // Light Blue background
  },

  supportButton: {
    backgroundColor: 'rgba(245, 124, 0, 0.1)', // Light Orange background
  },

  bookmarkButton: {
    backgroundColor: '#F5F5F5', // Ash Gray background
    marginLeft: 'auto',
  },

  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },

  fab: {
    // Removed - no longer needed as navigation handles the floating button
    display: 'none',
  },

  // ================== Bottom Navigation Styles ==================
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
    borderTopColor: '#F5F5F5', // Ash Gray border
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(13, 71, 161, 0.1)', // Light Dark Blue
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
    color: '#9E9E9E', // Gray text
    fontWeight: '600',
  },
  navTextActive: {
    color: '#0D47A1', // Dark Blue text
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D47A1', // Dark Blue indicator
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
    backgroundColor: '#0D47A1', // Dark Blue
    elevation: 8,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 4,
  },
  floatingButtonText: {
    fontSize: 11,
    color: '#0D47A1', // Dark Blue text
    fontWeight: '700',
  },
});