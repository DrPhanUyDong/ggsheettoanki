// ✅ Lấy ID khung từ URL
const params = new URLSearchParams(window.location.search);
const khungId = params.get("id") || "default";

// ✅ Đọc dữ liệu hồ sơ từ localStorage
let hoSoData = JSON.parse(localStorage.getItem("hoSoData")) || {};
if (!hoSoData[khungId]) {
  hoSoData[khungId] = {
    tenHoSo: "Hồ sơ mặc định by Đông",
    moTa: "Anki được tạo bởi Đông.",
    editLink: "",
    pubLink: "",
    bangMaHoa: []
  };
  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
}

// ✅ DOM
const profileTitle = document.getElementById("profileTitle");
const profileNameInput = document.getElementById("profileName");
const profileDescInput = document.getElementById("profileDesc");
const editLinkInput = document.getElementById("editLink");
const pubLinkInput = document.getElementById("pubLink");
const saveBtn = document.getElementById("saveBtn");
const backBtn = document.getElementById("backBtn");
const tbody = document.querySelector("#columnTable tbody");

// ✅ Load dữ liệu hồ sơ vào giao diện
profileTitle.innerText = hoSoData[khungId].tenHoSo;
profileNameInput.value = hoSoData[khungId].tenHoSo;
profileDescInput.value = hoSoData[khungId].moTa;
editLinkInput.value = hoSoData[khungId].editLink;
pubLinkInput.value = hoSoData[khungId].pubLink;

// ✅ Cập nhật tiêu đề khi đổi tên
profileNameInput.addEventListener("input", () => {
  profileTitle.innerText = profileNameInput.value || "Hồ sơ mặc định by Đông";
});

// ✅ Hàm đọc Google Sheet → render bảng
async function loadBangMaHoaTuSheet() {
  const pubUrl = pubLinkInput.value.trim();
  if (!pubUrl) {
    tbody.innerHTML = "<tr><td colspan='4'>Chưa có link Google Sheet.</td></tr>";
    return;
  }

  tbody.innerHTML = "<tr><td colspan='4'>⏳ Đang tải dữ liệu từ Google Sheet...</td></tr>";

  try {
    const res = await fetch(pubUrl);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 🔍 Lấy tất cả bảng, chọn bảng lớn nhất
    const tables = Array.from(doc.querySelectorAll("table"));
    if (tables.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>❌ Không tìm thấy bảng nào trong pubhtml.</td></tr>";
      return;
    }
    const table = tables.sort((a, b) => b.querySelectorAll("tr").length - a.querySelectorAll("tr").length)[0];

    // ✅ Lấy hàng đầu tiên làm tiêu đề
    const firstRow = table.querySelector("tr");
    const cols = Array.from(firstRow.querySelectorAll("td, th"))
      .map(td => td.innerText.trim().replace(/\s+/g, " "));

    if (cols.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>❌ Không đọc được tên cột.</td></tr>";
      return;
    }

    // ✅ Render
    tbody.innerHTML = "";
    cols.forEach((colName, index) => {
      const tr = document.createElement("tr");
      const prev = hoSoData[khungId].bangMaHoa[index] || [];
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${colName}</td>
        <td><input type="checkbox" ${prev[1] ? "checked" : ""}></td>
        <td><input type="checkbox" ${prev[2] ? "checked" : ""}></td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    console.error(e);
    tbody.innerHTML = "<tr><td colspan='4'>⚠️ Lỗi tải dữ liệu từ Sheet (có thể link sai hoặc bị chặn CORS).</td></tr>";
  }
}

// ✅ Gọi ngay khi load trang
loadBangMaHoaTuSheet();

// ✅ Tự động reload bảng khi đổi link
pubLinkInput.addEventListener("change", loadBangMaHoaTuSheet);

// ✅ Nút Lưu
saveBtn.addEventListener("click", () => {
  const bangMaHoa = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    const cells = tr.querySelectorAll("td");
    bangMaHoa.push([
      cells[1].innerText,
      cells[2].querySelector("input").checked,
      cells[3].querySelector("input").checked
    ]);
  });

  hoSoData[khungId] = {
    tenHoSo: profileNameInput.value,
    moTa: profileDescInput.value,
    editLink: editLinkInput.value,
    pubLink: pubLinkInput.value,
    bangMaHoa
  };

  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
  alert("✅ Hồ sơ đã lưu thành công!");
});

// ✅ Quay lại
backBtn.addEventListener("click", () => history.back());

// ✅ Mở link Google Sheet
document.querySelectorAll(".open-link").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    const url = document.getElementById(target).value;
    if (url) window.open(url, "_blank");
  });
});
