import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';

import { AppText } from '../widgets/AppText';
import { COLORS, FONTS } from '../theme/theme';
import SummaryService from '../services/SummaryService';

const RANGE_CHIPS = [
  { id: '7days', label: 'கடந்த 7 நாட்கள்' },
  { id: '30days', label: 'கடந்த 30 நாட்கள்' },
  { id: 'month', label: 'நடப்பு மாதம்' },
  { id: 'custom', label: 'தேதித் தேர்வு' },
];

export function ReportsScreen() {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('7days');

  // Date states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Loaded data states
  const [metrics, setMetrics] = useState({ sales: 0, expenses: 0, netProfit: 0 });
  const [dailyData, setDailyData] = useState([]);
  const [details, setDetails] = useState({ sales: [], expenses: [] });

  // List view segmented control: 'sales' | 'expenses'
  const [listSegment, setListSegment] = useState('sales');

  useEffect(() => {
    if (isFocused) {
      applyRangeFilter(selectedRange);
    }
  }, [isFocused, selectedRange]);

  const applyRangeFilter = (rangeId) => {
    const today = new Date();
    let startStr = '';
    const endStr = today.toISOString().split('T')[0];

    if (rangeId === '7days') {
      const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      startStr = start.toISOString().split('T')[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchData(startStr, endStr);
    } else if (rangeId === '30days') {
      const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      startStr = start.toISOString().split('T')[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchData(startStr, endStr);
    } else if (rangeId === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = start.toISOString().split('T')[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchData(startStr, endStr);
    } else if (rangeId === 'custom') {
      // In custom mode, don't automatically load, wait for user submit
      if (startDate && endDate) {
        fetchData(startDate, endDate);
      }
    }
  };

  const fetchData = async (start, end) => {
    try {
      setLoading(true);
      // 1. Fetch range aggregates
      const rangeMetrics = await SummaryService.getRangeMetrics(start, end);
      setMetrics(rangeMetrics);

      // 2. Fetch daily summaries for the bar chart
      const chartSummaries = await SummaryService.getDailySummariesForRange(start, end);
      setDailyData(chartSummaries);

      // 3. Fetch list items (individual Sales & Expenses)
      const rangeDetails = await SummaryService.getRangeDetails(start, end);
      setDetails(rangeDetails);
    } catch (error) {
      console.error('Failed to load report data:', error);
      Alert.alert('பிழை', 'அறிக்கை விவரங்களை ஏற்றுவதில் தோல்வி.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRangeSubmit = () => {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('சரிபார்', 'துவக்க மற்றும் முடிவு தேதியை உள்ளிடவும்.');
      return;
    }
    // Simple validation pattern: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('சரிபார்', 'தேதி வடிவம் YYYY-MM-DD ஆக இருக்க வேண்டும்.');
      return;
    }
    fetchData(startDate, endDate);
  };

  // Helper to find the maximum value in chart data to set relative heights
  const getMaxChartAmount = () => {
    const maxVal = dailyData.reduce((max, d) => {
      return Math.max(max, d.total_income, d.total_expense);
    }, 0);
    return maxVal > 0 ? maxVal : 1000; // Fallback to scale correctly
  };

  const maxChartAmount = getMaxChartAmount();

  // Helper to format short date for chart labels: "YYYY-MM-DD" -> "DD/MM"
  const getShortDateLabel = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date Range Chip Selection */}
      <View style={styles.chipRow}>
        {RANGE_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={[styles.chip, selectedRange === chip.id && styles.chipActive]}
            onPress={() => setSelectedRange(chip.id)}
            activeOpacity={0.7}
          >
            <AppText
              style={[styles.chipText, selectedRange === chip.id && styles.chipTextActive]}
            >
              {chip.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Date Form Panel */}
      {selectedRange === 'custom' && (
        <View style={styles.customDatePanel}>
          <View style={styles.dateInputsRow}>
            <View style={styles.dateInputWrapper}>
              <AppText style={styles.inputLabel}>துவக்க தேதி (Start Date)</AppText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={styles.dateInputWrapper}>
              <AppText style={styles.inputLabel}>முடிவு தேதி (End Date)</AppText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={handleCustomRangeSubmit}
            activeOpacity={0.8}
          >
            <AppText style={styles.filterBtnText}>தேதி வாரியாகத் தேடு</AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Aggregate Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <TrendingUp size={20} color={COLORS.success} />
          </View>
          <AppText style={styles.cardLabel}>மொத்த விற்பனை (Income)</AppText>
          <AppText style={[styles.cardVal, { color: COLORS.success }]}>
            ₹ {metrics.sales.toLocaleString()}
          </AppText>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconWrapper, { backgroundColor: '#FFEBEE' }]}>
            <TrendingDown size={20} color={COLORS.danger} />
          </View>
          <AppText style={styles.cardLabel}>மொத்த செலவு (Expenses)</AppText>
          <AppText style={[styles.cardVal, { color: COLORS.danger }]}>
            ₹ {metrics.expenses.toLocaleString()}
          </AppText>
        </View>

        <View style={[styles.summaryCard, styles.fullWidthCard]}>
          <View
            style={[
              styles.summaryIconWrapper,
              { backgroundColor: metrics.netProfit >= 0 ? '#E1F5FE' : '#FFEBEE' },
            ]}
          >
            <DollarSign size={20} color={metrics.netProfit >= 0 ? COLORS.info : COLORS.danger} />
          </View>
          <AppText style={styles.cardLabel}>நிகர லாபம் (Net Profit)</AppText>
          <AppText
            style={[
              styles.cardVal,
              { color: metrics.netProfit >= 0 ? COLORS.primaryDark : COLORS.danger },
            ]}
          >
            ₹ {metrics.netProfit.toLocaleString()}
          </AppText>
        </View>
      </View>

      {/* Custom Flex Bar Chart Section */}
      <View style={styles.chartSection}>
        <AppText style={styles.sectionTitle}>தினசரி வருவாய் vs செலவு (Daily P&L Graph)</AppText>
        {dailyData.length === 0 ? (
          <View style={styles.emptyChart}>
            <AppText style={styles.emptyChartText}>இக்காலகட்டத்தில் பதிவுகள் எதுவும் இல்லை</AppText>
          </View>
        ) : (
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.chartScroll}>
            <View style={styles.chartWrapper}>
              {dailyData.map((day, idx) => {
                const incHeight = (day.total_income / maxChartAmount) * 120; // Max visual height 120dp
                const expHeight = (day.total_expense / maxChartAmount) * 120;

                return (
                  <View key={idx} style={styles.chartBarColumn}>
                    {/* The Visual Bars Container */}
                    <View style={styles.barsContainer}>
                      {/* Income Bar (Green) */}
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, styles.barIncome, { height: Math.max(incHeight, 2) }]} />
                      </View>
                      {/* Expense Bar (Red) */}
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, styles.barExpense, { height: Math.max(expHeight, 2) }]} />
                      </View>
                    </View>
                    {/* Date Label */}
                    <AppText style={styles.chartLabel}>{getShortDateLabel(day.date)}</AppText>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.barIncome]} />
            <AppText style={styles.legendLabel}>வருமானம் (Income)</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.barExpense]} />
            <AppText style={styles.legendLabel}>செலவுகள் (Expense)</AppText>
          </View>
        </View>
      </View>

      {/* Transaction Details Split Segment Tabs */}
      <View style={styles.detailSection}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, listSegment === 'sales' && styles.segmentBtnActive]}
            onPress={() => setListSegment('sales')}
            activeOpacity={0.8}
          >
            <AppText
              style={[
                styles.segmentText,
                listSegment === 'sales' && styles.segmentTextActive,
              ]}
            >
              விற்பனைகள் ({details.sales.length})
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, listSegment === 'expenses' && styles.segmentBtnActive]}
            onPress={() => setListSegment('expenses')}
            activeOpacity={0.8}
          >
            <AppText
              style={[
                styles.segmentText,
                listSegment === 'expenses' && styles.segmentTextActive,
              ]}
            >
              செலவுகள் ({details.expenses.length})
            </AppText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.listLoader} />
        ) : (
          <View style={styles.transactionList}>
            {listSegment === 'sales' ? (
              // Sales Items
              details.sales.map((sale) => (
                <View key={sale.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <AppText style={styles.listCardName}>{sale.customer_name || 'Retail Customer'}</AppText>
                    <AppText style={styles.listCardIncome}>+ ₹ {sale.total_amount}</AppText>
                  </View>
                  <AppText style={styles.listCardDate}>{sale.sale_date}</AppText>
                </View>
              ))
            ) : (
              // Expenses Items
              details.expenses.map((exp) => (
                <View key={exp.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <AppText style={styles.listCardName}>
                      {exp.category === 'Feed'
                        ? 'தீவனம்'
                        : exp.category === 'Medicine'
                        ? 'மருந்து'
                        : exp.category === 'Labor'
                        ? 'உழைப்பு'
                        : exp.category === 'Transport'
                        ? 'போக்குவரத்து'
                        : 'இதர'}{' '}
                      ({exp.category})
                    </AppText>
                    <AppText style={styles.listCardExpense}>- ₹ {exp.amount}</AppText>
                  </View>
                  {exp.description ? (
                    <AppText style={styles.listCardDesc}>{exp.description}</AppText>
                  ) : null}
                  <AppText style={styles.listCardDate}>{exp.date}</AppText>
                </View>
              ))
            )}

            {listSegment === 'sales' && details.sales.length === 0 && (
              <AppText style={styles.emptyListText}>இக்காலகட்டத்தில் விற்பனை பதிவுகள் ஏதுமில்லை.</AppText>
            )}
            {listSegment === 'expenses' && details.expenses.length === 0 && (
              <AppText style={styles.emptyListText}>இக்காலகட்டத்தில் செலவு பதிவுகள் ஏதுமில்லை.</AppText>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginHorizontal: 3,
    elevation: 1,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1F8E9',
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  chipTextActive: {
    color: COLORS.primaryDark,
  },
  customDatePanel: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  dateInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateInputWrapper: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: '#FAFAFA',
    fontFamily: FONTS.regular,
  },
  filterBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnText: {
    color: COLORS.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fullWidthCard: {
    width: '100%',
  },
  summaryIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cardVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  emptyChart: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  chartScroll: {
    paddingVertical: 8,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingLeft: 8,
  },
  chartBarColumn: {
    width: 48,
    alignItems: 'center',
    marginRight: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  barTrack: {
    width: 8,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barIncome: {
    backgroundColor: COLORS.success,
  },
  barExpense: {
    backgroundColor: COLORS.danger,
  },
  chartLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  detailSection: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#ECEFF1',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  segmentText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  listLoader: {
    marginVertical: 20,
  },
  transactionList: {
    paddingBottom: 20,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  listCardIncome: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  listCardExpense: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  listCardDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  listCardDate: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 6,
  },
  emptyListText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default ReportsScreen;
