import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Alert } from 'react-native';
import { Card, Title, DataTable, Button, Subheading } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import moment from 'moment';
import axios from 'axios'; // Import Axios
import XLSX from 'xlsx'; // Import xlsx for Excel file generation
import * as FileSystem from 'expo-file-system'; // Use expo-file-system for file system operations
// Import the default locale or define your own
import en from 'react-native-paper-dates/src/translations/en';
import api from '../../services/api';


registerTranslation('en', en);

const ReportScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [visible, setVisible] = useState(false);
  const [jeepData, setJeepData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

  // Fetch data when the date changes
  const fetchJeepData = async () => {
    try {
      const { data } = await api.get(`/api/reports`, {
        params: { date: selectedDate },
      });
      setJeepData(data);

      const { data: revenueData } = await api.get('/api/total-revenue', {
        params: { date: selectedDate },
      });
      setTotalRevenue(revenueData.total_revenue);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchJeepData();
  }, [selectedDate]);

  const showDatePicker = () => setVisible(true);

  const handleConfirmDate = (date) => {
    const formattedDate = moment(date.date).format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setVisible(false);
  };

  const handleGenerateReport = () => {
    navigation.navigate('DetailedReport', { jeepData, totalRevenue });
  };

  const exportToExcel = async () => {
    // Prepare data
    const dataToExport = jeepData.map((jeep) => ({
      "Jeep ID": jeep.jeep_id,
      "Total Passenger": jeep.number_of_passenger,
      "Revenue (₱)": jeep.revenue,
    }));
  
    // Create a new workbook
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
  
    try {
      // Convert the workbook to a binary buffer
      const fileBuffer = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  
      // Create a temporary file path
      const tmpFilename = `Report_${formattedDate}.xlsx`;
      const tmpFileUri = `${FileSystem.documentDirectory}${tmpFilename}`;
  
      // Write the file to the temporary location
      await FileSystem.writeAsStringAsync(tmpFileUri, fileBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        // Share the file, which will prompt the user to choose a location to save
        await Sharing.shareAsync(tmpFileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Save Excel Report',
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error exporting file:", error);
      Alert.alert("Error", "Failed to export the report.");
    }
  };
  return (
    <ScrollView style={styles.container}>
      {/* Date Picker Section */}
      <View style={styles.datePickerContainer}>
        <Button icon="calendar" mode="outlined" onPress={showDatePicker} style={styles.dateButton}>
          Select Date: {formattedDate}
        </Button>
      </View>

      <DatePickerModal
        mode="single"
        visible={visible}
        onDismiss={() => setVisible(false)}
        date={new Date(selectedDate)}
        onConfirm={handleConfirmDate}
        locale="en"
      />

      {/* Report Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Daily Revenue Report</Title>
          <Subheading style={styles.subheading}>Date: {formattedDate}</Subheading>
        </Card.Content>
      </Card>

      {/* Revenue Breakdown */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Revenue Breakdown by Jeep</Title>
          <DataTable style={styles.table}>
            <DataTable.Header>
              <DataTable.Title>Jeep ID</DataTable.Title>
              <DataTable.Title numeric>Total Passenger</DataTable.Title>
              <DataTable.Title numeric>Revenue (₱)</DataTable.Title>
            </DataTable.Header>

            {jeepData.length > 0 ? (
              jeepData.map((jeep, index) => (
                <DataTable.Row key={jeep.id} style={[styles.dataRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                  <DataTable.Cell>{jeep.jeep_id}</DataTable.Cell>
                  <DataTable.Cell numeric>{jeep.number_of_passenger}</DataTable.Cell>
                  <DataTable.Cell numeric>{jeep.revenue}</DataTable.Cell>
                </DataTable.Row>
              ))
            ) : (
              <Text style={styles.noDataText}>No data available for the selected date.</Text>
            )}
          </DataTable>

          {/* Total Revenue Positioned at the Bottom Right */}
          <View style={styles.totalRevenueContainer}>
            <Text style={styles.totalRevenueText}>Total Revenue: ₱{totalRevenue}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} onPress={exportToExcel}>
          Export to Excel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: 20,
  },
  datePickerContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 5,
  },
  dateButton: {
    width: '100%',
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  subheading: {
    fontSize: 18,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
  },
  dataRow: {
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  totalRevenueContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRevenueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  buttonContainer: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 12,
    backgroundColor: '#6200ea',
  },
});

export default ReportScreen;
