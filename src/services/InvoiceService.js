import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

class InvoiceService {
  /**
   * Generates a PDF invoice for a given sale and returns its local file URI.
   * @param {object} sale - Sale record from database
   * @param {object} customer - Customer object from database
   * @param {array} goats - Array of goat objects sold in this transaction
   * @returns {Promise<string>} Local URI of the generated PDF
   */
  static async generateInvoice(sale, customer, goats) {
    const sumPurchase = goats.reduce((sum, g) => sum + (g.price || 0), 0);

    const rows = goats
      .map((g, idx) => {
        // Proportional price breakdown so that item values sum up exactly to the total sale amount
        const soldPrice =
          sumPurchase > 0
            ? Math.round(g.price * (sale.total_amount / sumPurchase))
            : Math.round(sale.total_amount / goats.length);

        return `
        <tr>
          <td>${idx + 1}</td>
          <td>${g.tag_number}</td>
          <td>${g.breed || 'நாட்டு ஆடு (Local Breed)'}</td>
          <td class="text-right">₹ ${soldPrice.toLocaleString()}</td>
        </tr>
      `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 24px;
            background-color: #fff;
          }
          .header-table {
            width: 100%;
            border-bottom: 3px solid #2E7D32;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .farm-name {
            font-size: 22px;
            font-weight: bold;
            color: #1B5E20;
            margin: 0;
          }
          .farm-sub {
            font-size: 13px;
            color: #666;
            margin: 2px 0 0 0;
          }
          .inv-title {
            font-size: 24px;
            font-weight: bold;
            color: #2E7D32;
            text-align: right;
            margin: 0;
          }
          .details-table {
            width: 100%;
            margin-bottom: 24px;
            border-collapse: collapse;
          }
          .details-table td {
            padding: 6px 0;
            font-size: 13px;
            vertical-align: top;
            line-height: 18px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .items-table th {
            background-color: #2E7D32;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 8px 10px;
            font-size: 12px;
            border: 1px solid #2E7D32;
          }
          .items-table td {
            padding: 8px 10px;
            border: 1px solid #E2E8F0;
            font-size: 12px;
          }
          .text-right {
            text-align: right;
          }
          .total-container {
            text-align: right;
            margin-bottom: 32px;
          }
          .total-box {
            display: inline-block;
            font-size: 15px;
            font-weight: bold;
            color: #1B5E20;
            padding: 8px 16px;
            background-color: #F1F8E9;
            border-radius: 4px;
            border: 1px solid #C8E6C9;
          }
          .footer {
            border-top: 1px solid #E2E8F0;
            padding-top: 16px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            color: #2E7D32;
            line-height: 18px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <h1 class="farm-name">கிராமிய கால்நடை பண்ணை</h1>
                <p class="farm-sub">Gramiya Kalnadai Farm</p>
              </td>
              <td>
                <h1 class="inv-title">பில் (INVOICE)</h1>
              </td>
            </tr>
          </table>

          <table class="details-table">
            <tr>
              <td style="width: 50%">
                <strong>வாடிக்கையாளர் விவரம் (Customer Info):</strong><br>
                பெயர்: ${customer?.name || 'சில்லறை வாடிக்கையாளர் (Retail Customer)'}<br>
                கைபேசி: ${customer?.phone || '-'}<br>
                முகவரி: ${customer?.address || '-'}
              </td>
              <td style="text-align: right; width: 50%">
                <strong>பில் விவரங்கள் (Invoice Info):</strong><br>
                பில் எண் (Invoice No): <strong>INV-2026-${sale.id}</strong><br>
                தேதி (Date): ${sale.sale_date}
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 10%">வ. எண்</th>
                <th style="width: 30%">ஆடு குறிப்பு எண் (Tag ID)</th>
                <th style="width: 35%">ஆட்டின் இனம் (Breed)</th>
                <th style="text-align: right; width: 25%">தொகை (Price)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="total-container">
            <div class="total-box">
              மொத்த தொகை (Grand Total): ₹ ${sale.total_amount.toLocaleString()}
            </div>
          </div>

          <div class="footer">
            எங்கள் பண்ணையில் வாங்கியமைக்கு மிக்க நன்றி! மீண்டும் வருக!<br>
            (Thank you for your business!)
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      return uri;
    } catch (error) {
      console.error('PDF Invoice Generation Error:', error);
      throw new Error('PDF பில் தயாரிப்பதில் பிழை ஏற்பட்டது.');
    }
  }

  /**
   * Opens the OS native sharing sheet to share the generated PDF file.
   * @param {string} uri - Local file path URI of the PDF
   */
  static async shareInvoice(uri) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'இந்த சாதனத்தில் பகிர்வு வசதி இல்லை.');
        return;
      }

      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'GramiyaFarm Invoice',
      });
    } catch (error) {
      console.error('Invoice Sharing Error:', error);
      Alert.alert('பிழை', 'பகிர்வதில் சிக்கல் ஏற்பட்டது.');
    }
  }
}

export default InvoiceService;
