import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native"; // ✅ Import this
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../User/LoginScreen";
import RegisterScreen from "../User/RegisterScreen";
import WelcomeScreen from "../User/WelcomeScreen";
import TrackingApp from "../dashboards/TrackingApp";
import Dashboard from "../transportation/Dashboard";
import DriverDashboard from "../driver/DriverDashboard";
import ShipmentForm from "../shipments/ShipmentForm";
import DetailsPage from "../settings/DetailsPage";
import PersonalDetailsForm from "../settings/PersonalDetailsForm";
import AccountDetailsForm from "../settings/AccountDetailsForm";
import VehicleInfoForm from "../settings/VehicleInfoForm";
import ConfirmInvitation from "../driver/ConfirmInvitation";
import DriverProfile from "../driver/DriverProfile";


import Header from "../header/Header";
import Footer from "../footer/Footer";
import CompletedTrips from "../driver/CompletedTrips";
import DriverFeedback from "../driver/DriverFeedback";
import DriverInvoices from "../driver/DriverInvoices";
// import DriverRewards from "../driver/DriverRewards";
import DriverShipment from "../driver/DriverShipment";
import DocumentsForm from "../settings/DocumentsForm";
import ShipmentDetails from "../shipments/ShipmentDetails";
import ShipmentList from "../shipments/ShipmentList";
import TransporterShipmentScreen from "../transportation/TransporterShipmentScreen";
import ShipmentCompletedScreen from "../transportation/ShipmentCompletedScreen";
import TransporterInvoicesScreen from "../transportation/TransporterInvoicesScreen";
import TransporterFeedbackScreen from "../transportation/TransporterFeedbackScreen";
import QuoteFormScreen from "../transportation/QuoteFormScreen";
import AssignDriverScreen from "../transportation/AssignDriverScreen";
import SubmitQuotation from "../shipments/SubmitQuotation";
import DriverShipmentDetails from "../driver/DriverShipmentDetails";
import CompanyDetailsForm from "../settings/CompanyDetailsForm";
import AssignVehicleScreen from "../transportation/AssignVehicleScreen";
import DriverTracking from "../driver/DriverTracking";
import UpdatePasswordScreen from "../settings/UpdatePasswordScreen";
import OTPVerificationScreen from "../User/OTPVerificationScreen";
// import SubmitQuotation from "../shipments/SubmitQuotation";
// import DriverShipmentDetails from "../driver/DriverShipmentDetails";
// import CompanyDetailsForm from "../settings/CompanyDetailsForm";
import ShipmentQuotation from "../shipments/ShipmentQuotation";
import ShipmentsQuotation from "../Quotations/ShipmentsQuotation";
import QuotationsListScreen from "../Quotations/QuotationsListScreen";
import QuotationDetailsScreen from "../Quotations/QuotationDetailsScreen";
import PaymentScreen from "../Payment/PaymentScreen";
import PaymentRecordsScreen from "../Payment/PaymentRecordsScreen";
import UserProfile from "../header/UserProfile";
import NotificationsScreen from "../header/NotificationsScreen ";
import PostDetailScreen from "../header/PostDetailScreen";
import TransporterPaymentsScreen from "../transportation/TransporterPaymentsScreen";
import DriverPaymentScreen from "../transportation/DriverPaymentScreen";
import SuggestedVehiclesScreen from "../AI&ML Suggesrions/SuggestedVehiclesScreen ";
import ComingSoonPage from "../dashboards/ComingSoonPage";
import ManufacturerAnalytics from "../AI&ML Suggesrions/ManufacturerAnalytics ";
import StatisticsScreen from "../AI&ML Suggesrions/StatisticsScreen";
import TransporterQuotations from "../transportation/TransporterQuotations";
import ShipmentDocuments from "../driver/ShipmentDocuments";
import InTransitTracking from "../driver/InTransitTracking";

import PaymentDetailsScreen from '../Payment/PaymentDetailsScreen ';
import TFeedbackForm from "../transportation/TFeedbackForm";
import ShipmentTrack from "../transportation/ShipmentTrack";
import ShipmentTracking from "../ManufactureTracking/ShipmentTracking";
import UploadShipmentScreen from "../Quotations/UploadShipmentScreen.jsx";
import InvoiceDetail from "../ManufatureInvoice/InvoiceDetail.jsx";
import PaymentInvoices from "../ManufatureInvoice/PaymentInvoices.jsx";
import DriverFeedScreen from "../driver/DriverFeedScreen.jsx";
import TransporterDriversScreen from "../transportation/TransporterDriversScreen.jsx";
import TransporterVehiclesScreen from "../transportation/TransporterVehiclesScreen.jsx";
import ShipmentDocumentsdetails from "../shipments/ShipmentDocumentsdetails .jsx";





const Stack = createStackNavigator();

// Custom Layout with Header and Footer
const ScreenWithLayout = ({ Component, navigation, route }) => {
  return (
    <>
      <Header navigation={navigation} />
      <Component navigation={navigation} route={route} />
      <Footer navigation={navigation} />
    </>
  );
};

// Helper to render screens with the layout
const renderScreenWithLayout = (Component) => ({ navigation, route }) =>
  <ScreenWithLayout Component={Component} navigation={navigation} route={route} />;

