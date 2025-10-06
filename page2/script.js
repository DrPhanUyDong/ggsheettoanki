// Lấy ID khung từ URL
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

// Load dữ liệu hồ sơ vào form
document.getElementById("profileTitle").innerText = hoSoData[khungId].tenHoSo;
document.getElementById("profileName").value = hoSoData[khungId].tenHoSo;
document.getElementById("profileDesc").value = hoSoData[khungId].moTa;
document.getElementById("editLink").value = hoSoData[khungId].editLink;
document.getElementById("pubLink").value = hoSoData[khungId].pubLink;

// Load bảng mã hoá
const loadBangMaHoa = () => {
  const tbody = document.querySelector("#columnTable tbody");
  tbody.innerHTML = "";
  const data = hoSoData[khungId].bangMaHoa.length ? hoSoData[khungId].bangMaHoa : [
    ["Câu hỏi", false, false],
    ["A", false, false],
    ["B", false, false],
    ["C", false, false],
    ["D", false, false],
    ["Đáp án", false, false],
    ["Giải thích", false, false],
    ["Bài học", false, false]
  ];

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row[0]}</td>
      <td><input type="checkbox" ${row[1] ? "checked" : ""}></td>
      <td><input type="checkbox" ${row[2] ? "checked" : ""}></td>
    `;
    tbody.appendChild(tr);
  });
};
loadBangMaHoa();

// Nút lưu
document.getElementById("saveBtn").addEventListener("click", () => {
  const tbody = document.querySelector("#columnTable tbody");
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
    tenHoSo: document.getElementById("profileName").value,
    moTa: document.getElementById("profileDesc").value,
    editLink: document.getElementById("editLink").value,
    pubLink: document.getElementById("pubLink").value,
    bangMaHoa: bangMaHoa
  };
  localStorage.setItem("hoSoData", JSON.stringify(hoSoData));
  document.getElementById("profileTitle").innerText = hoSoData[khungId].tenHoSo;
  alert("Đã lưu hồ sơ!");
});

// Nút quay lại
document.getElementById("backBtn").addEventListener("click", () => {
  window.history.back();
});
