import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { KeyRound, ShieldAlert, CheckCircle } from 'lucide-react-native';
import AppText from '../widgets/AppText';
import { COLORS, FONTS } from '../theme/theme';
import DatabaseHelper from '../database/DatabaseHelper';

export default function ActivationScreen({ onActivate }) {
  const [activationKey, setActivationKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // DJB2 simple hashing algorithm
  const simpleHash = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  };

  const handleActivate = async () => {
    const trimmedKey = activationKey.trim();
    if (!trimmedKey) {
      setErrorMsg('தயவுசெய்து ஆக்டிவேஷன் கீயை உள்ளிடவும்!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Allow 1.5s delay for realistic "verifying" premium animation effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      let isValid = false;

      // 1. Verify against Environment Variable override if set
      const envKey = process.env.EXPO_PUBLIC_ACTIVATION_KEY;
      if (envKey && trimmedKey === envKey.trim()) {
        isValid = true;
      } 
      // 2. Otherwise verify against default hashed key: "GP-AATTU-PANNAI-2026-KEY" (hash: "a46bcfb9")
      else if (simpleHash(trimmedKey) === 'a46bcfb9') {
        isValid = true;
      }

      if (isValid) {
        setSuccess(true);
        // Persist activation in database
        const dbHelper = await DatabaseHelper.getInstance();
        await dbHelper.execute(
          "INSERT OR REPLACE INTO SystemConfig (key, value) VALUES ('is_activated', 'true');"
        );
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        onActivate();
      } else {
        setErrorMsg('தவறான ஆக்டிவேஷன் கீ! தயவுசெய்து சரியான கீயை உள்ளிடவும்.');
      }
    } catch (e) {
      console.error('Activation check failed:', e);
      setErrorMsg('சரிபார்ப்பில் தோல்வி ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    const message = 'வணக்கம், கிராமிய பண்ணை செயலியைத் செயல்படுத்த ஆக்டிவேஷன் கீ தேவைப்படுகிறது. தயவுசெய்து வழங்கவும்.';
    const url = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('தவறு (Error)', 'வாட்ஸ்அப் செயலியைத் திறக்க முடியவில்லை. தொடர்பு கொள்ள வேண்டிய எண்: +91 98765 43210');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {success ? (
            <View style={styles.iconContainerSuccess}>
              <CheckCircle size={56} color={COLORS.success} />
            </View>
          ) : errorMsg ? (
            <View style={styles.iconContainerError}>
              <ShieldAlert size={56} color={COLORS.danger} />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <KeyRound size={56} color={COLORS.primary} />
            </View>
          )}

          <AppText style={styles.title}>செயலி அனுமதி தேவை (Activation Required)</AppText>
          
          <AppText style={styles.description}>
            இந்த கிராமிய பண்ணை செயலியைப் பயன்படுத்த ஆக்டிவேஷன் கீ தேவைப்படுகிறது.
          </AppText>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errorMsg ? styles.inputError : null,
                success ? styles.inputSuccess : null
              ]}
              placeholder="ஆக்டிவேஷன் கீ (Activation Key)..."
              placeholderTextColor={COLORS.textLight}
              value={activationKey}
              onChangeText={(text) => {
                setActivationKey(text);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading && !success}
            />
            {errorMsg ? (
              <AppText style={styles.errorText}>{errorMsg}</AppText>
            ) : null}
            {success ? (
              <AppText style={styles.successText}>செயலி வெற்றிகரமாக செயல்படுத்தப்பட்டது!</AppText>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              success ? styles.buttonSuccess : null
            ]}
            onPress={handleActivate}
            disabled={loading || success}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : success ? (
              <AppText style={styles.buttonText}>செல்லுபடியானது (Unlocked)</AppText>
            ) : (
              <AppText style={styles.buttonText}>செயல்படுத்தவும் (Activate)</AppText>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <AppText style={styles.supportLabel}>
            ஆக்டிவேஷன் கீ பெற அல்லது விவரங்களுக்கு எங்களை தொடர்பு கொள்ளவும்:
          </AppText>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <AppText style={styles.supportButtonText}>வாட்ஸ்அப்பில் தொடர்பு கொள்ள (WhatsApp)</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainerError: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainerSuccess: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#C8E6C9',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF8F8',
  },
  inputSuccess: {
    borderColor: COLORS.success,
    backgroundColor: '#F1F8E9',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  successText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonSuccess: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  supportLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  supportButton: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#25D366',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