const Navigation = () => {
  
    const [initialRoute, setInitialRoute] = useState(null); // null = still checking
  
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          const role = await AsyncStorage.getItem("role");
  
          if (token && role) {
            if (role === "MANUFACTURER") setInitialRoute("TrackingApp");
            else if (role === "TRANSPORTER") setInitialRoute("Dashboard");
            else if (role === "DRIVER") setInitialRoute("DriverDashboard");
            else setInitialRoute("Login"); // unknown role fallback
          } else {
            setInitialRoute("Login"); // no token
          }
        } catch (e) {
          console.error("Error checking login:", e);
          setInitialRoute("Login");
        }
      };
  
      checkAuth();
    }, []);
  
    if (!initialRoute) {
      // Still loading — show splash or loader
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }
  
  return (
    // <Stack.Navigator initialRouteName="Login">
    <Stack.Navigator initialRouteName={initialRoute}>

      {/* Screens without Header and Footer */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="DriverFeedScreen"
        component={renderScreenWithLayout(DriverFeedScreen)}
        options={{ headerShown: false }}
      />
      

      {/* Screens with Header and Footer */}
      <Stack.Screen
        name="TrackingApp"
        component={renderScreenWithLayout(TrackingApp)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={renderScreenWithLayout(Dashboard)}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DriverDashboard"
        component={renderScreenWithLayout(DriverDashboard)}
        options={{ headerShown: false }}
      />
  

      <Stack.Screen
        name="ShipmentForm"
        component={ShipmentForm}
        options={{
          // title: 'Payment Details',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DetailsPage"
        component={renderScreenWithLayout(DetailsPage)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DocumentsForm"
        component={renderScreenWithLayout(DocumentsForm)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PersonalDetailsForm"
        component={renderScreenWithLayout(PersonalDetailsForm)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccountDetailsForm"
        component={renderScreenWithLayout(AccountDetailsForm)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VehicleInfoForm"
        component={renderScreenWithLayout(VehicleInfoForm)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfirmInvitation"
        component={renderScreenWithLayout(ConfirmInvitation)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompletedTrips"
        component={renderScreenWithLayout(CompletedTrips)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverFeedback"
        component={renderScreenWithLayout(DriverFeedback)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverInvoices"
        component={renderScreenWithLayout(DriverInvoices)}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="DriverRewards"
        component={renderScreenWithLayout(DriverRewards)}
        options={{ headerShown: false }}
      /> */}
      <Stack.Screen
        name="DriverShipment"
        component={renderScreenWithLayout(DriverShipment)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverProfile"
        component={renderScreenWithLayout(DriverProfile)}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ShipmentDetails"
        component={ShipmentDetails}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ShipmentList"
        component={ShipmentList}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="TransporterShipmentScreen"
        component={renderScreenWithLayout(TransporterShipmentScreen)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="ShipmentCompletedScreen"
        component={renderScreenWithLayout(ShipmentCompletedScreen)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="TransporterInvoicesScreen"
        component={renderScreenWithLayout(TransporterInvoicesScreen)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="TransporterFeedbackScreen"
        component={renderScreenWithLayout(TransporterFeedbackScreen)}
        options={{ headerShown: false }}

      />

      <Stack.Screen
        name="QuoteFormScreen"
        component={renderScreenWithLayout(QuoteFormScreen)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="AssignDriverScreen"
        component={renderScreenWithLayout(AssignDriverScreen)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdatePasswordScreen"
        component={UpdatePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubmitQuotation"
        component={renderScreenWithLayout(SubmitQuotation)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="DriverShipmentDetails"
        component={renderScreenWithLayout(DriverShipmentDetails)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="CompanyDetailsForm"
        component={renderScreenWithLayout(CompanyDetailsForm)}
        options={{ headerShown: false }}

      />

      <Stack.Screen
        name="AssignVehicleScreen"
        component={renderScreenWithLayout(AssignVehicleScreen)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShipmentsQuotation"
        component={ShipmentsQuotation}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
     
      <Stack.Screen
        name="QuotationsListScreen"
        component={QuotationsListScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="QuotationDetailsScreen"
        component={QuotationDetailsScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="DriverTracking"
        component={renderScreenWithLayout(DriverTracking)}
        options={{ headerShown: false }}

      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="PaymentRecords"
        component={PaymentRecordsScreen}
        options={{ title: 'Payment Records' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PostDetails"
        component={PostDetailScreen}
        options={{ headerShown: false }}

      />

      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransporterPaymentsScreen"
        component={renderScreenWithLayout(TransporterPaymentsScreen)}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DriverPaymentScreen"
        component={renderScreenWithLayout(DriverPaymentScreen)}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SuggestedVehiclesScreen"
        component={SuggestedVehiclesScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="ComingSoonPage"
        component={ComingSoonPage}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />


     
      <Stack.Screen
        name="ManufacturerAnalytics"
        component={ManufacturerAnalytics}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="StatisticsScreen"
        component={StatisticsScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="TransporterQuotations"
        component={renderScreenWithLayout(TransporterQuotations)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShipmentDocuments"
        component={renderScreenWithLayout(ShipmentDocuments)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InTransitTracking"
        component={renderScreenWithLayout(InTransitTracking)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TFeedbackForm"
        component={renderScreenWithLayout(TFeedbackForm)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShipmentTrack"
        component={renderScreenWithLayout(ShipmentTrack)}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="TransporterDriversScreen"
        component={renderScreenWithLayout(TransporterDriversScreen)}
        options={{ headerShown: false }}
     />
      <Stack.Screen
        name="TransporterVehiclesScreen"
        component={renderScreenWithLayout(TransporterVehiclesScreen)}
        options={{ headerShown: false }}
     />


      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={{
          title: 'Payment Details',
          headerShown: true,
        }}
      />

<Stack.Screen
        name="ShipmentTracking"
        component={ShipmentTracking}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="UploadShipmentScreen"
        component={UploadShipmentScreen}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="PaymentInvoices"
        component={PaymentInvoices}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetail}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ShipmentDocumentsdetails"
        component={ShipmentDocumentsdetails}
        options={{
          // title: 'Payment Details',
          headerShown: true,
        }}
      />
     



    </Stack.Navigator>
  );
};

export default Navigation;
