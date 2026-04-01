// src/screens/ProfileScreen.tsx
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { AuthContext } from '../context/AuthContext';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Professional Icon Components using Unicode symbols
const HomeIcon = () => <Text style={styles.iconText}>📊</Text>;
const StarIcon = () => <Text style={styles.iconText}>🏆</Text>;
const CardIcon = () => <Text style={styles.iconText}>💳</Text>;
const UserIcon = () => <Text style={styles.iconText}>👤</Text>;
const UsersIcon = () => <Text style={styles.iconText}>👥</Text>;
const ShieldIcon = () => <Text style={styles.iconText}>🔒</Text>;
const BellIcon = () => <Text style={styles.iconText}>🔔</Text>;
const GlobeIcon = () => <Text style={styles.iconText}>🌐</Text>;
const HandIcon = () => <Text style={styles.iconText}>✋</Text>;
const PrivacyIcon = () => <Text style={styles.iconText}>🛡️</Text>;
const HelpIcon = () => <Text style={styles.iconText}>❓</Text>;
const InfoIcon = () => <Text style={styles.iconText}>ℹ️</Text>;
const CheckIcon = () => <Text style={styles.activityIcon}>✅</Text>;
const BadgeIcon = () => <Text style={styles.activityIcon}>🏅</Text>;
const WarningIcon = () => <Text style={styles.activityIcon}>⚠️</Text>;

export default function ProfileScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);

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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0D47A1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user?.photoURL || "https://i.pravatar.cc/150" }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.displayName || "Rahul Sharma"}</Text>
                <Text style={styles.userSubtitle}>Active Reporter since 2023</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLevel}>Level 2</Text>
              <Text style={styles.badgeTitle}>Smart Citizen</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("MyReports")}
          >
            <View style={styles.actionIconContainer}>
              <HomeIcon />
            </View>
            <Text style={styles.actionLabel}>My Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("Achievements")}
          >
            <View style={styles.actionIconContainer}>
              <StarIcon />
            </View>
            <Text style={styles.actionLabel}>Achievements</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("NigraniPoints")}
          >
            <View style={styles.actionIconContainer}>
              <CardIcon />
            </View>
            <Text style={styles.actionLabel}>Nigrani Points</Text>
          </TouchableOpacity>
        </View>

        {/* My Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          
          <View style={styles.activityList}>
            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityContent}>
                <Image 
                  source={{ uri: "https://via.placeholder.com/60x40/F5F5F5/9E9E9E?text=IMG" }}
                  style={styles.activityImage}
                />
                <View style={styles.activityDetails}>
                  <View style={styles.activityHeader}>
                    <View style={[styles.activityIconContainer, { backgroundColor: 'transparent' }]}>
                      <CheckIcon />
                    </View>
                    <Text style={styles.activityTitle}>Report #NGN24-0012: in Sector 5 - RESOLVED</Text>
                  </View>
                  <Text style={styles.activityTime}>11 hours ago</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityContent}>
                <View style={[styles.activityIconContainer, { backgroundColor: 'transparent' }]}>
                  <BadgeIcon />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>Awarded 'Community Champion' badge</Text>
                  <Text style={styles.activityTime}>Yesterday</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.activityCard, styles.alertCard]}>
              <View style={styles.activityContent}>
                <View style={[styles.activityIconContainer, { backgroundColor: 'transparent' }]}>
                  <WarningIcon />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>Maintenance Alert: Water Supply Interruption in Sector 5</Text>
                  <Text style={styles.activityTime}>2 AM to 6 AM</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsList}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <UserIcon />
                </View>
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("AccountSecurity")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <ShieldIcon />
                </View>
                <Text style={styles.settingText}>Account & Security</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("NotificationPreferences")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <BellIcon />
                </View>
                <Text style={styles.settingText}>Notification Preferences</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("Language")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <GlobeIcon />
                </View>
                <Text style={styles.settingText}>Language (हिंदी/English)</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("AppPermissions")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <HandIcon />
                </View>
                <Text style={styles.settingText}>App Permissions</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <PrivacyIcon />
                </View>
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("HelpSupport")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <HelpIcon />
                </View>
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate("AboutNagarNigrani")}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <InfoIcon />
                </View>
                <Text style={styles.settingText}>About NagarNigrani</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => signOut(auth)}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <NavItem
            icon={require('../../assets/home.png')}
            label="Home"
            isActive={false}
            onPress={() => navigation.navigate('Home')}
          />
          
          <NavItem
            icon={require('../../assets/statisctics.png')}
            label="Dashboard"
            isActive={false}
            onPress={() => navigation.navigate('Dashboard')}
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
            onPress={() => navigation.navigate('Leadership')}
          />

          <NavItem
            icon={require('../../assets/account.png')}
            label="Profile"
            isActive={true} // Always true on ProfileScreen
            onPress={() => {
              // Already on Profile, no navigation needed
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
    backgroundColor: "#FFFFFF", // White background
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  // Header Styles - Updated with new colors
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: "#0D47A1", // Dark Blue header
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF", // White background
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF", // White text
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  
  // Profile Section - Updated colors
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF", // White background
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F5F5F5", // Ash Gray
    borderWidth: 3,
    borderColor: "#0D47A1", // Dark Blue border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0D47A1", // Dark Blue text
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9E9E9E", // Gray text
    letterSpacing: -0.1,
  },
  badge: {
    backgroundColor: "#FF9933", // Saffron badge
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#FF9933",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeLevel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF", // White text
    marginBottom: 2,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF", // White text
    textAlign: "center",
  },
  
  // Quick Actions - Updated colors
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: "#F5F5F5", // Ash Gray background
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "31%",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#9E9E9E", // Gray border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D47A1", // Dark Blue text
    textAlign: "center",
    lineHeight: 18,
  },
  
  // Section Container
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0D47A1", // Dark Blue text
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  
  // Activity Styles - Updated colors
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5F5F5", // Ash Gray border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCard: {
    backgroundColor: "#FFF8E1", // Light Orange background
    borderLeftWidth: 4,
    borderLeftColor: "#F57C00", // Orange accent
  },
  activityContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  activityImage: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F5F5F5", // Ash Gray
    marginRight: 12,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0D47A1", // Dark Blue text
    lineHeight: 20,
    flex: 1,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9E9E9E", // Gray text
  },
  
  // Settings Styles - Updated colors
  settingsList: {
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F5F5F5", // Ash Gray border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5", // Ash Gray border
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    backgroundColor: "transparent",
  },
  settingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0D47A1", // Dark Blue text
    flex: 1,
  },
  
  // Icon Styles
  iconText: {
    fontSize: 20,
    color: "#9E9E9E", // Gray icons
  },
  activityIcon: {
    fontSize: 18,
    color: "#9E9E9E", // Gray icons
  },
  
  // Logout Section - Updated colors
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: "#F57C00", // Orange button
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F57C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF", // White text
    letterSpacing: 0.5,
  },
  
  bottomSpacer: {
    height: 120, // Increased for bottom navigation
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