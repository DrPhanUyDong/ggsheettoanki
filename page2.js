// Lấy ID khung từ URL (mặc định 'default')
const params = new URLSearchParams(window.location.search);
const khungId = params.get("id") || "default";

// Đọc dữ liệu hồ sơ từ localStorage
let hoSoData = JSON.parse(localStorage.getItem("hoSoData")) || {};

// Nếu chưa có hồ sơ cho khung này → tạo mặc định
if (!hoSoData[khungId]) {
  hoSoData[khungId] = {
    tenHoSo: "Hồ sơ mặc định by Đông",
    moTa: "Anki được tạo bởi Đông.",
    editLink: "https://docs.google.com/spreadsheets/d/1MzPEpRX3_LnchJBJ2bpwjYVw6LRLe-lVnG8LSmg9wng/edit?gid=0#gid=0",
    pubLink: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTc9RnKiuNXGcuD8iDbZqAmSFfd9dugerzV-feUkp8gfJbRhxhjdZu7kjkLoVU42v2ok76wneDM0Fyh/pubhtml",
    bangMaHoa: [] // Lưu dữ liệu bảng mã hoá
  };
  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
}

// Tham chiếu DOM
const profileTitle = document.getElementById("profileTitle");
const profileNameInput = document.getElementById("profileName");
const profileDescInput = document.getElementById("profileDesc");
const editLinkInput = document.getElementById("editLink");
const pubLinkInput = document.getElementById("pubLink");
const saveBtn = document.getElementById("saveBtn");
const backBtn = document.getElementById("backBtn");
const tbody = document.querySelector("#columnTable tbody");

// Load dữ liệu hồ sơ vào form
profileTitle.innerText = hoSoData[khungId].tenHoSo;
profileNameInput.value = hoSoData[khungId].tenHoSo;
profileDescInput.value = hoSoData[khungId].moTa;
editLinkInput.value = hoSoData[khungId].editLink;
pubLinkInput.value = hoSoData[khungId].pubLink;

// Cập nhật tiêu đề khi gõ vào input Tên hồ sơ
profileNameInput.addEventListener("input", () => {
  profileTitle.innerText = profileNameInput.value || "Hồ sơ mặc định by Đông";
});

// Hàm fetch dữ liệu từ Google Sheet public và render bảng mã hoá
async function loadBangMaHoaTuSheet() {
  const pubUrl = pubLinkInput.value;
  tbody.innerHTML = "<tr><td colspan='4'>Đang tải dữ liệu từ Google Sheet...</td></tr>";

  try {
    const res = await fetch(pubUrl);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const table = doc.querySelector("table");

    if (!table) {
      tbody.innerHTML = "<tr><td colspan='4'>Không tìm thấy bảng trên Sheet</td></tr>";
      return;
    }

    // Lấy dòng đầu tiên làm tên cột
    const firstRow = table.querySelector("tr");
    if (!firstRow) return;
    const cols = Array.from(firstRow.querySelectorAll("td")).map(td => td.innerText.trim());

    // Render vào bảng mã hoá
    tbody.innerHTML = "";
    cols.forEach((colName, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${colName}</td>
        <td><input type="checkbox" ${hoSoData[khungId].bangMaHoa[index]?.[1] ? "checked" : ""}></td>
        <td><input type="checkbox" ${hoSoData[khungId].bangMaHoa[index]?.[2] ? "checked" : ""}></td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Lỗi load Sheet:", err);
    tbody.innerHTML = "<tr><td colspan='4'>Lỗi tải dữ liệu</td></tr>";
  }
}

// Gọi khi load trang
loadBangMaHoaTuSheet();

// Nút lưu
saveBtn.addEventListener("click", () => {
  const bangMaHoa = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    const cells = tr.querySelectorAll("td");
    bangMaHoa.push([
      cells[1].innerText,                  // tên cột
      cells[2].querySelector("input").checked,
      cells[3].querySelector("input").checked
    ]);
  });

  hoSoData[khungId] = {
    tenHoSo: profileNameInput.value,
    moTa: profileDescInput.value,
    editLink: editLinkInput.value,
    pubLink: pubLinkInput.value,
    bangMaHoa: bangMaHoa
  };
  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
  profileTitle.innerText = profileNameInput.value || "Hồ sơ mặc định by Đông";
  alert("✅ Đã lưu hồ sơ và bảng mã hoá!");
});

// Nút quay lại
backBtn.addEventListener("click", () => {
  window.history.back();
});

// Nút mở link
document.querySelectorAll(".open-link").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    const url = document.getElementById(target).value;
    if (url) window.open(url, "_blank");
  });
});
