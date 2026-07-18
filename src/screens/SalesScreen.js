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
import { Plus, User, Calendar, DollarSign, Trash2, ShoppingBag, CheckSquare, Square, Share2 } from 'lucide-react-native';

import { AppText } from '../widgets/AppText';
import { COLORS, FONTS } from '../theme/theme';
import SaleService from '../services/SaleService';
import CustomerService from '../services/CustomerService';
import GoatService from '../services/GoatService';
import InvoiceService from '../services/InvoiceService';

export function SalesScreen() {
  const isFocused = useIsFocused();
  const [sales, setSales] = useState([]);
  const [availableGoats, setAvailableGoats] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [goatTagMap, setGoatTagMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1); // Step 1: Customer, Step 2: Goats, Step 3: Confirmation

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const [selectedGoatIds, setSelectedGoatIds] = useState([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch sales logs
      const salesData = await SaleService.getAllSales();
      setSales(salesData);

      // Fetch customers
      const customersData = await CustomerService.getAllCustomers();
      setCustomers(customersData);

      // Fetch goats to (1) list available goats and (2) build a tag resolver map
      const allGoats = await GoatService.getAllGoats();
      const available = allGoats.filter((g) => g.status === 'available');
      setAvailableGoats(available);

      // Build tag map (ID -> Tag Number)
      const map = {};
      allGoats.forEach((g) => {
        map[g.id] = g.tag_number;
      });
      setGoatTagMap(map);
    } catch (error) {
      console.error('Failed to load sales data:', error);
      Alert.alert('Error', 'விற்பனைத் தரவை ஏற்றுவதில் தோல்வி.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewSale = () => {
    if (availableGoats.length === 0) {
      Alert.alert('விற்பனை செய்ய முடியாது', 'விற்பனைக்கு ஆடுகள் எதுவும் இல்லை. முதலில் ஆடுகளைப் பதிவு செய்யவும்.');
      return;
    }
    // Reset Form
    setSelectedCustomerId(customers[0]?.id?.toString() || '');
    setIsNewCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setSelectedGoatIds([]);
    setTotalAmount('');
    setNotes('');
    setModalStep(1);
    setModalVisible(true);
  };

  const handleGoatToggle = (id) => {
    let updated;
    if (selectedGoatIds.includes(id)) {
      updated = selectedGoatIds.filter((gid) => gid !== id);
    } else {
      updated = [...selectedGoatIds, id];
    }
    setSelectedGoatIds(updated);

    // Calculate default total price based on purchase prices of selected goats (with a default 15% markup)
    const sumPurchasePrices = availableGoats
      .filter((g) => updated.includes(g.id))
      .reduce((sum, g) => sum + (g.price || 0), 0);
    const suggestedPrice = Math.round(sumPurchasePrices * 1.15);
    setTotalAmount(suggestedPrice > 0 ? suggestedPrice.toString() : '');
  };

  const handleNextStep = () => {
    if (modalStep === 1) {
      if (isNewCustomer && !newCustomerName.trim()) {
        Alert.alert('சரிபார்', 'வாடிக்கையாளர் பெயர் கட்டாயம்.');
        return;
      }
      if (!isNewCustomer && !selectedCustomerId) {
        Alert.alert('சரிபார்', 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்.');
        return;
      }
      setModalStep(2);
    } else if (modalStep === 2) {
      if (selectedGoatIds.length === 0) {
        Alert.alert('சரிபார்', 'குறைந்தது ஒரு ஆட்டையாவது தேர்ந்தெடுக்கவும்.');
        return;
      }
      setModalStep(3);
    }
  };

  const handlePrevStep = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1);
    }
  };

  const handleSaveSale = async () => {
    if (!totalAmount.trim() || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
      Alert.alert('சரிபார்', 'சரியான விற்பனைத் தொகையை உள்ளிடவும்.');
      return;
    }

    try {
      let customerId = parseInt(selectedCustomerId);

      // 1. Create customer if new on-the-fly
      if (isNewCustomer) {
        customerId = await CustomerService.addCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim(),
        });
      }

      // 2. Save the sale
      await SaleService.addSale({
        customer_id: customerId,
        goat_ids_list: selectedGoatIds,
        total_amount: parseFloat(totalAmount),
        paid_status: 'paid',
        sale_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || 'Recorded via sales checkout.',
      });

      Alert.alert('வெற்றி', 'விற்பனைப் பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது!');
      setModalVisible(false);
      loadData(); // Refresh page data
    } catch (error) {
      console.error(error);
      Alert.alert('தவறு', 'விற்பனையைச் சேமிப்பதில் பிழை ஏற்பட்டது.');
    }
  };

  const handleDeleteSale = (id) => {
    Alert.alert(
      'விற்பனைப் பதிவை நீக்கு',
      'இந்த விற்பனைப் பதிவை நீக்க வேண்டுமா? (விற்கப்பட்ட ஆடுகள் மீண்டும் விற்பனைக்குக் கிடைக்கும்)',
      [
        { text: 'இல்லை', style: 'cancel' },
        {
          text: 'ஆம்',
          style: 'destructive',
          onPress: async () => {
            try {
              await SaleService.deleteSale(id);
              loadData();
            } catch (error) {
              console.error(error);
              Alert.alert('தவறு', 'விற்பனைப் பதிவை நீக்குவதில் பிழை.');
            }
          },
        },
      ]
    );
  };

  const handleShareInvoice = async (sale) => {
    try {
      const customer = await CustomerService.getCustomerById(sale.customer_id);
      const goatIds = JSON.parse(sale.goat_ids_list || '[]');
      const goats = await GoatService.getGoatsByIds(goatIds);

      if (goats.length === 0) {
        Alert.alert('சரிபார்', 'இந்த விற்பனையில் ஆடுகள் எதுவும் இல்லை.');
        return;
      }

      const uri = await InvoiceService.generateInvoice(sale, customer, goats);
      await InvoiceService.shareInvoice(uri);
    } catch (error) {
      console.error(error);
      Alert.alert('பிழை', 'பில் தயாரிப்பதில் அல்லது பகிர்தலில் சிக்கல் ஏற்பட்டது.');
    }
  };

  // Convert JSON-string of goat IDs back to tag numbers
  const resolveGoatTags = (goatIdsStr) => {
    try {
      const ids = JSON.parse(goatIdsStr || '[]');
      return ids.map((id) => goatTagMap[id] || `#${id}`).join(', ');
    } catch (e) {
      return '-';
    }
  };

  const renderSaleItem = ({ item }) => (
    <View style={styles.saleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.custWrapper}>
          <User size={16} color={COLORS.primary} style={styles.cardIcon} />
          <AppText style={styles.customerName}>{item.customer_name || 'Walk-in Customer'}</AppText>
        </View>
        <AppText style={styles.amountText}>+ ₹ {item.total_amount}</AppText>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>விற்கப்பட்ட ஆடுகள்:</AppText>
          <AppText style={styles.infoVal} numberOfLines={1}>
            {resolveGoatTags(item.goat_ids_list)}
          </AppText>
        </View>
        {item.customer_phone ? (
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>கைபேசி (Phone):</AppText>
            <AppText style={styles.infoVal}>{item.customer_phone}</AppText>
          </View>
        ) : null}
        <View style={styles.dateWrapper}>
          <Calendar size={12} color={COLORS.textLight} style={styles.dateIcon} />
          <AppText style={styles.dateText}>{item.sale_date}</AppText>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={() => handleShareInvoice(item)}
          activeOpacity={0.7}
        >
          <Share2 size={14} color={COLORS.textOnPrimary} />
          <AppText style={styles.shareBtnText}>பில் பகிரவும் (Share)</AppText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteSale(item.id)}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sales FlatList */}
      {loading && sales.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ShoppingBag size={48} color={COLORS.textLight} style={styles.emptyIcon} />
              <AppText style={styles.emptyTitle}>விற்பனைப் பதிவுகள் எதுவும் இல்லை</AppText>
              <AppText style={styles.emptyDesc}>
                புதிய ஆடுகள் விற்பனையைப் பதிவுசெய்ய கீழே உள்ள பொத்தானை (+) அழுத்தவும்.
              </AppText>
            </View>
          }
        />
      )}

      {/* Floating Action Button for New Sale */}
      <TouchableOpacity style={styles.fab} onPress={handleStartNewSale} activeOpacity={0.8}>
        <Plus size={24} color={COLORS.textOnPrimary} />
      </TouchableOpacity>

      {/* STEPPED NEW SALE CHECKOUT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>விற்பனை செய்தல் (New Sale)</AppText>
              <AppText style={styles.stepIndicator}>படி {modalStep} of 3</AppText>
            </View>

            {/* STEP 1: SELECT OR CREATE CUSTOMER */}
            {modalStep === 1 && (
              <ScrollView style={styles.modalForm}>
                <AppText style={styles.stepTitle}>வாடிக்கையாளர் விவரங்கள்</AppText>

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, !isNewCustomer && styles.toggleActive]}
                    onPress={() => setIsNewCustomer(false)}
                  >
                    <AppText style={!isNewCustomer ? styles.toggleTextActive : styles.toggleText}>
                      பழைய வாடிக்கையாளர்
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, isNewCustomer && styles.toggleActive]}
                    onPress={() => setIsNewCustomer(true)}
                  >
                    <AppText style={isNewCustomer ? styles.toggleTextActive : styles.toggleText}>
                      புதிய வாடிக்கையாளர்
                    </AppText>
                  </TouchableOpacity>
                </View>

                {!isNewCustomer ? (
                  <View>
                    <AppText style={styles.inputLabel}>வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerSelectList}>
                      {customers.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.customerSelectCard,
                            selectedCustomerId === c.id.toString() && styles.customerSelectCardActive,
                          ]}
                          onPress={() => setSelectedCustomerId(c.id.toString())}
                        >
                          <AppText
                            style={[
                              styles.customerSelectName,
                              selectedCustomerId === c.id.toString() && styles.customerSelectNameActive,
                            ]}
                          >
                            {c.name}
                          </AppText>
                          {c.phone ? (
                            <AppText style={styles.customerSelectPhone}>{c.phone}</AppText>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                      {customers.length === 0 && (
                        <AppText style={styles.emptySelectionText}>
                          வாடிக்கையாளர்கள் இல்லை. புதிய வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்.
                        </AppText>
                      )}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.customerFormFields}>
                    <AppText style={styles.inputLabel}>வாடிக்கையாளர் பெயர் *</AppText>
                    <TextInput
                      style={styles.input}
                      placeholder="பெயர்"
                      value={newCustomerName}
                      onChangeText={setNewCustomerName}
                      placeholderTextColor={COLORS.textLight}
                    />

                    <AppText style={styles.inputLabel}>கைபேசி எண்</AppText>
                    <TextInput
                      style={styles.input}
                      placeholder="தொலைபேசி எண்"
                      keyboardType="phone-pad"
                      value={newCustomerPhone}
                      onChangeText={setNewCustomerPhone}
                      placeholderTextColor={COLORS.textLight}
                    />

                    <AppText style={styles.inputLabel}>முகவரி</AppText>
                    <TextInput
                      style={styles.input}
                      placeholder="முகவரி"
                      value={newCustomerAddress}
                      onChangeText={setNewCustomerAddress}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                )}
              </ScrollView>
            )}

            {/* STEP 2: SELECT GOATS */}
            {modalStep === 2 && (
              <View style={styles.flexContainer}>
                <AppText style={styles.stepTitle}>விற்பனைக்கான ஆடுகளைத் தேர்ந்தெடுக்கவும்</AppText>
                <FlatList
                  data={availableGoats}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => {
                    const isSelected = selectedGoatIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.goatSelectRow, isSelected && styles.goatSelectRowActive]}
                        onPress={() => handleGoatToggle(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.goatSelectInfo}>
                          <AppText style={styles.goatSelectTag}>{item.tag_number}</AppText>
                          <AppText style={styles.goatSelectDetails}>
                            {item.breed || 'நாட்டு ஆடு'} | {item.age || '0'} மாதங்கள் | வாங்கிய விலை: ₹{item.price}
                          </AppText>
                        </View>
                        {isSelected ? (
                          <CheckSquare size={20} color={COLORS.primary} />
                        ) : (
                          <Square size={20} color={COLORS.textLight} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.goatsListSelectContent}
                />
              </View>
            )}

            {/* STEP 3: CONFIRM & BILLING */}
            {modalStep === 3 && (
              <ScrollView style={styles.modalForm}>
                <AppText style={styles.stepTitle}>விற்பனைத் தொகை மற்றும் குறிப்புகள்</AppText>

                <View style={styles.billBreakdown}>
                  <AppText style={styles.billLabel}>விற்பனை செய்யப்படும் ஆடுகளின் எண்ணிக்கை:</AppText>
                  <AppText style={styles.billVal}>{selectedGoatIds.length} ஆடுகள்</AppText>
                </View>

                <AppText style={styles.inputLabel}>விற்பனைத் தொகை - ₹ (Total Amount) *</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="மொத்தத் தொகை"
                  keyboardType="numeric"
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  placeholderTextColor={COLORS.textLight}
                />

                <AppText style={styles.inputLabel}>விற்பனை குறிப்புகள் (Sale Notes)</AppText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="குறிப்புகள்..."
                  multiline={true}
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  placeholderTextColor={COLORS.textLight}
                />
              </ScrollView>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {modalStep === 1 ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <AppText style={styles.btnCancelText}>ரத்து செய்</AppText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handlePrevStep}>
                  <AppText style={styles.btnCancelText}>பின்னால்</AppText>
                </TouchableOpacity>
              )}

              {modalStep < 3 ? (
                <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleNextStep}>
                  <AppText style={styles.btnSubmitText}>அடுத்தது (Next)</AppText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleSaveSale}>
                  <AppText style={styles.btnSubmitText}>விற்பனையை முடி</AppText>
                </TouchableOpacity>
              )}
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  saleCard: {
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
  custWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
    paddingRight: 24,
  },
  cardBody: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '65%',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
  },
  shareBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalForm: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
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
    marginTop: 16,
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  customerSelectList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  customerSelectCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    minWidth: 110,
  },
  customerSelectCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1F8E9',
  },
  customerSelectName: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  customerSelectNameActive: {
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  customerSelectPhone: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptySelectionText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  customerFormFields: {
    marginTop: 4,
  },
  flexContainer: {
    flex: 1,
    maxHeight: 300,
  },
  goatsListSelectContent: {
    paddingVertical: 4,
  },
  goatSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  goatSelectRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1F8E9',
  },
  goatSelectInfo: {
    flex: 1,
    paddingRight: 12,
  },
  goatSelectTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  goatSelectDetails: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  billBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
});

export default SalesScreen;
