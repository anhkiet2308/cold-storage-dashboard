// Tạo file utils/exportUtils.js
export const exportToPDF = (alertHistory, type) => {
  console.log('📄 Exporting to PDF...');
  try {
    // Simple HTML to PDF approach
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo Cảnh báo - ${new Date().toLocaleDateString('vi-VN')}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO CẢNH BÁO NHIỆT ĐỘ</h1>
          <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
          <p>Tổng số cảnh báo: ${alertHistory.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Cảm biến</th>
              <th>Loại cảnh báo</th>
              <th>Nhiệt độ (°C)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${alertHistory.map(alert => `
              <tr>
                <td>${alert.time}</td>
                <td>${alert.sensor}</td>
                <td>${alert.type === 'high' ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp'}</td>
                <td>${alert.temperature?.toFixed ? alert.temperature.toFixed(1) : alert.temperature}</td>
                <td>${alert.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
  } catch (error) {
    console.error('❌ PDF export error:', error);
    alert('Lỗi khi xuất PDF: ' + error.message);
  }
};

export const exportToExcel = (temperatureLogs, sensors, type) => {
  console.log('📊 Exporting to Excel...');
  try {
    // Create CSV content
    const headers = ['Thời gian', 'Cảm biến', 'Nhiệt độ (°C)'];
    const csvContent = [
      headers.join(','),
      ...temperatureLogs.map(log => {
        const sensor = sensors.find(s => s.id === log.sensor_id);
        return [
          new Date(log.logged_at).toLocaleString('vi-VN'),
          sensor?.name || `Sensor ${log.sensor_id}`,
          log.temperature
        ].join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bao-cao-nhiet-do-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('❌ Excel export error:', error);
    alert('Lỗi khi xuất Excel: ' + error.message);
  }
};