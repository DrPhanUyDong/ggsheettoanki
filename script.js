// 🔄 Load danh sách hồ sơ từ localStorage
let hoSoData = JSON.parse(localStorage.getItem("hoSoData")) || {};

// 🔍 DOM
const hoSoContainer = document.getElementById("hoSoContainer");
const taoHoSoBtn = document.getElementById("taoHoSoBtn");

// ✅ Hàm render toàn bộ danh sách hồ sơ
function renderHoSoList() {
  hoSoContainer.innerHTML = "";

  const keys = Object.keys(hoSoData);
  if (keys.length === 0) {
    hoSoContainer.innerHTML = "<p style='text-align:center;color:#888;'>📂 Chưa có hồ sơ nào. Hãy tạo mới!</p>";
    return;
  }

  keys.forEach(khungId => {
    const hs = hoSoData[khungId];

    const card = document.createElement("div");
    card.className = "hoso-card";
    card.dataset.id = khungId;

    card.innerHTML = `
      <div class="hoso-main">
        <h3>${hs.tenHoSo || "Hồ sơ chưa đặt tên"}</h3>
        <p>${hs.moTa || ""}</p>
      </div>
      <div class="hoso-actions">
        <button class="btn-create">📦 Tạo Anki</button>
        <button class="btn-sheet">🔗 Google Sheet</button>
        <button class="btn-copy">📄 Sao chép</button>
        <button class="btn-delete">🗑️ Xoá</button>
      </div>
    `;

    // 👉 Click vùng chính mở trang 2
    card.querySelector(".hoso-main").addEventListener("click", () => {
      window.location.href = `page2.html?id=${khungId}`;
    });

    // 📦 Nút tạo Anki
    card.querySelector(".btn-create").addEventListener("click", () => {
      alert(`🚀 Tính năng tạo Anki cho "${hs.tenHoSo}" sẽ được gọi ở đây.`);
    });

    // 🔗 Nút mở Google Sheet
    card.querySelector(".btn-sheet").addEventListener("click", () => {
      if (hs.editLink) {
        window.open(hs.editLink, "_blank");
      } else {
        alert("❌ Hồ sơ này chưa có link Google Sheet!");
      }
    });

    // 📄 Nút sao chép hồ sơ
    card.querySelector(".btn-copy").addEventListener("click", () => {
      const newId = `hoso_${Date.now()}`;
      hoSoData[newId] = JSON.parse(JSON.stringify(hs));
      hoSoData[newId].tenHoSo += " (bản sao)";
      localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
      renderHoSoList();
    });

    // 🗑️ Nút xoá hồ sơ
    card.querySelector(".btn-delete").addEventListener("click", () => {
      if (confirm(`Bạn có chắc muốn xoá hồ sơ "${hs.tenHoSo}" không?`)) {
        delete hoSoData[khungId];
        localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
        renderHoSoList();
      }
    });

    hoSoContainer.appendChild(card);
  });
}

// ✅ Nút tạo hồ sơ mới
taoHoSoBtn.addEventListener("click", () => {
  const newId = `hoso_${Date.now()}`;
  hoSoData[newId] = {
    tenHoSo: "Hồ sơ mới",
    moTa: "Mô tả hồ sơ...",
    editLink: "",
    pubLink: "",
    bangMaHoa: []
  };
  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
  renderHoSoList();
});

// 🚀 Khi load trang → render ngay
renderHoSoList();
