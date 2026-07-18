import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { AppText } from '../widgets/AppText';
import { COLORS } from '../theme/theme';
import SummaryService from '../services/SummaryService';

export function HomeScreen() {
  const isFocused = useIsFocused();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadTodayMetrics();
    }
  }, [isFocused]);

  const loadTodayMetrics = async () => {
    try {
      setLoading(true);
      const data = await SummaryService.getTodayMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      Alert.alert('பிழை', 'இன்றைய விவரங்களை ஏற்றுவதில் தோல்வி.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Generate today's display date in Tamil
  const todayStr = new Date().toLocaleDateString('ta-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText style={styles.welcomeText}>வணக்கம்! 👋</AppText>
        <AppText style={styles.titleText}>கிராமிய பண்ணை (GramiyaFarm)</AppText>
        <AppText style={styles.subtitleText}>{todayStr}</AppText>
      </View>

      {/* Analytics Summary Cards */}
      <View style={styles.grid}>
        <View style={[styles.card, styles.primaryCard]}>
          <AppText style={styles.cardTitle}>விற்பனைக்கு உள்ளவை</AppText>
          <AppText style={styles.cardValue}>{metrics?.availableGoats || 0}</AppText>
          <AppText style={styles.cardSub}>ஆடுகள் எண்ணிக்கை</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.cardTitle, { color: COLORS.success }]}>இன்றைய வருமானம்</AppText>
          <AppText style={[styles.cardValue, { color: COLORS.success }]}>
            ₹ {(metrics?.income || 0).toLocaleString()}
          </AppText>
          <AppText style={styles.cardSub}>விற்பனைத் தொகை</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.cardTitle, { color: COLORS.danger }]}>இன்றைய செலவு</AppText>
          <AppText style={[styles.cardValue, { color: COLORS.danger }]}>
            ₹ {(metrics?.expense || 0).toLocaleString()}
          </AppText>
          <AppText style={styles.cardSub}>தீவனம் / பராமரிப்பு</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.cardTitle, { color: COLORS.info }]}>இன்றைய நிகர லாபம்</AppText>
          <AppText
            style={[
              styles.cardValue,
              { color: metrics?.netProfit >= 0 ? COLORS.success : COLORS.danger },
            ]}
          >
            ₹ {(metrics?.netProfit || 0).toLocaleString()}
          </AppText>
          <AppText style={styles.cardSub}>லாபம் / நஷ்டம்</AppText>
        </View>
      </View>

      <View style={styles.recentSection}>
        <AppText style={styles.sectionTitle}>விரைவு வழிகாட்டி (Quick Guide)</AppText>
        <AppText style={styles.helpText}>
          பண்ணை விவரங்களை நிர்வகிக்க கீழே உள்ள மெனுக்களைப் பயன்படுத்தவும்:
        </AppText>
        <View style={styles.helpList}>
          <AppText style={styles.helpItem}>🐐 ஆடுகள் மெனு: புதிய ஆடுகளைப் பதிவு செய்ய அல்லது விற்பனை செய்ய.</AppText>
          <AppText style={styles.helpItem}>💸 செலவுகள் மெனு: தினசரி தீவனம் மற்றும் மருத்துவ செலவுகளைப் பதிவு செய்ய.</AppText>
          <AppText style={styles.helpItem}>🛍️ விற்பனை மெனு: பில்களை உருவாக்க மற்றும் வாடிக்கையாளருக்குப் பகிர.</AppText>
          <AppText style={styles.helpItem}>📊 அறிக்கைகள் மெனு: குறிப்பிட்ட கால லாப நஷ்ட விவரங்களை அறிக்கையாக அறிய.</AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryCard: {
    borderColor: COLORS.primaryLight,
  },
  cardTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginVertical: 8,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  recentSection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  helpList: {
    marginTop: 4,
  },
  helpItem: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
});

export default HomeScreen;
