import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
// Add these imports at the top of InvoiceDetail.js
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';

const InvoiceDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { payment } = route.params;
  const [downloading, setDownloading] = useState(false);
  const viewShotRef = useRef(null);

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    // Check if we should download automatically
    if (route.params?.downloadAutomatically) {
      downloadInvoice();
    }
  }, []);
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };
  
  // Get shipment status background color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return '#28a745';
      case 'IN_TRANSIT':
        return '#007bff';
      case 'DELIVERED':
        return '#6f42c1';
      case 'PENDING':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };
  
  // Get payment status background color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#28a745';
      case 'HELD':
        return '#ffc107';
      case 'PENDING':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  // Add this function to InvoiceDetail.js
  const openDownloadsFolder = () => {
    if (Platform.OS === 'android') {
      // This will open the Downloads folder
      RNFetchBlob.android.actionViewIntent('content://downloads/', 'resource/folder');
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 10 and above (API level 29+)
        if (Platform.Version >= 29) {
          // For Android 10+, we might still need permissions for certain operations
          // but we'll try without it first
          return true;
        } 
        // For Android 9 and below, we need explicit permission
        else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: "Storage Permission Required",
              message: "This app needs access to your storage to download invoices.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else {
            console.log("Storage permission denied");
            return false;
          }
        }
      } catch (err) {
        console.warn("Permission request error:", err);
        return false;
      }
    }
    // For iOS or other platforms
    return true;
  };


  const downloadInvoice = async () => {
    try {
      // Check for storage permission on Android
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied', 
          'Storage permission is required to download invoices. Please go to Settings > Apps > [Your App Name] > Permissions and enable Storage permission.'
        );
        return;
      }
  
      setDownloading(true);

       // Generate filename with timestamp to avoid conflicts
    const fileName = `Invoice_${payment.paymentId}_${Date.now()}.pdf`;
  
      // Generate HTML content from the invoice view
      // We'll create an HTML representation of the invoice
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 16px; }
              .company-name { font-size: 22px; font-weight: bold; color: #333333; margin-bottom: 4px; }
              .invoice-number { font-size: 16px; font-weight: 600; color: #555555; margin-bottom: 2px; }
              .invoice-date { font-size: 14px; color: #777777; }
              .status-badge { padding: 6px 12px; border-radius: 12px; display: inline-block; margin-bottom: 4px; color: white; font-weight: bold; }
              .section { margin-bottom: 20px; }
              .section-title { font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 12px; border-bottom: 1px solid #EEEEEE; padding-bottom: 8px; }
              .section-content { background-color: #F9F9F9; border-radius: 8px; padding: 12px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .info-label { font-size: 14px; color: #666666; width: 40%; }
              .info-value { font-size: 14px; color: #333333; font-weight: 500; width: 60%; text-align: right; }
              .info-value-highlight { font-size: 16px; color: #ff9800; font-weight: bold; width: 60%; text-align: right; }
              .small-status-badge { padding: 4px 8px; border-radius: 8px; display: inline-block; color: white; font-weight: bold; font-size: 12px; }
              .route-container { display: flex; justify-content: space-between; align-items: center; }
              .location-container { flex: 1; padding: 10px; }
              .location-title { font-size: 14px; color: #666666; margin-bottom: 4px; }
              .location-value { font-size: 16px; font-weight: bold; color: #333333; margin-bottom: 2px; }
              .location-detail { font-size: 14px; color: #555555; margin-bottom: 2px; }
              .postal-code { font-size: 12px; color: #777777; }
              .route-connector { font-size: 24px; color: #ffb74d; font-weight: bold; padding: 0 10px; }
              .parties-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .party-container { flex: 1; background-color: #F9F9F9; border-radius: 8px; padding: 12px; margin: 0 4px; }
              .party-title { font-size: 16px; font-weight: bold; color: #333333; margin-bottom: 8px; }
              .party-name { font-size: 15px; font-weight: 600; color: #444444; margin-bottom: 6px; }
              .party-detail { font-size: 13px; color: #666666; margin-bottom: 3px; }
              .summary-section { background-color: #F5F5F5; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
              .summary-title { font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 12px; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .summary-label { font-size: 14px; color: #666666; }
              .summary-value { font-size: 14px; color: #333333; font-weight: 500; }
              .summary-divider { height: 1px; background-color: #DDDDDD; margin: 10px 0; }
              .total-label { font-size: 16px; font-weight: bold; color: #333333; }
              .total-value { font-size: 18px; font-weight: bold; color: #ff9800; }
              .footer { text-align: center; padding-top: 20px; border-top: 1px solid #EEEEEE; }
              .footer-text { font-size: 14px; color: #666666; margin-bottom: 4px; }
              .footer-notes { font-size: 12px; color: #999999; margin-top: 8px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div>
                <div class="company-name">Transport Payment Invoice</div>
                <div class="invoice-number">Invoice #${payment.paymentId}</div>
                <div class="invoice-date">Date: ${formatDate(payment.createdAt)}</div>
              </div>
              <div>
                <div class="status-badge" style="background-color: ${getPaymentStatusColor(payment.paymentStatus)}">
                  ${payment.paymentStatus}
                </div>
              </div>
            </div>
  
            <div class="section">
              <div class="section-title">Payment Information</div>
              <div class="section-content">
                <div class="info-row">
                  <div class="info-label">Payment ID:</div>
                  <div class="info-value">${payment.paymentId}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Amount:</div>
                  <div class="info-value-highlight">${formatCurrency(payment.amount)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Status:</div>
                  <div class="small-status-badge" style="background-color: ${getPaymentStatusColor(payment.paymentStatus)}">
                    ${payment.paymentStatus}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Payment Date:</div>
                  <div class="info-value">${formatDate(payment.createdAt)} ${formatTime(payment.createdAt)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Released Date:</div>
                  <div class="info-value">${formatDate(payment.releasedAt)} ${formatTime(payment.releasedAt)}</div>
                </div>
                ${payment.razorpayPaymentId ? `
                <div class="info-row">
                  <div class="info-label">Transaction ID:</div>
                  <div class="info-value">${payment.razorpayPaymentId}</div>
                </div>` : ''}
              </div>
            </div>
  
            <div class="section">
              <div class="section-title">Shipment Details</div>
              <div class="section-content">
                <div class="info-row">
                  <div class="info-label">Shipment ID:</div>
                  <div class="info-value">#${shipment.shipmentId}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Cargo Type:</div>
                  <div class="info-value">${shipment.cargoType}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Weight:</div>
                  <div class="info-value">${shipment.weight.toFixed(2)} kg</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Vehicle Type:</div>
                  <div class="info-value">${shipment.vehicleTypeRequired}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Refrigeration:</div>
                  <div class="info-value">${shipment.refrigeratorRequired ? 'Required' : 'Not Required'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Status:</div>
                  <div class="small-status-badge" style="background-color: ${getStatusColor(shipment.shipmentStatus)}">
                    ${shipment.shipmentStatus}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Pickup Date:</div>
                  <div class="info-value">${formatDate(shipment.pickupDate)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Delivery Date:</div>
                  <div class="info-value">${formatDate(shipment.deliveryDate)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Estimated Price:</div>
                  <div class="info-value">${shipment.estimatedPrice || 'N/A'}</div>
                </div>
              </div>
            </div>
  
            <div class="section">
              <div class="section-title">Route Information</div>
              <div class="section-content">
                <div class="route-container">
                  <div class="location-container">
                    <div class="location-title">From</div>
                    <div class="location-value">${shipment.pickupTown}</div>
                    <div class="location-detail">${shipment.pickupState}, ${shipment.pickupCountry}</div>
                    <div class="postal-code">PIN: ${shipment.pickupPostalCode}</div>
                  </div>
                  <div class="route-connector">→</div>
                  <div class="location-container">
                    <div class="location-title">To</div>
                    <div class="location-value">${shipment.dropTown}</div>
                    <div class="location-detail">${shipment.dropState}, ${shipment.dropCountry}</div>
                    <div class="postal-code">PIN: ${shipment.dropPostalCode}</div>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="parties-section">
              <div class="party-container">
                <div class="party-title">Customer</div>
                <div class="party-name">${manufacturer.companyName}</div>
                <div class="party-detail">Contact: ${manufacturer.user.name}</div>
                <div class="party-detail">Email: ${manufacturer.email}</div>
                <div class="party-detail">Phone: ${manufacturer.phoneNumber}</div>
                <div class="party-detail">GSTIN: ${manufacturer.companyGstNumber}</div>
              </div>
              <div class="party-container">
                <div class="party-title">Transporter</div>
                <div class="party-name">${transporter.companyName}</div>
                <div class="party-detail">Contact: ${transporter.user.name || 'N/A'}</div>
                <div class="party-detail">Email: ${transporter.email}</div>
                <div class="party-detail">Phone: ${transporter.phoneNumber}</div>
                <div class="party-detail">GSTIN: ${transporter.companyGstNumber}</div>
              </div>
            </div>
  
            <div class="summary-section">
              <div class="summary-title">Payment Summary</div>
              <div class="summary-row">
                <div class="summary-label">Subtotal:</div>
                <div class="summary-value">${formatCurrency(payment.amount)}</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">Tax (Included):</div>
                <div class="summary-value">${formatCurrency(payment.amount * 0.18)}</div>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row">
                <div class="total-label">Total:</div>
                <div class="total-value">${formatCurrency(payment.amount)}</div>
              </div>
            </div>
  
            <div class="footer">
              <div class="footer-text">Thank you for your business!</div>
              <div class="footer-text">Payment processed through Razorpay</div>
              <div class="footer-notes">
                This is a computer-generated invoice and does not require a physical signature.
              </div>
            </div>
          </body>
        </html>
      `;
  
      // Generate PDF from HTML
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: 'Documents',
    };

    // Set appropriate directory based on platform
    if (Platform.OS === 'android') {
      options.directory = RNFetchBlob.fs.dirs.DownloadDir;
    }

    const file = await RNHTMLtoPDF.convert(options);
    
    if (Platform.OS === 'android') {
      // For Android
      const filePath = file.filePath;
      
      // Extract just the filename from the path for display
      const fileNameOnly = filePath.split('/').pop();
      
      // Show success notification
      RNFetchBlob.android.addCompleteDownload({
        title: 'Invoice Downloaded',
        description: `Payment Invoice #${payment.paymentId}`,
        mime: 'application/pdf',
        path: filePath,
        showNotification: true,
      });
      
      // Ask user if they want to open the PDF
      Alert.alert(
        'Download Complete',
        `PDF invoice has been saved to Downloads as "${fileNameOnly}"`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Open PDF', 
            onPress: () => {
              FileViewer.open(filePath, { showOpenWithDialog: true })
                .catch(error => {
                  console.error('Error opening PDF:', error);
                  Alert.alert('Error', 'Could not open the PDF file.');
                });
            } 
          },
          {
            text: 'Open Downloads',
            onPress: () => openDownloadsFolder()
          }
        ]
      );
    } else {
      // For iOS
      const fileNameOnly = file.filePath.split('/').pop();
      
      Alert.alert(
        'Download Complete',
        `PDF invoice has been saved as "${fileNameOnly}"`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Open PDF', 
            onPress: () => {
              FileViewer.open(file.filePath, { showOpenWithDialog: true })
                .catch(error => {
                  console.error('Error opening PDF:', error);
                  Alert.alert('Error', 'Could not open the PDF file.');
                });
            } 
          }
        ]
      );
    }
    
    setDownloading(false);
  } catch (error) {
    setDownloading(false);
    console.error('Error generating PDF invoice:', error);
    Alert.alert(
      'PDF Generation Failed',
      `There was an error while creating the PDF invoice: ${error.message}. Please try again.`
    );
  }
};

  // Only proceed if we have payment data
  if (!payment || !payment.shipment) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Invoice data not available</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const shipment = payment.shipment;
  const manufacturer = payment.manufacturer;
  const transporter = payment.transporter;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <ScrollView style={styles.scrollContainer}>
        <ViewShot 
          ref={viewShotRef} 
          options={{ format: 'png', quality: 0.9 }}
          style={styles.invoiceContainer}
        >
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.companyName}>Transport Payment Invoice</Text>
              <Text style={styles.invoiceNumber}>Invoice #{payment.paymentId}</Text>
              <Text style={styles.invoiceDate}>Date: {formatDate(payment.createdAt)}</Text>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, {backgroundColor: getPaymentStatusColor(payment.paymentStatus)}]}>
                <Text style={styles.statusText}>{payment.paymentStatus}</Text>
              </View>
            </View>
          </View>
          
          {/* Payment Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment ID:</Text>
                <Text style={styles.infoValue}>{payment.paymentId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValueHighlight}>{formatCurrency(payment.amount)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[styles.smallStatusBadge, {backgroundColor: getPaymentStatusColor(payment.paymentStatus)}]}>
                  <Text style={styles.smallStatusText}>{payment.paymentStatus}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Date:</Text>
                <Text style={styles.infoValue}>{formatDate(payment.createdAt)} {formatTime(payment.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Released Date:</Text>
                <Text style={styles.infoValue}>{formatDate(payment.releasedAt)} {formatTime(payment.releasedAt)}</Text>
              </View>
              {payment.razorpayPaymentId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transaction ID:</Text>
                  <Text style={styles.infoValue}>{payment.razorpayPaymentId}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Shipment Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment Details</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Shipment ID:</Text>
                <Text style={styles.infoValue}>#{shipment.shipmentId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cargo Type:</Text>
                <Text style={styles.infoValue}>{shipment.cargoType}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Weight:</Text>
                <Text style={styles.infoValue}>{shipment.weight.toFixed(2)} kg</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle Type:</Text>
                <Text style={styles.infoValue}>{shipment.vehicleTypeRequired}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Refrigeration:</Text>
                <Text style={styles.infoValue}>{shipment.refrigeratorRequired ? 'Required' : 'Not Required'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[styles.smallStatusBadge, {backgroundColor: getStatusColor(shipment.shipmentStatus)}]}>
                  <Text style={styles.smallStatusText}>{shipment.shipmentStatus}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pickup Date:</Text>
                <Text style={styles.infoValue}>{formatDate(shipment.pickupDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Date:</Text>
                <Text style={styles.infoValue}>{formatDate(shipment.deliveryDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Price:</Text>
                <Text style={styles.infoValue}>{shipment.estimatedPrice || 'N/A'}</Text>
              </View>
            </View>
          </View>
          
          {/* Route Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.routeContainer}>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationTitle}>From</Text>
                  <Text style={styles.locationValue}>{shipment.pickupTown}</Text>
                  <Text style={styles.locationDetail}>{shipment.pickupState}, {shipment.pickupCountry}</Text>
                  <Text style={styles.postalCode}>PIN: {shipment.pickupPostalCode}</Text>
                </View>
                
                <Text style={styles.routeConnector}>→</Text>
                
                <View style={styles.locationContainer}>
                  <Text style={styles.locationTitle}>To</Text>
                  <Text style={styles.locationValue}>{shipment.dropTown}</Text>
                  <Text style={styles.locationDetail}>{shipment.dropState}, {shipment.dropCountry}</Text>
                  <Text style={styles.postalCode}>PIN: {shipment.dropPostalCode}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Customer and Transporter Information */}
          <View style={styles.partiesSection}>
            <View style={styles.partyContainer}>
              <Text style={styles.partyTitle}>Customer</Text>
              <Text style={styles.partyName}>{manufacturer.companyName}</Text>
              <Text style={styles.partyDetail}>Contact: {manufacturer.user.name}</Text>
              <Text style={styles.partyDetail}>Email: {manufacturer.email}</Text>
              <Text style={styles.partyDetail}>Phone: {manufacturer.phoneNumber}</Text>
              <Text style={styles.partyDetail}>GSTIN: {manufacturer.companyGstNumber}</Text>
            </View>
            
            <View style={styles.partyContainer}>
              <Text style={styles.partyTitle}>Transporter</Text>
              <Text style={styles.partyName}>{transporter.companyName}</Text>
              <Text style={styles.partyDetail}>Contact: {transporter.user.name || 'N/A'}</Text>
              <Text style={styles.partyDetail}>Email: {transporter.email}</Text>
              <Text style={styles.partyDetail}>Phone: {transporter.phoneNumber}</Text>
              <Text style={styles.partyDetail}>GSTIN: {transporter.companyGstNumber}</Text>
            </View>
          </View>
          
          {/* Payment Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (Included):</Text>
              <Text style={styles.summaryValue}>{formatCurrency(payment.amount * 0.18)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(payment.amount)}</Text>
            </View>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerText}>Payment processed through Razorpay</Text>
            <Text style={styles.footerNotes}>
              This is a computer-generated invoice and does not require a physical signature.
            </Text>
          </View>
        </ViewShot>
      </ScrollView>
      
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Close</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={downloadInvoice}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Download Invoice</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d9534f',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  downloadButtonHeader: {
    backgroundColor: '#ffb74d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  invoiceContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#777777',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  smallStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 16,
    color: '#ff9800',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flex: 1,
    padding: 10,
  },
  locationTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  locationDetail: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 2,
  },
  postalCode: {
    fontSize: 12,
    color: '#777777',
  },
  routeConnector: {
    fontSize: 24,
    color: '#ffb74d',
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  partiesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partyContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  partyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
  },
  partyDetail: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 3,
  },
  summarySection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  footerNotes: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
  },
  primaryButton: {
    backgroundColor: '#ffb74d',
    borderWidth: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default InvoiceDetail;