import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Plus, Calendar, DollarSign, Trash2, Wallet, FileText, ChevronDown } from 'lucide-react-native';

import { AppText } from '../widgets/AppText';
import { COLORS, FONTS } from '../theme/theme';
import ExpenseService from '../services/ExpenseService';

const CATEGORIES = [
  { id: 'Feed', label: 'தீவனம் (Feed)', color: '#4CAF50' },
  { id: 'Medicine', label: 'மருந்து (Medicine)', color: '#FF9800' },
  { id: 'Labor', label: 'உழைப்பு (Labor)', color: '#2196F3' },
  { id: 'Transport', label: 'போக்குவரத்து (Transport)', color: '#9C27B0' },
  { id: 'Other', label: 'இதர (Other)', color: '#607D8B' },
];

export function ExpensesScreen() {
  const isFocused = useIsFocused();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [category, setCategory] = useState('Feed');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isFocused) {
      loadExpenses();
    }
  }, [isFocused]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await ExpenseService.getAllExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      Alert.alert('Error', 'செலவுப் பதிவுகளை ஏற்றுவதில் தோல்வி.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!amount.trim() || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('சரிபார்', 'தயவுசெய்து சரியான தொகையை உள்ளிடவும்.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('சரிபார்', 'தேதி கட்டாயம்.');
      return;
    }

    try {
      await ExpenseService.addExpense({
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        date: date.trim(),
      });

      Alert.alert('வெற்றி', 'செலவுப் பதிவு சேர்க்கப்பட்டது!');
      setModalVisible(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error(error);
      Alert.alert('தவறு', 'பதிவைச் சேமிப்பதில் பிழை ஏற்பட்டது.');
    }
  };

  const handleDeleteExpense = (id) => {
    Alert.alert(
      'பதிவை நீக்கு',
      'இந்த செலவுப் பதிவை நீக்க வேண்டுமா?',
      [
        { text: 'இல்லை', style: 'cancel' },
        {
          text: 'ஆம்',
          style: 'destructive',
          onPress: async () => {
            try {
              await ExpenseService.deleteExpense(id);
              loadExpenses();
            } catch (error) {
              console.error(error);
              Alert.alert('தவறு', 'பதிவை நீக்குவதில் பிழை.');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setCategory('Feed');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Calculate today's total expenses
  const getTodayTotal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryColor = (catId) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? found.color : COLORS.textSecondary;
  };

  const getCategoryLabel = (catId) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? found.label : catId;
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.catWrapper}>
          <View style={[styles.indicator, { backgroundColor: getCategoryColor(item.category) }]} />
          <AppText style={styles.categoryText}>{getCategoryLabel(item.category)}</AppText>
        </View>
        <AppText style={styles.amountText}>₹ {item.amount}</AppText>
      </View>

      <View style={styles.cardBody}>
        {item.description ? (
          <AppText style={styles.descriptionText}>{item.description}</AppText>
        ) : null}
        <View style={styles.dateWrapper}>
          <Calendar size={12} color={COLORS.textLight} style={styles.dateIcon} />
          <AppText style={styles.dateText}>{item.date}</AppText>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteExpense(item.id)}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Today's Expense Header Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.bannerIconWrapper}>
          <Wallet size={24} color={COLORS.primary} />
        </View>
        <View>
          <AppText style={styles.bannerLabel}>இன்றைய மொத்த செலவு</AppText>
          <AppText style={styles.bannerValue}>₹ {getTodayTotal().toLocaleString()}</AppText>
        </View>
      </View>

      {/* Expenses List */}
      {loading && expenses.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={48} color={COLORS.textLight} style={styles.emptyIcon} />
              <AppText style={styles.emptyTitle}>செலவுப் பதிவுகள் எதுவும் இல்லை</AppText>
              <AppText style={styles.emptyDesc}>
                புதிய தீவனம் அல்லது மருந்து வாங்கிய செலவுகளைப் பதிவு செய்ய கீழே உள்ள பொத்தானை (+) அழுத்தவும்.
              </AppText>
            </View>
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color={COLORS.textOnPrimary} />
      </TouchableOpacity>

      {/* ADD EXPENSE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>செலவுப் பதிவு (Add Expense)</AppText>

            <ScrollView style={styles.modalForm}>
              <AppText style={styles.inputLabel}>வகை (Category) *</AppText>
              <View style={styles.categoryChips}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.chip,
                      category === c.id && styles.chipActive,
                      category === c.id && { borderColor: c.color },
                    ]}
                    onPress={() => setCategory(c.id)}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        category === c.id && styles.chipTextActive,
                        category === c.id && { color: c.color },
                      ]}
                    >
                      {c.label.split(' ')[0]} {/* Show Tamil first name */}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText style={styles.inputLabel}>தொகை - ₹ (Amount) *</AppText>
              <TextInput
                style={styles.input}
                placeholder="எ.கா. 2500"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>தேதி (Date) *</AppText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>விளக்கம் (Description)</AppText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="விவரங்கள்..."
                multiline={true}
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={COLORS.textLight}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <AppText style={styles.btnCancelText}>ரத்து செய்</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleAddExpense}>
                <AppText style={styles.btnSubmitText}>சேமிக்கவும்</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bannerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bannerLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  bannerValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  expenseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.danger,
    paddingRight: 24, // Keep away from delete button
  },
  cardBody: {
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  deleteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: '#FAFAFA',
    fontFamily: FONTS.regular,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  btnCancelText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  btnSubmit: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  btnSubmitText: {
    color: COLORS.textOnPrimary,
    fontWeight: 'bold',
  },
});

export default ExpensesScreen;
