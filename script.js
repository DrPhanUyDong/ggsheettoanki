// Hàm mở Trang 2 với id hồ sơ
function openConfig(khungId) {
  window.open(`page2.html?id=${khungId}`, "_blank");
}

// Ngăn click nút bên trong khung lan lên div.card
document.querySelectorAll('.card-buttons button').forEach(btn => {
  btn.addEventListener('click', function(e){
    e.stopPropagation();
  });
});

// Hàm tạo Anki (giữ nguyên)
function createAnki(event, hoSoName) {
  event.stopPropagation();
  alert(`Tạo Anki cho: ${hoSoName}`);
}

// Hàm sao chép (giữ nguyên)
function copyCard(event, hoSoName) {
  event.stopPropagation();
  alert(`Sao chép hồ sơ: ${hoSoName}`);
}

// Hàm mở Google Sheet (giữ nguyên)
function openSheet(event) {
  event.stopPropagation();
  alert('Mở Google Sheet');
}

// Hàm xóa hồ sơ
function deleteCard(event, btn) {
  event.stopPropagation();
  if(confirm("Bạn có chắc muốn xóa hồ sơ này?")) {
    btn.closest('.card').remove();
  }
}
