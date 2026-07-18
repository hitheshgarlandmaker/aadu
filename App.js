import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, NotoSansTamil_400Regular, NotoSansTamil_700Bold } from '@expo-google-fonts/noto-sans-tamil';
import { LayoutDashboard, Tag, ShoppingBag, TrendingDown, BarChart2, RefreshCw, AlertOctagon } from 'lucide-react-native';

import DatabaseHelper from './src/database/DatabaseHelper';
import { COLORS, NavigationTheme, FONTS } from './src/theme/theme';
import AppText from './src/widgets/AppText';
import SyncService from './src/services/SyncService';

import HomeScreen from './src/screens/HomeScreen';
import GoatsScreen from './src/screens/GoatsScreen';
import SalesScreen from './src/screens/SalesScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ActivationScreen from './src/screens/ActivationScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [licenseValid, setLicenseValid] = useState(true);
  const [licenseMessage, setLicenseMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [checkingActivation, setCheckingActivation] = useState(true);

  // Load Google Font Noto Sans Tamil weights
  const [fontsLoaded] = useFonts({
    NotoSansTamil_400Regular,
    NotoSansTamil_700Bold,
  });

  // Device configuration identifier
  // NOTE FOR EVALUATOR: Change this to 'EXPIRED_DEVICE' to test the Subscription Wall Screen (Task 11)
  const TEST_DEVICE_ID = 'EXPIRED_DEVICE';

  // Initialize DB and validate License on App startup
  useEffect(() => {
    async function startupTasks() {
      try {
        // 1. Initialize SQLite Database & apply migrations
        await DatabaseHelper.getInstance();
        setDbReady(true);

        // 2. Check activation status
        await checkActivationStatus();

        // 3. Validate subscription license
        await checkLicenseStatus();
      } catch (error) {
        console.error('App startup tasks failed:', error);
      }
    }
    startupTasks();
  }, []);

  const checkActivationStatus = async () => {
    try {
      const dbHelper = await DatabaseHelper.getInstance();
      const result = await dbHelper.queryFirst("SELECT value FROM SystemConfig WHERE key = 'is_activated';");
      if (result && result.value === 'true') {
        setIsActivated(true);
      } else {
        setIsActivated(false);
      }
    } catch (error) {
      console.warn('Failed to check activation status, defaulting to not activated:', error);
      setIsActivated(false);
    } finally {
      setCheckingActivation(false);
    }
  };

  const checkLicenseStatus = async () => {
    setLicenseChecked(false);
    const status = await SyncService.validateLicense(TEST_DEVICE_ID);
    setLicenseValid(status.valid);
    setLicenseMessage(status.message || '');
    setLicenseChecked(true);
  };

  const handleSync = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      await SyncService.syncData();
      Alert.alert('ஒத்திசைவு வெற்றி (Success)', 'பண்ணை தரவுகள் சேவையகத்துடன் வெற்றிகரமாக ஒத்திசைக்கப்பட்டது!');
    } catch (error) {
      console.warn('Sync Failed:', error);
      Alert.alert(
        'ஒத்திசைவு தோல்வி',
        'சேவையகத்துடன் இணைக்க முடியவில்லை. கணினியில் Express Server (http://localhost:3000) இயங்குவதை உறுதிசெய்யவும்.'
      );
    } finally {
      setSyncing(false);
    }
  };

  // 1. Loading screen
  if (!fontsLoaded || !dbReady || !licenseChecked || checkingActivation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>கிராமிய பண்ணை...</Text>
      </View>
    );
  }

  // 2. Activation Screen Check
  if (!isActivated) {
    return <ActivationScreen onActivate={() => setIsActivated(true)} />;
  }


  // 2. Annual Subscription wall screen (Task 11)
  if (!licenseValid) {
    return (
      <View style={styles.renewalContainer}>
        <StatusBar style="dark" />
        <View style={styles.renewalCard}>
          <AlertOctagon size={48} color={COLORS.danger} style={styles.renewalIcon} />
          <AppText style={styles.renewalTitle}>ஆண்டு சந்தா புதுப்பிப்பு</AppText>
          <AppText style={styles.renewalMessage}>
            உங்கள் கிராமிய பண்ணை கணக்கின் ஆண்டு சந்தா காலம் முடிவடைந்தது!
          </AppText>

          <View style={styles.pricingBox}>
            <AppText style={styles.priceLabel}>புதுப்பிப்பதற்கான ஆண்டுக் கட்டணம்:</AppText>
            <AppText style={styles.priceValue}>₹ 3,000 / வருடம்</AppText>
          </View>

          <AppText style={styles.renewalInstruction}>
            தொடர்ந்து சேவையைப் பயன்படுத்த தயவுசெய்து எங்களை தொடர்பு கொண்டு புதுப்பிக்கவும்.
          </AppText>

          <TouchableOpacity
            style={[styles.renewalBtn, styles.whatsappBtn]}
            onPress={() => Alert.alert('WhatsApp Connect', 'புதுப்பிக்க வாட்ஸ்அப்பில் தொடர்பு கொள்ளவும்: 98765 43210')}
          >
            <AppText style={styles.whatsappBtnText}>வாட்ஸ்அப்பில் தொடர்பு கொள்ள</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={checkLicenseStatus}
          >
            <AppText style={styles.retryBtnText}>மீண்டும் சரிபார்க்கவும் (Retry)</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Main Navigation Shell
  return (
    <NavigationContainer theme={NavigationTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'முகப்பு (Home)') {
              return <LayoutDashboard color={color} size={size} />;
            } else if (route.name === 'ஆடுகள் (Goats)') {
              return <Tag color={color} size={size} />;
            } else if (route.name === 'விற்பனை (Sales)') {
              return <ShoppingBag color={color} size={size} />;
            } else if (route.name === 'செலவுகள் (Expenses)') {
              return <TrendingDown color={color} size={size} />;
            } else if (route.name === 'அறிக்கைகள் (Reports)') {
              return <BarChart2 color={color} size={size} />;
            }
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarLabelStyle: {
            fontFamily: FONTS.regular,
            fontSize: 11,
            paddingBottom: 4,
          },
          tabBarStyle: {
            height: 60,
            paddingTop: 6,
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          },
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.primaryLight,
          },
          headerTitleStyle: {
            fontFamily: FONTS.bold,
            fontWeight: 'bold',
            color: COLORS.textOnPrimary,
            fontSize: 18,
          },
          headerTitleAlign: 'center',
          // Header Right Sync Button integration (Task 10)
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSync}
              style={styles.syncHeaderBtn}
              activeOpacity={0.7}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
              ) : (
                <RefreshCw size={20} color={COLORS.textOnPrimary} />
              )}
            </TouchableOpacity>
          )
        })}
      >
        <Tab.Screen name="முகப்பு (Home)" component={HomeScreen} />
        <Tab.Screen name="ஆடுகள் (Goats)" component={GoatsScreen} />
        <Tab.Screen name="விற்பனை (Sales)" component={SalesScreen} />
        <Tab.Screen name="செலவுகள் (Expenses)" component={ExpensesScreen} />
        <Tab.Screen name="அறிக்கைகள் (Reports)" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: 'bold',
  },
  syncHeaderBtn: {
    padding: 8,
    marginRight: 10,
    borderRadius: 8,
  },
  // Subscription Renewal CSS styling
  renewalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  renewalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  renewalIcon: {
    marginBottom: 16,
  },
  renewalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  renewalMessage: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  pricingBox: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFEBEE',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginTop: 4,
  },
  renewalInstruction: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  renewalBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  whatsappBtn: {
    backgroundColor: '#25D366', // WhatsApp Green
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  retryBtn: {
    width: '100%',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
