import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

const API_BASE_URL = 'http://backend-lb-1601479373.us-east-1.elb.amazonaws.com:8080/api';

// Define header button components outside the main component
const BackButton = ({ onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={styles.headerButton}
  >
    <Icon name="arrow-back" size={24} color="#000" />
  </TouchableOpacity>
);

const DownloadButton = ({ onPress, disabled, downloading }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={styles.headerButton}
    disabled={disabled}
  >
    <Icon 
      name={downloading ? "cloud-download-outline" : "cloud-download"} 
      size={24} 
      color={disabled ? "#666" : "#53a20e"} 
    />
  </TouchableOpacity>
);

// Define loading component outside main component
const LoadingView = ({ message }) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#53a20e" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Define error component outside main component
const ErrorView = ({ message, onRetry }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

// Define empty state component outside main component
const EmptyView = ({ message }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// Define payment detail section component
const DetailSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// Define detail item component
const DetailItem = ({ label, value }) => (
  <Text style={styles.detail}>{label}: {value || 'N/A'}</Text>
);

const PaymentDetailsScreen = ({ route, navigation }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const { paymentId } = route.params;
  const [cachedPayment, setCachedPayment] = useState(null);

  // Helper function to format currency
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

  // Calculate financial values
  const calculateFinancials = (paymentData) => {
    const subTotal = paymentData.amount || 0;
    const sgst = subTotal * 0.09; // 9% SGST
    const cgst = subTotal * 0.09; // 9% CGST
    const packagingFee = paymentData.packagingFee || 0;
    const deliveryFee = paymentData.deliveryFee || 0;
    const discount = paymentData.discount || 0;
    const total = subTotal + sgst + cgst + packagingFee + deliveryFee - discount;
    const amountPaid = paymentData.amountPaid || 0;
    const balance = total - amountPaid;
    
    return {
      subTotal,
      sgst,
      cgst,
      packagingFee,
      deliveryFee,
      discount,
      total,
      amountPaid,
      balance
    };
  };

  // Generate CSS styles
  const generateStyles = () => {
    return `
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .company-details, .billing-details { margin-bottom: 20px; }
        .flex-container { display: flex; justify-content: space-between; }
        .w-50 { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .amount-words { margin: 20px 0; font-style: italic; }
        .terms { margin: 20px 0; font-size: 11px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; }
        .signature { margin-top: 30px; text-align: right; }
        .calculations { width: 300px; margin-left: auto; margin-top: 20px; }
        .calculations table { font-size: 12px; }
      </style>
    `;
  };

  // Generate header section
  const generateHeaderSection = () => {
    return `
      <div class="header">
        <div class="logo">🚚 Logistics Invoice</div>
        <div class="title">Tax Invoice</div>
      </div>
    `;
  };

  // Generate company and invoice details section
  const generateCompanySection = (paymentData) => {
    const transporter = paymentData.transporter || {};
    
    return `
      <div class="flex-container">
        <div class="w-50 company-details">
          <h3>Company/Seller Details:</h3>
          <p>Company Name: ${transporter.companyName || 'N/A'}</p>
          <p>Address: ${transporter.address || 'N/A'}</p>
          <p>Phone: ${transporter.phoneNumber || 'N/A'}</p>
          <p>Email: ${transporter.email || 'N/A'}</p>
          <p>GSTIN: ${transporter.companyGstNumber || 'N/A'}</p>
          <p>State: ${transporter.state || 'N/A'}</p>
        </div>

        <div class="w-50">
          <h3>Invoice Details:</h3>
          <p>Date: ${new Date(paymentData.createdAt).toLocaleDateString()}</p>
          <p>Payment ID: #${paymentData.paymentId}</p>
          <p>Razorpay Order ID: ${paymentData.razorpayOrderId || 'N/A'}</p>
        </div>
      </div>
    `;
  };

  // Generate billing and transportation details
  const generateBillingSection = (paymentData) => {
    const manufacturer = paymentData.manufacturer || {};
    const driver = paymentData.driver || {};
    const shipment = paymentData.shipment || {};
    
    return `
      <div class="flex-container">
        <div class="w-50">
          <h3>Bill To:</h3>
          <p>Name: ${manufacturer.companyName || 'N/A'}</p>
          <p>Address: ${manufacturer.address || 'N/A'}</p>
          <p>Contact: ${manufacturer.phoneNumber || 'N/A'}</p>
          <p>GSTIN: ${manufacturer.companyGstNumber || 'N/A'}</p>
          <p>State: ${manufacturer.state || 'N/A'}</p>
        </div>

        <div class="w-50">
          <h3>Transportation Details:</h3>
          <p>Driver Name: ${driver.name || 'N/A'}</p>
          <p>Driver Mobile: ${driver.phoneNumber || 'N/A'}</p>
          <p>Vehicle Number: ${shipment.vehicleNumber || 'N/A'}</p>
          <p>License No: ${driver.licenseNumber || 'N/A'}</p>
        </div>
      </div>
    `;
  };

  // Generate items table
  const generateItemsTable = (paymentData, financials) => {
    const shipment = paymentData.shipment || {};
    
    return `
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>HSN</th>
            <th>QTY</th>
            <th>Unit</th>
            <th>Price/Unit</th>
            <th>Disc</th>
            <th>GST</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${shipment.cargoType || 'Freight Charges'}</td>
            <td>996511</td>
            <td>1</td>
            <td>Service</td>
            <td>${formatCurrency(financials.subTotal)}</td>
            <td>${formatCurrency(financials.discount)}</td>
            <td>18%</td>
            <td>${formatCurrency(financials.subTotal)}</td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // Generate calculations table
  const generateCalculationsTable = (financials) => {
    return `
      <div class="calculations">
        <table>
          <tr>
            <td>Sub Total:</td>
            <td>${formatCurrency(financials.subTotal)}</td>
          </tr>
          <tr>
            <td>Packaging Fee:</td>
            <td>${formatCurrency(financials.packagingFee)}</td>
          </tr>
          <tr>
            <td>Delivery Fee:</td>
            <td>${formatCurrency(financials.deliveryFee)}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td>${formatCurrency(financials.discount)}</td>
          </tr>
          <tr>
            <td>SGST (9%):</td>
            <td>${formatCurrency(financials.sgst)}</td>
          </tr>
          <tr>
            <td>CGST (9%):</td>
            <td>${formatCurrency(financials.cgst)}</td>
          </tr>
          <tr>
            <td><strong>Total:</strong></td>
            <td><strong>${formatCurrency(financials.total)}</strong></td>
          </tr>
          <tr>
            <td>Received:</td>
            <td>${formatCurrency(financials.amountPaid)}</td>
          </tr>
          <tr>
            <td>Balance:</td>
            <td>${formatCurrency(financials.balance)}</td>
          </tr>
        </table>
      </div>
    `;
  };

  // Generate footer section
  const generateFooterSection = (financials) => {
    return `
      <div class="amount-words">
        Amount in words: ${numberToWords(financials.total)} Rupees Only
      </div>

      <div class="terms">
        <h4>Terms & Conditions:</h4>
        <ol>
          <li>Payment is due within 30 days</li>
          <li>Goods once sold will not be taken back</li>
          <li>Interest at 18% will be charged on overdue bills</li>
          <li>Subject to local jurisdiction</li>
        </ol>
      </div>

      <div class="signature">
        <p>Authorized Signatory</p>
        <br/>
        <p>_____________________</p>
      </div>

      <div class="footer">
        <p>This is a computer-generated invoice and does not require a signature.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;
  };

  // Main generateHTML function with reduced complexity
  const generateHTML = (paymentData) => {
    if (!paymentData) return '';
    
    // Calculate financial values
    const financials = calculateFinancials(paymentData);
    
    // Generate HTML sections
    const headerSection = generateHeaderSection();
    const companySection = generateCompanySection(paymentData);
    const billingSection = generateBillingSection(paymentData);
    const itemsTable = generateItemsTable(paymentData, financials);
    const calculationsTable = generateCalculationsTable(financials);
    const footerSection = generateFooterSection(financials);
    
    return `
      <html>
        <head>
          ${generateStyles()}
        </head>
        <body>
          ${headerSection}
          ${companySection}
          ${billingSection}
          ${itemsTable}
          ${calculationsTable}
          ${footerSection}
        </body>
      </html>
    `;
  };

  // REFACTORED - Helper function to convert number to words with reduced complexity
  const numberToWords = (number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
    const handleSmallNumbers = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
    };
  
    const convertLessThanOneThousand = (n) => {
      const hundredPart = n >= 100 ? ones[Math.floor(n / 100)] + ' Hundred' : '';
      const remainderPart = n % 100 > 0 ? handleSmallNumbers(n % 100) : '';
      return [hundredPart, remainderPart].filter(Boolean).join(' and ');
    };
  
    if (number === 0) return 'Zero';
  
    const parts = [
      { divisor: 10000000, name: 'Crore' },
      { divisor: 100000, name: 'Lakh' },
      { divisor: 1000, name: 'Thousand' },
      { divisor: 1, name: '' }
    ];
  
    const formatParts = parts
      .map(part => {
        const quotient = Math.floor(number / part.divisor);
        number %= part.divisor;
        return quotient > 0 ? convertLessThanOneThousand(quotient) + (part.name ? ' ' + part.name : '') : '';
      })
      .filter(Boolean);
  
    const rupees = Math.floor(number);
    const paise = Math.round((number - rupees) * 100);
  
    const paiseWords = paise > 0 ? ` and ${convertLessThanOneThousand(paise)} Paise` : '';
  
    return formatParts.join(' ') + paiseWords.trim();
  };
  

  useEffect(() => {
    // Using the predefined components for navigation options
    navigation.setOptions({
      headerLeft: () => (
        <BackButton onPress={() => navigation.goBack()} />
      ),
      headerRight: () => (
        <DownloadButton 
          onPress={handleDownload} 
          disabled={downloading || !payment}
          downloading={downloading} 
        />
      ),
    });
  }, [navigation, downloading, payment]);

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/payments/${paymentId}`);
      const paymentData = response.data;
      setPayment(paymentData);
      setCachedPayment(paymentData);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError('Failed to load payment details');
      Alert.alert('Error', 'Failed to load payment details');
      
      if (cachedPayment) {
        setPayment(cachedPayment);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Extract PDF generation into a separate function
  const generatePdf = async (paymentData) => {
    const fileName = `Payment_Receipt_${paymentData.paymentId}_${Date.now()}`;
    
    const options = {
      html: generateHTML(paymentData),
      fileName,
      directory: 'Documents',
      base64: true
    };

    const file = await RNHTMLtoPDF.convert(options);
    
    if (!file || !file.filePath) {
      throw new Error('PDF generation failed');
    }
    
    console.log('File saved at:', file.filePath);
    return file;
  };

  // Extract sharing functionality into a separate function
  const shareFile = async (filePath, paymentId) => {
    return Share.open({
      url: `file://${filePath}`,
      type: 'application/pdf',
      title: 'Payment Receipt',
      subject: `Payment Receipt ${paymentId}`,
    });
  };

  // Extract view file functionality
  const viewFile = async (filePath) => {
    console.log('Attempting to open file:', filePath);
    return FileViewer.open(filePath, { showOpenWithDialog: true });
  };

  // Simplified handleDownload function
  const handleDownload = async () => {
    if (!payment && !cachedPayment) {
      Alert.alert('Error', 'No payment data available. Please try refreshing the page.');
      return;
    }

    const paymentData = payment || cachedPayment;
    
    try {
      setDownloading(true);
      const file = await generatePdf(paymentData);
      
      Alert.alert('Success', `File saved at: ${file.filePath}`);
      
      // Call the simpler handleFileActions function
      await handleFileActions(file, paymentData);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Failed to generate receipt: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Simplified file handling function
  const handleFileActions = async (file, paymentData) => {
    if (Platform.OS === 'ios') {
      try {
        await shareFile(file.filePath, paymentData.paymentId);
      } catch (error) {
        console.error('Error sharing file:', error);
        Alert.alert('Error', `Unable to share the file: ${error.message}`);
      }
      return;
    }
    
    // For Android, show options dialog
    Alert.alert(
      'Receipt Generated',
      `File saved at: ${file.filePath}\nWhat would you like to do with the receipt?`,
      [
        {
          text: 'View',
          onPress: () => handleViewAction(file.filePath)
        },
        {
          text: 'Share',
          onPress: () => handleShareAction(file.filePath, paymentData.paymentId)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Helper functions for Android actions
  const handleViewAction = async (filePath) => {
    try {
      await viewFile(filePath);
    } catch (error) {
      console.error('Error viewing file:', error);
      Alert.alert('Error', `Unable to open the file: ${error.message}`);
    }
  };

  const handleShareAction = async (filePath, paymentId) => {
    try {
      await shareFile(filePath, paymentId);
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', `Unable to share the file: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'RELEASED':
        return '#4CAF50';
      case 'FAILED':
        return '#FF0000';
      default:
        return '#000000';
    }
  };

  if (loading) {
    return <LoadingView message="Loading payment details..." />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchPaymentDetails} />;
  }

  if (!payment) {
    return <EmptyView message="Payment not found" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Payment Details</Text>
        
        <DetailSection title="Status">
          <Text style={[styles.status, { color: getStatusColor(payment.paymentStatus) }]}>
            {payment.paymentStatus || 'Unknown'}
          </Text>
        </DetailSection>

        <DetailSection title="Amount">
          <Text style={styles.amount}>₹{payment.amount?.toFixed(2) || '0.00'}</Text>
        </DetailSection>

        <DetailSection title="Shipment Information">
          <DetailItem label="Shipment ID" value={`#${payment.shipment?.shipmentId || 'N/A'}`} />
          <DetailItem label="Cargo Type" value={payment.shipment?.cargoType} />
          <DetailItem label="Weight" value={`${payment.shipment?.weight || 'N/A'} kg`} />
          <DetailItem label="Distance" value={`${payment.shipment?.distance || 'N/A'} km`} />
          <DetailItem label="Origin" value={payment.shipment?.origin} />
          <DetailItem label="Destination" value={payment.shipment?.destination} />
        </DetailSection>

        <DetailSection title="Transaction Details">
          <DetailItem label="Payment ID" value={payment.paymentId} />
          <DetailItem label="Razorpay Order ID" value={payment.razorpayOrderId} />
          <DetailItem label="Razorpay Payment ID" value={payment.razorpayPaymentId} />
          <DetailItem label="Payment Method" value={payment.paymentMethod} />
          <DetailItem label="Payment Type" value={payment.paymentType} />
        </DetailSection>

        <DetailSection title="Parties Involved">
          <DetailItem label="Manufacturer" value={payment.manufacturer?.companyName} />
          <DetailItem label="Manufacturer GST" value={payment.manufacturer?.companyGstNumber} />
          <DetailItem label="Transporter" value={payment.transporter?.companyName} />
          <DetailItem label="Transporter GST" value={payment.transporter?.companyGstNumber} />
          {payment.driver && (
            <>
              <DetailItem label="Driver" value={payment.driver.name} />
              <DetailItem label="Driver Phone" value={payment.driver.phoneNumber} />
              <DetailItem label="License No" value={payment.driver.licenseNumber} />
            </>
          )}
        </DetailSection>

        <DetailSection title="Additional Information">
          <DetailItem label="Payment Notes" value={payment.notes} />
          <DetailItem label="Invoice Number" value={payment.invoiceNumber} />
          {payment.refundStatus && (
            <DetailItem label="Refund Status" value={payment.refundStatus} />
          )}
        </DetailSection>

        <DetailSection title="Timestamps">
          <DetailItem 
            label="Created" 
            value={payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'} 
          />
          <DetailItem 
            label="Updated" 
            value={payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : 'N/A'} 
          />
          {payment.completedAt && (
            <DetailItem 
              label="Completed" 
              value={new Date(payment.completedAt).toLocaleString()}
            />
          )}
        </DetailSection>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 12,
  },
  detail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 22,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#53a20e',
    marginBottom: 8,
  },
  headerButton: {
    padding: 10,
    marginHorizontal: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#53a20e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 12,
  },
  timestamp: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoIcon: {
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#666666',
    width: 120,
  },
  value: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  }
});

export default PaymentDetailsScreen;