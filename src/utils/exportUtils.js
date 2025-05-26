import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export to PDF
export const exportToPDF = (data, type = 'alerts') => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('vi-VN');
  
  // Header
  doc.setFontSize(16);
  doc.text('HỆ THỐNG GIÁM SÁT NHIỆT ĐỘ KHO LẠNH', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Báo cáo ${type === 'alerts' ? 'cảnh báo' : 'nhiệt độ'} - Ngày: ${date}`, 105, 30, { align: 'center' });
  
  if (type === 'alerts') {
    // Alerts table
    const tableData = data.map(alert => [
      alert.time,
      alert.sensor,
      alert.type === 'high' ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp',
      `${alert.temperature}°C`,
      alert.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'
    ]);
    
    doc.autoTable({
      head: [['Thời gian', 'Cảm biến', 'Loại cảnh báo', 'Nhiệt độ', 'Trạng thái']],
      body: tableData,
      startY: 45,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  } else {
    // Temperature logs table
    const tableData = data.map(log => [
      new Date(log.logged_at).toLocaleString('vi-VN'),
      `Sensor ${log.sensor_id}`,
      `${log.temperature}°C`
    ]);
    
    doc.autoTable({
      head: [['Thời gian', 'Cảm biến', 'Nhiệt độ']],
      body: tableData,
      startY: 45,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Trang ${i} / ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Save
  doc.save(`baocao_${type}_${new Date().getTime()}.pdf`);
};

// Export to Excel
export const exportToExcel = (data, sensors, type = 'temperature') => {
  const ws_name = type === 'temperature' ? 'Nhiệt độ' : 'Cảnh báo';
  const wb = XLSX.utils.book_new();
  
  if (type === 'temperature') {
    // Temperature report
    const ws_data = [
      ['BÁO CÁO NHIỆT ĐỘ KHO LẠNH'],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      ['Thống kê tổng quan'],
      ...sensors.map(sensor => [
        sensor.name,
        `Hiện tại: ${sensor.temperature}°C`,
        `Min: ${sensor.min_threshold}°C`,
        `Max: ${sensor.max_threshold}°C`,
        sensor.status === 'active' ? 'Bình thường' : 'Cảnh báo'
      ]),
      [],
      ['Chi tiết logs'],
      ['Thời gian', 'Cảm biến', 'Nhiệt độ'],
      ...data.map(log => [
        new Date(log.logged_at).toLocaleString('vi-VN'),
        `Sensor ${log.sensor_id}`,
        `${log.temperature}°C`
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
  } else {
    // Alerts report
    const ws_data = [
      ['BÁO CÁO CẢNH BÁO'],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      ['Thời gian', 'Cảm biến', 'Loại cảnh báo', 'Nhiệt độ', 'Trạng thái'],
      ...data.map(alert => [
        alert.time,
        alert.sensor,
        alert.type === 'high' ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp',
        `${alert.temperature}°C`,
        alert.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
  }
  
  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 
    `baocao_${type}_${new Date().getTime()}.xlsx`);
};

// Send email notification
export const sendEmailNotification = async (supabase, alert, emails) => {
  try {
    // Trong thực tế, bạn cần setup email service (SendGrid, AWS SES, etc.)
    // Đây chỉ là mock function
    console.log('Sending email to:', emails);
    console.log('Alert:', alert);
    
    // Update alert status
    await supabase
      .from('alerts')
      .update({ notification_sent: true })
      .eq('id', alert.id);
      
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send SMS notification
export const sendSMSNotification = async (supabase, alert, phones) => {
  try {
    // Trong thực tế, bạn cần setup SMS service (Twilio, etc.)
    // Đây chỉ là mock function
    console.log('Sending SMS to:', phones);
    console.log('Alert:', alert);
    
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};