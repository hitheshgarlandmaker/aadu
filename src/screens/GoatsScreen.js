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
import { Plus, Tag as TagIcon, Calendar, DollarSign, Activity, AlertCircle } from 'lucide-react-native';

import { AppText } from '../widgets/AppText';
import { COLORS, FONTS } from '../theme/theme';
import GoatService from '../services/GoatService';
import CustomerService from '../services/CustomerService';
import SaleService from '../services/SaleService';

export function GoatsScreen() {
  const isFocused = useIsFocused();
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState(null);

  // Form states for adding a goat
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Form states for selling a goat
  const [sellingPrice, setSellingPrice] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerAddress, setQuickCustomerAddress] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadGoats();
      loadCustomers();
    }
  }, [isFocused]);

  const loadGoats = async () => {
    try {
      setLoading(true);
      const data = await GoatService.getAllGoats();
      setGoats(data);
    } catch (error) {
      console.error('Failed to load goats:', error);
      Alert.alert('Error', 'ஆடுகள் விவரங்களை ஏற்றுவதில் தோல்வி.');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await CustomerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.warn('Failed to load customers:', error);
    }
  };

  const handleAddGoat = async () => {
    if (!tagNumber.trim()) {
      Alert.alert('சரிபார்', 'ஆட்டின் விவரக்குறிப்பு எண் (Tag Number) கட்டாயம்.');
      return;
    }
    if (!price.trim() || isNaN(price)) {
      Alert.alert('சரிபார்', 'சரியான வாங்கிய விலையை உள்ளிடவும்.');
      return;
    }

    try {
      await GoatService.addGoat({
        tag_number: tagNumber.trim(),
        breed: breed.trim(),
        age: parseInt(age) || 0,
        price: parseFloat(price),
        status: 'available',
        notes: notes.trim(),
      });

      Alert.alert('வெற்றி', 'புதிய ஆடு விவரங்கள் சேர்க்கப்பட்டது!');
      setAddModalVisible(false);
      resetAddForm();
      loadGoats();
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('தவறு', 'இந்த டேக் எண் கொண்ட ஆடு ஏற்கனவே உள்ளது.');
      } else {
        console.error(error);
        Alert.alert('தவறு', 'சேமிப்பதில் பிழை ஏற்பட்டது.');
      }
    }
  };

  const resetAddForm = () => {
    setTagNumber('');
    setBreed('');
    setAge('');
    setPrice('');
    setNotes('');
  };

  const openSellModal = (goat) => {
    setSelectedGoat(goat);
    setSellingPrice(goat.price ? (goat.price * 1.2).toString() : ''); // Default to 20% markup
    setIsNewCustomer(false);
    setSelectedCustomerId(customers[0]?.id?.toString() || '');
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setQuickCustomerAddress('');
    setSellModalVisible(true);
  };

  const handleSellGoat = async () => {
    if (!sellingPrice.trim() || isNaN(sellingPrice)) {
      Alert.alert('சரிபார்', 'சரியான விற்பனை விலையை உள்ளிடவும்.');
      return;
    }

    let customerId = parseInt(selectedCustomerId);

    try {
      // 1. Handle creating new customer if toggled
      if (isNewCustomer) {
        if (!quickCustomerName.trim()) {
          Alert.alert('சரிபார்', 'வாடிக்கையாளர் பெயர் கட்டாயம்.');
          return;
        }
        customerId = await CustomerService.addCustomer({
          name: quickCustomerName.trim(),
          phone: quickCustomerPhone.trim(),
          address: quickCustomerAddress.trim(),
        });
      } else if (!customerId) {
        // Fallback or create dummy customer
        customerId = await CustomerService.addCustomer({
          name: 'Walk-in Customer (சில்லறை வாடிக்கையாளர்)',
          phone: '',
          address: '',
        });
      }

      // 2. Add Sale record (which updates goat status to sold in a transaction)
      await SaleService.addSale({
        customer_id: customerId,
        goat_ids_list: [selectedGoat.id],
        total_amount: parseFloat(sellingPrice),
        paid_status: 'paid',
        sale_date: new Date().toISOString().split('T')[0],
        notes: `Goat ${selectedGoat.tag_number} Sold directly via inventory view.`,
      });

      Alert.alert('வெற்றி', 'விற்பனை வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!');
      setSellModalVisible(false);
      loadGoats();
      loadCustomers(); // Reload customer database list
    } catch (error) {
      console.error(error);
      Alert.alert('தவறு', 'விற்பனையைப் பதிவு செய்வதில் பிழை ஏற்பட்டது.');
    }
  };

  const handleDeceasedGoat = (goat) => {
    Alert.alert(
      'ஆடு இறப்பு பதிவு',
      `ஆடு டேக்: ${goat.tag_number} இறந்தது எனப் பதிவு செய்ய வேண்டுமா? (இந்த நடவடிக்கை மாற்ற முடியாதது)`,
      [
        { text: 'இல்லை', style: 'cancel' },
        {
          text: 'ஆம்',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoatService.updateGoat(goat.id, {
                ...goat,
                status: 'deceased',
              });
              Alert.alert('பதிவு செய்யப்பட்டது', 'ஆட்டின் நிலை இறப்பு என மாற்றப்பட்டது.');
              loadGoats();
            } catch (error) {
              console.error(error);
              Alert.alert('தவறு', 'ஆட்டின் நிலையை மாற்றுவதில் பிழை.');
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status) => {
    let style = styles.badgeAvailable;
    let label = 'விற்பனைக்கு உள்ளது'; // Available

    if (status === 'sold') {
      style = styles.badgeSold;
      label = 'விற்கப்பட்டது'; // Sold
    } else if (status === 'deceased') {
      style = styles.badgeDeceased;
      label = 'இறந்தது'; // Deceased
    }

    return (
      <View style={[styles.badge, style]}>
        <AppText style={styles.badgeText}>{label}</AppText>
      </View>
    );
  };

  const renderGoatItem = ({ item }) => (
    <View style={styles.goatCard}>
      <View style={styles.cardHeader}>
        <View style={styles.tagWrapper}>
          <TagIcon size={16} color={COLORS.primary} style={styles.cardIcon} />
          <AppText style={styles.tagNumberText}>{item.tag_number}</AppText>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>இனம் (Breed):</AppText>
          <AppText style={styles.infoVal}>{item.breed || '-'}</AppText>
        </View>
        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>வயது (Age):</AppText>
          <AppText style={styles.infoVal}>{item.age ? `${item.age} மாதங்கள்` : '-'}</AppText>
        </View>
        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>வாங்கிய விலை (Price):</AppText>
          <AppText style={styles.infoVal}>₹ {item.price || '0'}</AppText>
        </View>
        {item.notes ? (
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>குறிப்பு (Notes):</AppText>
            <AppText style={[styles.infoVal, styles.notesText]} numberOfLines={1}>
              {item.notes}
            </AppText>
          </View>
        ) : null}
      </View>

      {item.status === 'available' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.sellBtn]}
            onPress={() => openSellModal(item)}
            activeOpacity={0.7}
          >
            <DollarSign size={14} color={COLORS.textOnPrimary} />
            <AppText style={styles.sellBtnText}>விற்பனை (Sell)</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deceasedBtn]}
            onPress={() => handleDeceasedGoat(item)}
            activeOpacity={0.7}
          >
            <AlertCircle size={14} color={COLORS.danger} />
            <AppText style={styles.deceasedBtnText}>இறப்பு (Deceased)</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && goats.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={goats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGoatItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Activity size={48} color={COLORS.textLight} style={styles.emptyIcon} />
              <AppText style={styles.emptyTitle}>ஆடுகள் விவரங்கள் எதுவும் இல்லை</AppText>
              <AppText style={styles.emptyDesc}>
                பண்ணையில் புதிய ஆடுகளைப் பதிவு செய்ய கீழே உள்ள பொத்தானை (+) அழுத்தவும்.
              </AppText>
            </View>
          }
        />
      )}

      {/* Floating Action Button for Adding a Goat */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color={COLORS.textOnPrimary} />
      </TouchableOpacity>

      {/* MODAL 1: ADD NEW GOAT */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>புதிய ஆடு பதிவு (Add Goat)</AppText>
            <ScrollView style={styles.modalForm}>
              <AppText style={styles.inputLabel}>விவரக்குறிப்பு எண் (Tag Number) *</AppText>
              <TextInput
                style={styles.input}
                placeholder="எ.கா. G100"
                value={tagNumber}
                onChangeText={setTagNumber}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>ஆட்டின் இனம் (Breed)</AppText>
              <TextInput
                style={styles.input}
                placeholder="எ.கா. தலைச்சேரி / ஜமுனாபாரி"
                value={breed}
                onChangeText={setBreed}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>வயது - மாதங்களில் (Age in Months)</AppText>
              <TextInput
                style={styles.input}
                placeholder="எ.கா. 8"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>வாங்கிய விலை - ₹ (Purchase Price) *</AppText>
              <TextInput
                style={styles.input}
                placeholder="எ.கா. 8500"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                placeholderTextColor={COLORS.textLight}
              />

              <AppText style={styles.inputLabel}>கூடுதல் குறிப்புகள் (Notes)</AppText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="கருத்துக்கள்..."
                multiline={true}
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={COLORS.textLight}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setAddModalVisible(false);
                  resetAddForm();
                }}
              >
                <AppText style={styles.btnCancelText}>ரத்து செய்</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleAddGoat}>
                <AppText style={styles.btnSubmitText}>பதிவு செய்</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: QUICK SELL GOAT */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sellModalVisible}
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>ஆடு விற்பனை (Sell Goat)</AppText>
            {selectedGoat && (
              <AppText style={styles.sellSubTitle}>
                ஆடு டேக் எண்: {selectedGoat.tag_number} | வாங்கிய விலை: ₹{selectedGoat.price}
              </AppText>
            )}

            <ScrollView style={styles.modalForm}>
              <AppText style={styles.inputLabel}>விற்பனை விலை - ₹ (Selling Price) *</AppText>
              <TextInput
                style={styles.input}
                placeholder="விற்பனைத் தொகை"
                keyboardType="numeric"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                placeholderTextColor={COLORS.textLight}
              />

              {/* Customer Selection Mode Toggle */}
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
                // Dropdown Select for Customers
                <View>
                  <AppText style={styles.inputLabel}>வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்</AppText>
                  <View style={styles.selectWrapper}>
                    {/* Fallback mock select lists using inputs if picker packages are avoided */}
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
                          பதிவு செய்யப்பட்ட வாடிக்கையாளர்கள் இல்லை.
                        </AppText>
                      )}
                    </ScrollView>
                  </View>
                </View>
              ) : (
                // On-the-fly Customer Creation Fields
                <View style={styles.customerFormFields}>
                  <AppText style={styles.inputLabel}>வாடிக்கையாளர் பெயர் (Customer Name) *</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="பெயர்"
                    value={quickCustomerName}
                    onChangeText={setQuickCustomerName}
                    placeholderTextColor={COLORS.textLight}
                  />

                  <AppText style={styles.inputLabel}>கைபேசி எண் (Phone)</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="கைபேசி எண்"
                    keyboardType="phone-pad"
                    value={quickCustomerPhone}
                    onChangeText={setQuickCustomerPhone}
                    placeholderTextColor={COLORS.textLight}
                  />

                  <AppText style={styles.inputLabel}>முகவரி (Address)</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="முகவரி"
                    value={quickCustomerAddress}
                    onChangeText={setQuickCustomerAddress}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setSellModalVisible(false)}
              >
                <AppText style={styles.btnCancelText}>ரத்து செய்</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSubmit]} onPress={handleSellGoat}>
                <AppText style={styles.btnSubmitText}>விற்பனை செய்</AppText>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  goatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 6,
  },
  tagNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: '#E8F5E9',
  },
  badgeSold: {
    backgroundColor: '#ECEFF1',
  },
  badgeDeceased: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  cardBody: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  notesText: {
    fontStyle: 'italic',
    color: COLORS.textLight,
    maxWidth: '60%',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  sellBtn: {
    backgroundColor: COLORS.primary,
  },
  sellBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  deceasedBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: '#FFF8F8',
  },
  deceasedBtnText: {
    color: COLORS.danger,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  sellSubTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 6,
    borderRadius: 6,
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
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
    minWidth: 100,
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
});

export default GoatsScreen;
