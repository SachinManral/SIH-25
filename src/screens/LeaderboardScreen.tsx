
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Animated,
  SafeAreaView,
  Dimensions,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

// Enhanced Dummy Data for Leaderboard with more details
const leaderboardData = [
  { 
    id: "1", 
    name: "Alex Thompson", 
    points: 1250,
    reportsSubmitted: 45,
    issuesResolved: 38,
    level: "Community Champion",
    avatar: "https://i.pravatar.cc/150?u=alex",
    badge: "🏆",
    trend: "up",
    weeklyPoints: 150,
    joinedDays: 120
  },
  { 
    id: "2", 
    name: "Sarah Johnson", 
    points: 1100,
    reportsSubmitted: 38,
    issuesResolved: 32,
    level: "Super Contributor",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    badge: "🥈",
    trend: "up",
    weeklyPoints: 120,
    joinedDays: 95
  },
  { 
    id: "3", 
    name: "Ravi Kumar", 
    points: 950,
    reportsSubmitted: 32,
    issuesResolved: 28,
    level: "Active Reporter",
    avatar: "https://i.pravatar.cc/150?u=ravi",
    badge: "🥉",
    trend: "stable",
    weeklyPoints: 85,
    joinedDays: 80
  },
  { 
    id: "4", 
    name: "Priya Sharma", 
    points: 820,
    reportsSubmitted: 29,
    issuesResolved: 24,
    level: "Smart Citizen",
    avatar: "https://i.pravatar.cc/150?u=priya",
    badge: "⭐",
    trend: "up",
    weeklyPoints: 95,
    joinedDays: 65
  },
  { 
    id: "5", 
    name: "John Doe", 
    points: 675,
    reportsSubmitted: 24,
    issuesResolved: 19,
    level: "Community Helper",
    avatar: "https://i.pravatar.cc/150?u=john",
    badge: "🌟",
    trend: "down",
    weeklyPoints: 45,
    joinedDays: 50
  },
  { 
    id: "6", 
    name: "Amit Singh", 
    points: 560,
    reportsSubmitted: 20,
    issuesResolved: 16,
    level: "Rising Star",
    avatar: "https://i.pravatar.cc/150?u=amit",
    badge: "✨",
    trend: "up",
    weeklyPoints: 75,
    joinedDays: 35
  }
];

// Enhanced Feedback Data
const initialFeedback = [
  {
    id: "f1",
    user: "Alex Thompson",
    userAvatar: "https://i.pravatar.cc/150?u=alex",
    issue: "Large pothole on Main Street causing traffic delays",
    time: "2 hours ago",
    text: "This pothole has been here for weeks! The authorities need to prioritize this as it's becoming a safety hazard for commuters. Multiple vehicles have suffered damage.",
    upvotes: 23,
    comments: 7,
    category: "Infrastructure",
    status: "in_progress",
    location: "Main Street, Sector 15"
  },
  {
    id: "f2",
    user: "Sarah Johnson",
    userAvatar: "https://i.pravatar.cc/150?u=sarah",
    issue: "Broken streetlight creating safety hazard",
    time: "5 hours ago",
    text: "Finally! The streetlight has been fixed after multiple reports. Great work by the municipal team. The area feels much safer now during evening hours.",
    upvotes: 31,
    comments: 4,
    category: "Safety",
    status: "resolved",
    location: "Park Avenue, Sector 8"
  },
  {
    id: "f3",
    user: "Ravi Kumar",
    userAvatar: "https://i.pravatar.cc/150?u=ravi",
    issue: "Garbage collection missed for 3 days",
    time: "1 day ago",
    text: "The garbage collection in our area has been irregular. This is causing hygiene issues and attracting stray animals. Need immediate attention from waste management.",
    upvotes: 18,
    comments: 3,
    category: "Waste Management",
    status: "pending",
    location: "Residential Complex, Sector 12"
  }
];

const categories = ["All", "Infrastructure", "Safety", "Waste Management", "Traffic", "Environment"];

export default function LeaderboardScreen() {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [modalVisible, setModalVisible] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("leaderboard"); // leaderboard, feedback
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handlePostFeedback = () => {
    if (newFeedback.trim() !== "") {
      const newPost = {
        id: Date.now().toString(),
        user: "You",
        userAvatar: "https://i.pravatar.cc/150?u=current",
        issue: "Community Feedback",
        time: "Just now",
        text: newFeedback,
        upvotes: 0,
        comments: 0,
        category: "General",
        status: "pending",
        location: "Your Location"
      };
      setFeedback([newPost, ...feedback]);
      setNewFeedback("");
      setModalVisible(false);
    }
  };

  const handleUpvote = (id: string) => {
    setFeedback(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, upvotes: item.upvotes + 1 }
          : item
      )
    );
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    Animated.timing(slideAnim, {
      toValue: tab === 'leaderboard' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getTrendIcon = (trend: string): { name: keyof typeof MaterialCommunityIcons.glyphMap, color: string } => {
    switch(trend) {
      case 'up': return { name: 'trending-up', color: '#2E7D32' };
      case 'down': return { name: 'trending-down', color: '#F57C00' };
      default: return { name: 'trending-neutral', color: '#9E9E9E' };
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'resolved': return '#2E7D32';
      case 'in_progress': return '#42A5F5';
      case 'pending': return '#F57C00';
      default: return '#9E9E9E';
    }
  };

  const filteredFeedback = selectedCategory === "All" 
    ? feedback 
    : feedback.filter(item => item.category === selectedCategory);

  const renderLeaderboardHeader = () => (
    <View style={styles.leaderboardHeader}>
      <Text style={styles.headerTitle}>🏆 Community Champions</Text>
      <Text style={styles.headerSubtitle}>Recognition for active citizens making a difference</Text>
      
      {/* Top 3 Podium */}
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        <View style={[styles.podiumItem, styles.secondPlace]}>
          <Image source={{ uri: leaderboardData[1].avatar }} style={styles.podiumAvatar} />
          <Text style={styles.podiumBadge}>{leaderboardData[1].badge}</Text>
          <Text style={styles.podiumName}>{leaderboardData[1].name.split(' ')[0]}</Text>
          <Text style={styles.podiumPoints}>{leaderboardData[1].points}</Text>
          <View style={[styles.podiumBase, styles.silverBase]} />
        </View>

        {/* First Place */}
        <View style={[styles.podiumItem, styles.firstPlace]}>
          <Image source={{ uri: leaderboardData[0].avatar }} style={[styles.podiumAvatar, styles.winnerAvatar]} />
          <Text style={styles.podiumBadge}>{leaderboardData[0].badge}</Text>
          <Text style={styles.podiumName}>{leaderboardData[0].name.split(' ')[0]}</Text>
          <Text style={styles.podiumPoints}>{leaderboardData[0].points}</Text>
          <View style={[styles.podiumBase, styles.goldBase]} />
        </View>

        {/* Third Place */}
        <View style={[styles.podiumItem, styles.thirdPlace]}>
          <Image source={{ uri: leaderboardData[2].avatar }} style={styles.podiumAvatar} />
          <Text style={styles.podiumBadge}>{leaderboardData[2].badge}</Text>
          <Text style={styles.podiumName}>{leaderboardData[2].name.split(' ')[0]}</Text>
          <Text style={styles.podiumPoints}>{leaderboardData[2].points}</Text>
          <View style={[styles.podiumBase, styles.bronzeBase]} />
        </View>
      </View>
    </View>
  );

  const renderLeaderboardItem = ({ item, index }: any) => {
    if (index < 3) return null; // Skip top 3 as they're in podium

    const trendIcon = getTrendIcon(item.trend);
    
    return (
      <TouchableOpacity style={styles.leaderItem} activeOpacity={0.8}>
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>{index + 1}</Text>
        </View>
        
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.level}>{item.level}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons 
              name={trendIcon.name} 
              size={16} 
              color={trendIcon.color} 
            />
            <Text style={[styles.weeklyPoints, { color: trendIcon.color }]}>
              {item.weeklyPoints}
            </Text>
          </View>
        </View>

        <Text style={styles.badge}>{item.badge}</Text>
      </TouchableOpacity>
    );
  };

  const renderFeedbackHeader = () => (
    <View style={styles.feedbackHeader}>
      <Text style={styles.headerTitle}>💬 Community Discussions</Text>
      <Text style={styles.headerSubtitle}>Share experiences and stay updated on local issues</Text>
      
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

  const renderFeedbackItem = ({ item }: any) => (
    <TouchableOpacity style={styles.feedbackCard} activeOpacity={0.95}>
      <View style={styles.feedbackHeader}>
        <View style={styles.feedbackUserInfo}>
          <Image source={{ uri: item.userAvatar }} style={styles.feedbackAvatar} />
          <View>
            <Text style={styles.feedbackUser}>{item.user}</Text>
            <Text style={styles.feedbackTime}>{item.time}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.feedbackIssue}>{item.issue}</Text>
      <Text style={styles.feedbackLocation}>📍 {item.location}</Text>
      <Text style={styles.feedbackText}>{item.text}</Text>
      
      <View style={styles.feedbackActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUpvote(item.id)}
        >
          <MaterialCommunityIcons name="arrow-up-bold" size={18} color="#0D47A1" />
          <Text style={styles.actionText}>{item.upvotes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="comment-outline" size={18} color="#42A5F5" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Tab Switcher */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Leadership & Community</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
            onPress={() => switchTab('leaderboard')}
          >
            <MaterialCommunityIcons 
              name="trophy-outline" 
              size={20} 
              color={activeTab === 'leaderboard' ? '#FFFFFF' : '#9E9E9E'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'leaderboard' && styles.activeTabText
            ]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
            onPress={() => switchTab('feedback')}
          >
            <MaterialCommunityIcons 
              name="forum-outline" 
              size={20} 
              color={activeTab === 'feedback' ? '#FFFFFF' : '#9E9E9E'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'feedback' && styles.activeTabText
            ]}>
              Discussions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'leaderboard' ? (
        <FlatList
          data={leaderboardData}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderLeaderboardHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredFeedback}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderFeedbackHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Feedback Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Thoughts</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="What's on your mind? Share your experience or feedback about local issues..."
              value={newFeedback}
              onChangeText={setNewFeedback}
              multiline
              maxLength={500}
            />
            
            <Text style={styles.charCount}>
              {newFeedback.length}/500 characters
            </Text>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                newFeedback.trim() === "" && styles.disabledButton
              ]}
              onPress={handlePostFeedback}
              disabled={newFeedback.trim() === ""}
            >
              <Text style={[
                styles.postText,
                newFeedback.trim() === "" && styles.disabledText
              ]}>
                Post Feedback
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Styles
  header: {
    backgroundColor: '#0D47A1',
    paddingTop: 70,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 25,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 21,
    gap: 6,
  },

  activeTab: {
    backgroundColor: '#FFFFFF',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },

  activeTabText: {
    color: '#0D47A1',
  },

  // List Container
  listContainer: {
    paddingBottom: 100,
  },

  // Leaderboard Header Styles
  leaderboardHeader: {
    backgroundColor: '#F5F5F5',
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D47A1',
    textAlign: 'center',
    marginBottom: 5,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 30,
  },

  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 15,
  },

  podiumItem: {
    alignItems: 'center',
  },

  firstPlace: {
    zIndex: 3,
  },

  secondPlace: {
    zIndex: 2,
  },

  thirdPlace: {
    zIndex: 1,
  },

  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 8,
  },

  winnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: '#FFD700',
  },

  podiumBadge: {
    fontSize: 20,
    marginBottom: 5,
  },

  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D47A1',
    marginBottom: 3,
  },

  podiumPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },

  podiumBase: {
    width: 70,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  goldBase: {
    height: 60,
    backgroundColor: '#FFD700',
  },

  silverBase: {
    height: 45,
    backgroundColor: '#C0C0C0',
  },

  bronzeBase: {
    height: 35,
    backgroundColor: '#CD7F32',
  },

  // Leaderboard Item Styles
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  rankContainer: {
    width: 40,
    alignItems: 'center',
  },

  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1',
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },

  userInfo: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
    marginBottom: 2,
  },

  level: {
    fontSize: 12,
    color: '#9E9E9E',
  },

  statsContainer: {
    alignItems: 'center',
    marginRight: 15,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },

  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  weeklyPoints: {
    fontSize: 11,
    fontWeight: '600',
  },

  badge: {
    fontSize: 20,
  },

  // Feedback Header Styles
  feedbackHeader: {
    backgroundColor: '#F5F5F5',
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  categoryScroll: {
    marginTop: 15,
  },

  categoryContainer: {
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },

  categoryChipActive: {
    backgroundColor: '#0D47A1',
    borderColor: '#0D47A1',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Feedback Card Styles
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  feedbackUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  feedbackAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },

  feedbackUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D47A1',
  },

  feedbackTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  feedbackIssue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
    marginTop: 12,
    marginBottom: 6,
  },

  feedbackLocation: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },

  feedbackText: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 20,
    marginBottom: 12,
  },

  feedbackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },

  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },

  categoryTag: {
    marginLeft: 'auto',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  categoryTagText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '500',
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F57C00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1',
  },

  input: {
    borderColor: '#F5F5F5',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#0D47A1',
    marginBottom: 8,
  },

  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginBottom: 20,
  },

  postButton: {
    backgroundColor: '#F57C00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#F5F5F5',
  },

  postText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledText: {
    color: '#9E9E9E',
  },
});