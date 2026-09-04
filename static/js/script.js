// Angkringan Lor Dalan - Data Warung
// Alamat: Sambi Gedong, Tawengan, Sambi, Boyolali
const DAFTAR_MENU = [
    { id: 'naskuc', nama: 'Nasi Kucing', harga: 5000, kategori: 'Nasi', gambar: 'static/images/nasi-kucing.jpg', deskripsi: 'Nasi porsi kucing sambal teri pedas' },
    { id: 'nasbak', nama: 'Nasi Bakar Ayam', harga: 15000, kategori: 'Nasi', gambar: 'static/images/nasi-bakar.jpg', deskripsi: 'Nasi bakar daun pisang isi ayam suwir' },
    { id: 'nasGor', nama: 'Nasi Goreng Jawa', harga: 14000, kategori: 'Nasi', gambar: 'static/images/nasi-goreng.jpg', deskripsi: 'Nasi goreng jawa + telur + kerupuk' },
    { id: 'sate_usus', nama: 'Sate Usus', harga: 3500, kategori: 'Sate', gambar: 'static/images/sate-usus.jpg', deskripsi: 'Sate usus ayam bumbu kecap' },
    { id: 'sate_telur', nama: 'Sate Telur Puyuh', harga: 4000, kategori: 'Sate', gambar: 'static/images/sate-telur.jpg', deskripsi: 'Sate telur puyuh bacem manis' },
    { id: 'sate_ayam', nama: 'Sate Ayam', harga: 5000, kategori: 'Sate', gambar: 'static/images/sate-ayam.jpg', deskripsi: 'Sate ayam bumbu kacang pedas' },
    { id: 'sate_ati', nama: 'Sate Ati Ampela', harga: 4500, kategori: 'Sate', gambar: 'static/images/sate-ati.jpg', deskripsi: 'Sate ati ampela bumbu kuning' },
    { id: 'gor_tahu', nama: 'Tahu Bacem', harga: 2000, kategori: 'Gorengan', gambar: 'static/images/tahu-bacem.jpg', deskripsi: 'Tahu bacem manis gurih' },
    { id: 'gor_tempe', nama: 'Tempe Mendoan', harga: 2000, kategori: 'Gorengan', gambar: 'static/images/tempe-mendoan.jpg', deskripsi: 'Tempe mendoan anget' },
    { id: 'gor_bakwan', nama: 'Bakwan Goreng', harga: 2000, kategori: 'Gorengan', gambar: 'static/images/bakwan.jpg', deskripsi: 'Bakwan sayur renyah' },
    { id: 'sosis', nama: 'Sosis Bakar', harga: 6000, kategori: 'Bakaran', gambar: 'static/images/sosis-bakar.jpg', deskripsi: 'Sosis bakar pedas manis' },
    { id: 'kopi_joss', nama: 'Kopi Joss Arang', harga: 8000, kategori: 'Minuman', gambar: 'static/images/kopi-joss.jpg', deskripsi: 'Kopi khas Jogja + arang membara' },
    { id: 'wedang_jahe', nama: 'Wedang Jahe Susu', harga: 8000, kategori: 'Minuman', gambar: 'static/images/wedang-jahe.jpg', deskripsi: 'Wedang jahe susu hangat' },
    { id: 'teh', nama: 'Teh Hangat / Es Teh', harga: 5000, kategori: 'Minuman', gambar: 'static/images/teh.jpg', deskripsi: 'Teh tubruk / es teh manis' },
    { id: 'es_jeruk', nama: 'Es Jeruk Peras', harga: 7000, kategori: 'Minuman', gambar: 'static/images/es-jeruk.jpg', deskripsi: 'Es jeruk peras segar' },
    { id: 'indomie', nama: 'Indomie Goreng/Telor', harga: 13000, kategori: 'Mie', gambar: 'static/images/indomie.jpg', deskripsi: 'Indomie goreng + telur' },
];

// === FASTAPI + SQLite INTEGRATION + RBAC ===
const API_BASE = (location.port === "8000" ? "/api" : "http://127.0.0.1:8000/api");
let API_AVAILABLE = false;
async function apiFetch(path, opts = {}) {
    try {
        const token = sessionStorage.getItem("ald_token") || localStorage.getItem("ald_token");
        const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
        if (token && token !== "local-fallback-token") headers["Authorization"] = "Bearer " + token;
        const res = await fetch(API_BASE + path, { ...opts, headers });
        if (res.status === 401){
            // Pelanggan tanpa login coba akses endpoint kasir/admin -> jangan anggap offline, tapi info
            console.warn("401 Unauthorized for", path, "- butuh login kasir/admin/superadmin");
            // Jika path public seperti /menu/ yang sekarang public, tidak akan 401
            // Untuk endpoint protected, return null tapi beri hint
            if(path.includes("/menu/") && opts.method==="GET") return null;
            // Jika 401 saat pelanggan mode, jangan redirect paksa
            const role = sessionStorage.getItem("ald_role") || "pelanggan";
            if(role !== "pelanggan"){
                console.warn("Token expired, redirect login?");
                // optional: hapus token jika kasir/admin token expired
                // sessionStorage.removeItem("ald_token"); localStorage.removeItem("ald_token");
            }
            throw new Error("Unauthorized 401 - butuh login " + role);
        }
        if (res.status === 403){
            console.warn("403 Forbidden for", path, "- role tidak cukup");
            const j = await res.json().catch(()=>({detail: res.statusText}));
            alert("Akses ditolak (403): " + (j.detail || "Hanya role tertentu"));
            throw new Error(j.detail || "Forbidden");
        }
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await res.json();
        return await res.text();
    } catch (e) {
        if(e.message && (e.message.includes("401") || e.message.includes("403"))) {
            // jangan fallback diam-diam untuk auth error
            console.warn("apiFetch auth error:", path, e.message);
            return null;
        }
        // console.warn("API unavailable:", path, e.message);
        return null;
    }
}
async function checkApi() {
    const h = await apiFetch("/health");
    API_AVAILABLE = !!h && h.status === "ok";
    if (API_AVAILABLE) console.log("✅ FastAPI connected:", API_BASE);
    else console.log("⚠️ FastAPI offline, fallback ke LocalStorage");
    return API_AVAILABLE;
}
async function loadMenuFromApi() {
    const menu = await apiFetch("/menu/");
    if (menu && Array.isArray(menu) && menu.length > 0) {
        DAFTAR_MENU.length = 0;
        menu.forEach(m => DAFTAR_MENU.push(m));
        console.log("✅ Menu loaded dari API:", DAFTAR_MENU.length);
        return true;
    }
    return false;
}
async function loadPesananFromApi(filter = "") {
    let path = "/pesanan/";
    if (filter) path += `?q=${encodeURIComponent(filter)}`;
    const data = await apiFetch(path);
    if (data && Array.isArray(data)) {
        // mapping API field to frontend compat: jml_orang -> jmlOrang, totalFormatted sudah ada
        dataPesanan = data.map(d => ({
            nota: d.nota,
            nama: d.nama,
            meja: d.meja,
            wa: d.wa,
            jmlOrang: d.jml_orang || d.jmlOrang,
            items: d.items,
            total: d.total,
            totalFormatted: d.totalFormatted || formatRupiah(d.total),
            pembayaran: d.pembayaran,
            status: d.status,
            tanggal: d.tanggal,
            jam: d.jam,
            catatan: d.catatan,
            waktuSimpan: d.waktu_simpan || d.waktuSimpan,
            isAuto: false
        }));
        return true;
    }
    return false;
}

let keranjang = {}; // {id: qty}
let dataPesanan = JSON.parse(localStorage.getItem("angkringan_lor_dalan") || localStorage.getItem("service_hp_data") || "[]");

if (dataPesanan.length > 0 && dataPesanan[0].merek !== undefined) {
    localStorage.setItem("backup_service_hp", JSON.stringify(dataPesanan));
    dataPesanan = JSON.parse(localStorage.getItem("angkringan_lor_dalan") || "[]");
}

document.addEventListener("DOMContentLoaded", async () => {
    const tgl = document.getElementById("tanggal");
    if (tgl) tgl.valueAsDate = new Date();
    const jam = document.getElementById("jamPesan");
    if (jam) {
        const now = new Date();
        jam.value = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
    }
    // Coba konek FastAPI, jika ada load data dari API (SQLite)
    await checkApi();
    if (API_AVAILABLE) {
        await loadMenuFromApi();
        await loadPesananFromApi();
    }
    renderMenuMakananMinuman();
    updateKeranjang();
    updateNota();
    renderTable();
    renderPembayaran();
    updateStat();
    startJamLive();
    updateBadgeMenu();

    // Sinkron otomatis jika form pelanggan diubah setelah ada keranjang
    ["nama","meja","wa","jmlOrang","pembayaran","tanggal","jamPesan","catatan","status"].forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.addEventListener("change", ()=>{ if(Object.keys(keranjang).length>0) syncKeranjangLangsung(); });
            if(id==="nama" || id==="catatan" || id==="wa"){
                el.addEventListener("input", ()=>{ if(Object.keys(keranjang).length>0) syncKeranjangLangsung(); });
            }
        }
    });
});

function startJamLive(){
    const el = document.getElementById("jamLive");
    if(!el) return;
    function tick(){
        const now = new Date();
        el.textContent = now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) + " WIB";
    }
    tick();
    setInterval(tick, 60000);
}

function showToast(msg, type="info"){
    const c = document.getElementById("toastContainer");
    if(!c) return alert(msg);
    const el = document.createElement("div");
    el.className = "toast " + type;
    const icon = type==="success" ? "✅" : type==="error" ? "❌" : "💡";
    el.innerHTML = `<span style="font-size:16px;">${icon}</span><span style="flex:1;">${msg}</span>`;
    c.appendChild(el);
    setTimeout(()=> el.remove(), 3200);
}
let activeChip = "";
function setChip(btn, val){
    document.querySelectorAll(".chip").forEach(b=> b.classList.remove("active"));
    btn.classList.add("active");
    activeChip = val;
    filterMenu();
}
function filterMenu(){
    const q = (document.getElementById("searchMenu")?.value || "").toLowerCase();
    const cards = document.querySelectorAll(".menu-item");
    cards.forEach(card=>{
        const nama = card.querySelector(".menu-info strong")?.textContent.toLowerCase() || "";
        const kat = card.querySelector(".menu-info small")?.textContent.toLowerCase() || "";
        const matchQ = !q || nama.includes(q) || kat.includes(q);
        const matchChip = !activeChip || kat.includes(activeChip.toLowerCase());
        card.style.display = (matchQ && matchChip) ? "" : "none";
        // highlight
        if(q && matchQ){
            const strong = card.querySelector(".menu-info strong");
            if(strong && !strong.dataset.orig) strong.dataset.orig = strong.textContent;
            const orig = strong.dataset.orig;
            const idx = orig.toLowerCase().indexOf(q);
            if(idx>=0) strong.innerHTML = orig.slice(0,idx) + `<mark class="hl">${orig.slice(idx, idx+q.length)}</mark>` + orig.slice(idx+q.length);
        } else {
            const strong = card.querySelector(".menu-info strong");
            if(strong && strong.dataset.orig) strong.textContent = strong.dataset.orig;
        }
    });
}

function formatRupiah(num){
    return "Rp " + Number(num).toLocaleString("id-ID");
}

function generateNota() {
    const count = dataPesanan.length + 1;
    return "ANG-" + String(count).padStart(4, "0");
}

function updateNota() {
    const el = document.getElementById("noNota");
    if (el) el.textContent = "No: " + generateNota();
}

function setActive(el){
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    el.classList.add('active');
}

function updateBadgeMenu(){
    const makananCount = DAFTAR_MENU.filter(m=>m.kategori !== 'Minuman').length;
    const minumanCount = DAFTAR_MENU.filter(m=>m.kategori === 'Minuman').length;
    const bM = document.getElementById("badgeMakanan");
    const bMi = document.getElementById("badgeMinuman");
    if(bM) bM.textContent = makananCount + " Menu";
    if(bMi) bMi.textContent = minumanCount + " Menu";
}

// Render Daftar Makanan & Minuman terpisah tanpa icon
function renderMenuMakananMinuman(){
    const gridMakanan = document.getElementById("menuMakanan");
    const gridMinuman = document.getElementById("menuMinuman");
    if(!gridMakanan || !gridMinuman) return;

    const makanan = DAFTAR_MENU.filter(m => m.kategori !== 'Minuman');
    const minuman = DAFTAR_MENU.filter(m => m.kategori === 'Minuman');

    function itemHtml(item){
        const qty = keranjang[item.id] || 0;
        const sold = item.is_sold === true;
        return `
        <div class="menu-item ${qty>0?'selected':''} ${sold?'sold':''}" onclick="${sold ? '' : `tambahMenu('${item.id}')`}" style="${sold?'opacity:0.6; filter:grayscale(0.5); position:relative;':''}">
            ${sold ? '<span style="position:absolute; top:8px; right:8px; background:#dc2626; color:white; padding:3px 8px; border-radius:8px; font-size:10px; font-weight:800; z-index:2;">HABIS / SOLD</span>' : ''}
            <img src="${item.gambar}" alt="${item.nama}" class="menu-thumb" loading="lazy" onerror="this.onerror=null; this.src=this.src.replace('.jpg','.svg'); if(!this.src.includes('.svg')) this.src='static/assets/AGK.jpg'" style="${sold?'filter:grayscale(1);':''}">
            <div class="menu-info">
                <strong>${item.nama} ${sold?'<span style="color:#dc2626; font-size:10px; border:1px solid #fecaca; background:#fee2e2; padding:1px 5px; border-radius:6px;">SOLD</span>':''}</strong>
                <small>${item.kategori} - ${formatRupiah(item.harga)}</small>
                ${item.deskripsi ? `<small style="color:#a8a29e; display:block; font-size:10.5px; line-height:1.2;">${item.deskripsi}</small>` : ''}
            </div>
            <div class="menu-action" onclick="event.stopPropagation()">
                ${sold ? '<span style="color:#dc2626; font-size:11px; font-weight:800; padding:6px 10px; border:1px solid #fecaca; background:#fee2e2; border-radius:20px;">Habis</span>' : (qty>0 ? `<button class="btn-qty" onclick="kurangMenu('${item.id}')">-</button><span class="qty-badge">${qty}</span>` : '') + `<button class="btn-qty add" onclick="tambahMenu('${item.id}')" title="Tambah">+</button>`}
            </div>
        </div>
        `;
    }

    gridMakanan.innerHTML = makanan.map(itemHtml).join("");
    gridMinuman.innerHTML = minuman.map(itemHtml).join("");
}

function tambahMenu(id){
    const item = DAFTAR_MENU.find(m=> m.id===id);
    if(item && item.is_sold){
        showToast("Maaf, " + item.nama + " sedang HABIS (SOLD). Pilih menu lain, Lur!", "error");
        return;
    }
    keranjang[id] = (keranjang[id] || 0) + 1;
    renderMenuMakananMinuman();
    updateKeranjang();
    syncKeranjangLangsung();
    showToast(item.nama + " +1 ditambahkan", "success");
    // haptic
    if(navigator.vibrate) navigator.vibrate(20);
}

function kurangMenu(id){
    if(!keranjang[id]) return;
    keranjang[id]--;
    if(keranjang[id]<=0) delete keranjang[id];
    renderMenuMakananMinuman();
    updateKeranjang();
    syncKeranjangLangsung();
}

function hapusMenuKeranjang(id){
    delete keranjang[id];
    renderMenuMakananMinuman();
    updateKeranjang();
    syncKeranjangLangsung();
}

function updateKeranjang(){
    const wrap = document.getElementById("keranjang");
    const totalEl = document.getElementById("totalBayar");
    const jmlEl = document.getElementById("jumlahItem");
    const ids = Object.keys(keranjang);
    let total = 0;
    let totalItem = 0;
    ids.forEach(id => {
        const menu = DAFTAR_MENU.find(m=>m.id===id);
        total += menu.harga * keranjang[id];
        totalItem += keranjang[id];
    });
    if(jmlEl) jmlEl.textContent = totalItem + " item";
    if(totalEl) totalEl.textContent = formatRupiah(total);

    // FAB
    const fab = document.getElementById("cartFab");
    const fabBadge = document.getElementById("fabBadge");
    const fabTotal = document.getElementById("fabTotal");
    if(fab){
        if(totalItem>0){ fab.classList.add("show"); if(fabBadge) fabBadge.textContent=totalItem; if(fabTotal) fabTotal.textContent=formatRupiah(total); }
        else fab.classList.remove("show");
    }
    if(ids.length===0){
        wrap.innerHTML = `<p class="keranjang-empty" style="text-align:center; padding:20px;"><span style="font-size:32px; display:block; margin-bottom:8px;">🍽️</span>Belum ada menu dipilih.<br><small>Klik + pada menu, ada animasi & toast!</small></p>`;
        return;
    }
    wrap.innerHTML = ids.map(id=>{
        const menu = DAFTAR_MENU.find(m=>m.id===id);
        const qty = keranjang[id];
        const sub = menu.harga * qty;
        return `
        <div class="keranjang-item">
            <img src="${menu.gambar}" alt="${menu.nama}" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:1.5px solid #fde68a; background:white; flex-shrink:0;" onerror="this.onerror=null; this.src=this.src.replace('.jpg','.svg'); if(!this.src.includes('.svg')) this.src='static/assets/AGK.jpg'">
            <div class="keranjang-item-info">
                <strong>${menu.nama}</strong>
                <small>${formatRupiah(menu.harga)} x ${qty}</small>
            </div>
            <div class="keranjang-item-price">${formatRupiah(sub)}</div>
            <div class="keranjang-item-actions">
                <button class="btn-qty" onclick="kurangMenu('${id}')">-</button>
                <span class="qty-badge">${qty}</span>
                <button class="btn-qty add" onclick="tambahMenu('${id}')">+</button>
                <button class="btn-icon" onclick="hapusMenuKeranjang('${id}')" style="color:#dc2626; margin-left:4px;" title="Hapus">Hapus</button>
            </div>
        </div>
        `;
    }).join("");
}

function getKeranjangDetail(){
    const ids = Object.keys(keranjang);
    if(ids.length===0) return null;
    let items = [];
    let total = 0;
    ids.forEach(id=>{
        const menu = DAFTAR_MENU.find(m=>m.id===id);
        const qty = keranjang[id];
        const sub = menu.harga * qty;
        total += sub;
        items.push({ id, nama: menu.nama, harga: menu.harga, qty, subtotal: sub, kategori: menu.kategori, gambar: menu.gambar });
    });
    return { items, total };
}

// Sinkron keranjang langsung ke Daftar Pesanan tanpa perlu klik Simpan
function syncKeranjangLangsung(){
    const detail = getKeranjangDetail();
    const draftIdx = dataPesanan.findIndex(d => d.isAuto);
    const cariVal = document.getElementById("cari") ? document.getElementById("cari").value : "";

    if(!detail){
        // keranjang kosong -> hapus draft auto jika ada
        if(draftIdx !== -1){
            dataPesanan.splice(draftIdx, 1);
            localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
            renderTable(cariVal);
            renderPembayaran();
            updateStat();
            updateNota();
        }
        return;
    }

    const namaVal = document.getElementById("nama").value.trim() || "Pelanggan Umum";
    const mejaVal = document.getElementById("meja").value || "Meja 01";
    const waVal = document.getElementById("wa").value.trim() || "-";
    const jmlOrangVal = document.getElementById("jmlOrang").value;
    const pembayaranVal = document.getElementById("pembayaran").value;
    const statusVal = document.getElementById("status").value || "Antri";
    const tanggalVal = document.getElementById("tanggal").value || new Date().toISOString().split("T")[0];
    const jamVal = document.getElementById("jamPesan").value || new Date().toTimeString().slice(0,5);
    const catatanVal = document.getElementById("catatan").value.trim() || "-";

    if(draftIdx !== -1){
        const d = dataPesanan[draftIdx];
        d.nama = namaVal;
        d.meja = mejaVal;
        d.wa = waVal;
        d.jmlOrang = jmlOrangVal;
        d.items = detail.items;
        d.total = detail.total;
        d.totalFormatted = formatRupiah(detail.total);
        d.pembayaran = pembayaranVal;
        d.status = statusVal;
        d.tanggal = tanggalVal;
        d.jam = jamVal;
        d.catatan = catatanVal;
    } else {
        const nota = generateNota();
        const newDraft = {
            nota, nama: namaVal, meja: mejaVal, wa: waVal, jmlOrang: jmlOrangVal,
            items: detail.items,
            total: detail.total,
            totalFormatted: formatRupiah(detail.total),
            pembayaran: pembayaranVal,
            status: statusVal,
            tanggal: tanggalVal,
            jam: jamVal,
            catatan: catatanVal,
            isAuto: true,
            waktuSimpan: new Date().toISOString()
        };
        dataPesanan.unshift(newDraft);
    }

    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    renderTable(cariVal);
    renderPembayaran();
    updateStat();
    updateNota();

    // beri highlight sekejap di baris draft
    setTimeout(()=>{
        const tbody = document.getElementById("tbodyPesanan");
        if(tbody && tbody.firstElementChild && dataPesanan[0] && dataPesanan[0].isAuto){
            tbody.firstElementChild.style.background = "#fffbeb";
            tbody.firstElementChild.style.outline = "2px solid #f59e0b";
            setTimeout(()=>{ tbody.firstElementChild.style.background=""; tbody.firstElementChild.style.outline=""; }, 800);
        }
    }, 50);
}

async function simpanPesanan() {
    const nama = document.getElementById("nama").value.trim();
    const meja = document.getElementById("meja").value;
    const wa = document.getElementById("wa").value.trim();
    const jmlOrang = document.getElementById("jmlOrang").value;
    const pembayaran = document.getElementById("pembayaran").value;
    const status = document.getElementById("status").value;
    const tanggal = document.getElementById("tanggal").value;
    const jamPesan = document.getElementById("jamPesan").value;
    const catatan = document.getElementById("catatan").value.trim();

    const keranjangData = getKeranjangDetail();

    if (!nama || !meja) {
        showToast("Mohon lengkapi: Nama Pelanggan dan No. Meja / Bungkus!", "error");
        if (!nama) document.getElementById("nama").focus();
        else document.getElementById("meja").focus();
        document.getElementById("nama")?.classList.add("shake");
        setTimeout(()=> document.getElementById("nama")?.classList.remove("shake"), 600);
        return;
    }
    if (!keranjangData) {
        showToast("Pilih minimal 1 menu dulu, Lur! Klik + pada menu di atas.", "info");
        return;
    }

    // === Jika API tersedia, simpan ke SQLite via FastAPI ===
    if (API_AVAILABLE) {
        const payload = {
            nama, meja, wa: wa || "-", jml_orang: jmlOrang,
            pembayaran, status,
            tanggal: tanggal || new Date().toISOString().split("T")[0],
            jam: jamPesan || new Date().toTimeString().slice(0,5),
            catatan: catatan || "-",
            items: keranjangData.items.map(it => ({ menu_id: it.id, qty: it.qty }))
        };
        const result = await apiFetch("/pesanan/", { method: "POST", body: JSON.stringify(payload) });
        if (result && result.nota) {
            // Hapus draft lokal jika ada
            const dIdx = dataPesanan.findIndex(d => d.isAuto);
            if (dIdx !== -1) dataPesanan.splice(dIdx, 1);
            await loadPesananFromApi(document.getElementById("cari")?.value || "");
            // mapping result untuk nota
            const notaData = {
                nota: result.nota, nama: result.nama, meja: result.meja, wa: result.wa,
                jmlOrang: result.jml_orang || result.jmlOrang, items: result.items,
                total: result.total, totalFormatted: result.totalFormatted || formatRupiah(result.total),
                pembayaran: result.pembayaran, status: result.status,
                tanggal: result.tanggal, jam: result.jam, catatan: result.catatan
            };
            tampilNota(notaData, true);
            keranjang = {};
            renderMenuMakananMinuman();
            updateKeranjang();
            renderTable(document.getElementById("cari")?.value || "");
            renderPembayaran();
            updateStat();
            updateNota();
            document.getElementById("hasil").scrollIntoView({behavior:"smooth"});
            return;
        } else {
            showToast("Gagal simpan ke Server, fallback ke LocalStorage.", "error");
        }
    }

    const draftIdx = dataPesanan.findIndex(d => d.isAuto);
    // Jika sudah ada draft auto, finalisasi draft tersebut (tidak buat baru) agar tidak duplikat
    if(draftIdx !== -1){
        const d = dataPesanan[draftIdx];
        d.nama = nama;
        d.meja = meja;
        d.wa = wa || "-";
        d.jmlOrang = jmlOrang;
        d.items = keranjangData.items;
        d.total = keranjangData.total;
        d.totalFormatted = formatRupiah(keranjangData.total);
        d.pembayaran = pembayaran;
        d.status = status;
        d.tanggal = tanggal || new Date().toISOString().split("T")[0];
        d.jam = jamPesan || new Date().toTimeString().slice(0,5);
        d.catatan = catatan || "-";
        delete d.isAuto;
        localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
        tampilNota(d, true);
        // reset keranjang untuk pesanan berikutnya
        keranjang = {};
        renderMenuMakananMinuman();
        updateKeranjang();
        renderTable();
        renderPembayaran();
        updateStat();
        updateNota();
        document.getElementById("hasil").scrollIntoView({behavior:"smooth"});
        return;
    }

    const nota = generateNota();
    const item = {
        nota, nama, meja, wa: wa || "-", jmlOrang,
        items: keranjangData.items,
        total: keranjangData.total,
        totalFormatted: formatRupiah(keranjangData.total),
        pembayaran, status,
        tanggal: tanggal || new Date().toISOString().split("T")[0],
        jam: jamPesan || new Date().toTimeString().slice(0,5),
        catatan: catatan || "-",
        waktuSimpan: new Date().toISOString()
    };

    dataPesanan.unshift(item);
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));

    tampilNota(item, true);

    // reset keranjang setelah simpan manual
    keranjang = {};
    renderMenuMakananMinuman();
    updateKeranjang();

    renderTable();
    renderPembayaran();
    updateStat();
    updateNota();
}

function tampilNota(d, isNew=false){
    const hasil = document.getElementById("hasil");
    hasil.classList.remove("hidden");
    const itemsHtml = d.items.map(it=>`
        <div class="nota-item-row" style="align-items:center; gap:10px;">
            <img src="${it.gambar || DAFTAR_MENU.find(m=>m.id===it.id)?.gambar || 'static/assets/AGK.jpg'}" alt="${it.nama}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; border:1px solid #fde68a; flex-shrink:0; background:white;" onerror="this.onerror=null; this.src=this.src.replace('.jpg','.svg'); if(!this.src.includes('.svg')) this.src='static/assets/AGK.jpg'">
            <span style="flex:1;">${it.nama} <small style="color:#78716c;">x${it.qty}</small><br><small style="color:#a8a29e;">${formatRupiah(it.harga)} / pcs</small></span>
            <span style="font-weight:800; color:#92400e;">${formatRupiah(it.subtotal)}</span>
        </div>
    `).join("");
    hasil.innerHTML = `
        <h4 style="display:flex;align-items:center;gap:10px;"><img src="static/assets/AGK.jpg" alt="Logo" style="width:32px;height:32px;border-radius:8px;object-fit:cover;border:1px solid #fde68a;flex-shrink:0;"> Struk - ${d.nota} <span style="margin-left:auto;font-size:11px;background:${statusColor(d.status)};color:white;padding:4px 10px;border-radius:20px;">${d.status}${d.isAuto ? ' - Draft' : ''}</span></h4>
        <div class="nota-grid">
            <div><strong>Pelanggan</strong>${d.nama} <br><small>${d.meja} - ${d.jmlOrang}</small> ${d.wa!=="-"?`<br><small>WA: ${d.wa}</small>`:""}</div>
            <div><strong>Waktu Pesan</strong>${formatTanggal(d.tanggal)} - ${d.jam} WIB<br><small>${d.pembayaran}</small></div>
        </div>
        <div class="nota-items">
            <h5>Rincian Pesanan (${d.items.length} menu, ${d.items.reduce((a,b)=>a+b.qty,0)} item)</h5>
            ${itemsHtml}
            <div class="nota-total">
                <span>Total Bayar</span>
                <span style="color:#92400e; font-size:16px;">${d.totalFormatted}</span>
            </div>
            ${d.catatan!=="-"?`<p style="margin-top:10px; font-size:12px; background:#fffbeb; padding:8px 10px; border-radius:8px; border:1px dashed #fde68a;"><strong>Catatan:</strong> ${d.catatan}</p>`:""}
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;">
            <button class="btn btn-print" style="flex:1;padding:11px;" onclick="window.print()">Cetak Struk</button>
            <button class="btn btn-secondary" style="flex:1;padding:11px;" onclick="document.getElementById('hasil').classList.add('hidden')">Tutup</button>
        </div>
        <p style="margin-top:12px;font-size:11px;color:#78716c;text-align:center; line-height:1.5;">
            ${isNew ? 'Pesanan berhasil disimpan! Matur nuwun, Lur.<br>' : ''}
            Simpan struk ini untuk pembayaran di kasir - Harga sudah termasuk kerupuk gratis<br>
            <strong>Angkringan Lor Dalan - Sambi Gedong, Tawengan, Sambi, Boyolali - 0812-3456-7890</strong>
        </p>
    `;
    hasil.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatTanggal(str) {
    if (!str || str === "-") return "-";
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function statusColor(s){
    s = s.toLowerCase();
    if(s.includes("antri")) return "#d97706";
    if(s.includes("proses")) return "#ea580c";
    if(s.includes("siap")) return "#16a34a";
    if(s.includes("selesai") || s.includes("lunas")) return "#451a03";
    return "#92400e";
}
function statusClass(s) {
    s = s.toLowerCase();
    if (s.includes("antri")) return "status-antri";
    if (s.includes("proses")) return "status-proses";
    if (s.includes("siap")) return "status-siap";
    if (s.includes("selesai") || s.includes("lunas")) return "status-selesai";
    return "status-antri";
}

function renderTable(filter = "") {
    const tbody = document.getElementById("tbodyPesanan");
    let data = dataPesanan;

    if (filter) {
        const q = filter.toLowerCase();
        data = data.filter(d =>
            d.nama.toLowerCase().includes(q) ||
            d.meja.toLowerCase().includes(q) ||
            d.nota.toLowerCase().includes(q) ||
            d.items.some(it=>it.nama.toLowerCase().includes(q))
        );
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">${filter ? "Tidak ada hasil untuk '" + filter + "'" : "Belum ada pesanan. Klik + pada Daftar Makanan / Minuman, otomatis masuk ke sini!"}</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((d) => {
        const realIndex = dataPesanan.indexOf(d);
        const ringkasan = d.items.map(it=> `${it.nama} x${it.qty}`).join(", ");
        const jmlItem = d.items.reduce((a,b)=>a+b.qty,0);
        const isDraft = d.isAuto ? ' <span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:800;">BARU</span>' : '';
        const thumbHtml = d.items.slice(0,4).map(it=>{
            const src = it.gambar || (DAFTAR_MENU.find(m=>m.id===it.id)?.gambar) || 'static/assets/AGK.jpg';
            return `<img src="${src}" alt="${it.nama}" title="${it.nama} x${it.qty}" style="width:28px; height:28px; border-radius:6px; object-fit:cover; border:1px solid #fde68a; background:white; margin-right:4px;" onerror="this.onerror=null; this.src=this.src.replace('.jpg','.svg'); if(!this.src.includes('.svg')) this.src='static/assets/AGK.jpg'">`;
        }).join("") + (d.items.length>4 ? `<span style="font-size:10px; color:#a8a29e; margin-left:4px;">+${d.items.length-4}</span>` : '');
        return `
        <tr style="${d.isAuto ? 'background:#fffbeb; border-left:4px solid #f59e0b;' : ''}">
            <td><strong style="color:#92400e;">${d.nota}</strong>${isDraft}</td>
            <td>${formatTanggal(d.tanggal)}<br><small style="color:#78716c;">${d.jam}</small></td>
            <td><strong>${d.nama}</strong><br><small style="color:#78716c;">${d.meja} - ${d.jmlOrang}</small></td>
            <td style="max-width:300px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:2px; margin-bottom:4px;">${thumbHtml}</div>
                <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${ringkasan}"><strong>${ringkasan}</strong></div>
                <small style="color:#78716c;">${jmlItem} item - ${d.pembayaran}</small>
            </td>
            <td><strong style="color:#92400e;">${d.totalFormatted}</strong></td>
            <td><span class="badge-status ${statusClass(d.status)}">${d.status}</span></td>
            <td>
                <button class="btn-icon" title="Lihat Struk" onclick="lihatNota(${realIndex})">Lihat</button>
                <button class="btn-icon" title="Ubah Status" onclick="ubahStatus(${realIndex})" style="color:#d97706;">Ubah</button>
                <button class="btn-icon" title="Hapus" onclick="hapusData(${realIndex})" style="color:#ef4444;">Hapus</button>
            </td>
        </tr>
        `;
    }).join("");
}

// Render Pembayaran - ringkasan dan tabel transaksi
function renderPembayaran(){
    const tbody = document.getElementById("tbodyPembayaran");
    const elOmzet = document.getElementById("bayarOmzet");
    const elLunas = document.getElementById("bayarLunas");
    const elBelum = document.getElementById("bayarBelum");
    const elInfo = document.getElementById("bayarInfo");
    const elBadge = document.getElementById("badgePembayaran");
    const elTunai = document.getElementById("metodeTunai");
    const elQris = document.getElementById("metodeQris");
    const elTransfer = document.getElementById("metodeTransfer");
    const elBon = document.getElementById("metodeBon");

    if(!tbody) return;

    const total = dataPesanan.length;
    const omzet = dataPesanan.reduce((a,b)=>a+(b.total||0),0);
    const lunasList = dataPesanan.filter(d => d.status.toLowerCase().includes("selesai") || d.status.toLowerCase().includes("lunas"));
    const belumList = dataPesanan.filter(d => !d.status.toLowerCase().includes("selesai") && !d.status.toLowerCase().includes("lunas"));
    const lunasOmzet = lunasList.reduce((a,b)=>a+(b.total||0),0);
    const belumOmzet = belumList.reduce((a,b)=>a+(b.total||0),0);

    if(elOmzet) elOmzet.textContent = formatRupiah(omzet);
    if(elLunas) elLunas.textContent = formatRupiah(lunasOmzet);
    if(elBelum) elBelum.textContent = formatRupiah(belumOmzet);
    if(elInfo) elInfo.textContent = lunasList.length + " Lunas / " + belumList.length + " Belum";
    if(elBadge) elBadge.textContent = total + " Transaksi";

    function statMetode(keyword){
        const list = dataPesanan.filter(d => d.pembayaran.toLowerCase().includes(keyword.toLowerCase()));
        const sum = list.reduce((a,b)=>a+(b.total||0),0);
        return { count: list.length, sum };
    }
    const sTunai = statMetode("tunai");
    const sQris = statMetode("qris");
    const sTransfer = statMetode("transfer");
    const sBon = statMetode("bon");
    if(elTunai) elTunai.textContent = formatRupiah(sTunai.sum) + " ("+sTunai.count+")";
    if(elQris) elQris.textContent = formatRupiah(sQris.sum) + " ("+sQris.count+")";
    if(elTransfer) elTransfer.textContent = formatRupiah(sTransfer.sum) + " ("+sTransfer.count+")";
    if(elBon) elBon.textContent = formatRupiah(sBon.sum) + " ("+sBon.count+")";

    if(dataPesanan.length===0){
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Belum ada transaksi pembayaran.</td></tr>`;
        return;
    }

    tbody.innerHTML = dataPesanan.map(d=>{
        const realIndex = dataPesanan.indexOf(d);
        const isLunas = d.status.toLowerCase().includes("selesai") || d.status.toLowerCase().includes("lunas");
        return `
        <tr style="${d.isAuto ? 'background:#fffbeb;' : ''}">
            <td><strong style="color:#92400e;">${d.nota}</strong>${d.isAuto ? ' <span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:10px;font-size:9px;">DRAFT</span>' : ''}</td>
            <td><strong>${d.nama}</strong><br><small style="color:#78716c;">${d.meja}</small></td>
            <td><strong style="color:#92400e;">${d.totalFormatted}</strong></td>
            <td><span class="badge-status" style="background:#fffbeb; border:1px solid #fde68a; color:#92400e;">${d.pembayaran}</span></td>
            <td><span class="badge-status ${statusClass(d.status)}">${d.status}</span></td>
            <td>
                ${!isLunas ? `<button class="btn-icon" onclick="tandaiLunas(${realIndex})" style="color:#15803d; border-color:#bbf7d0; background:#dcfce7;">Bayar</button>` : `<span style="font-size:11px; color:#15803d; font-weight:700;">Lunas</span>`}
                <button class="btn-icon" onclick="lihatNota(${realIndex})">Lihat</button>
            </td>
        </tr>
        `;
    }).join("");
}

async function tandaiLunas(index){
    const d = dataPesanan[index];
    if(!confirm("Tandai pesanan " + d.nota + " ("+d.nama+" - "+d.totalFormatted+") sebagai Lunas?")) return;
    if (API_AVAILABLE && !d.isAuto) {
        const res = await apiFetch(`/pesanan/${d.nota}/lunas`, { method: "PATCH" });
        if (res && res.nota) {
            await loadPesananFromApi(document.getElementById("cari").value);
            renderTable(document.getElementById("cari").value);
            renderPembayaran();
            updateStat();
            return;
        }
    }
    d.status = "Selesai / Lunas";
    if(d.isAuto) delete d.isAuto;
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    renderTable(document.getElementById("cari").value);
    renderPembayaran();
    updateStat();
}

function lihatNota(index) {
    const d = dataPesanan[index];
    tampilNota(d, false);
}

async function ubahStatus(index){
    const d = dataPesanan[index];
    const opsi = ["Antri","Proses Masak","Siap Saji","Selesai / Lunas"];
    const pilih = prompt(`Ubah status pesanan ${d.nota} (${d.nama}):\nPilih: ${opsi.join(" | ")}\n\nKetik status baru:`, d.status);
    if(pilih===null) return;
    const val = pilih.trim();
    if(!val) return;
    if (API_AVAILABLE && !d.isAuto) {
        const res = await apiFetch(`/pesanan/${d.nota}/status`, { method: "PATCH", body: JSON.stringify({ status: val }) });
        if (res && res.nota) {
            await loadPesananFromApi(document.getElementById("cari").value);
            renderTable(document.getElementById("cari").value);
            renderPembayaran();
            updateStat();
            return;
        }
    }
    d.status = val;
    if(val.toLowerCase().includes("selesai") || val.toLowerCase().includes("lunas")){
        if(d.isAuto) delete d.isAuto;
    }
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    if(d.isAuto){
    } else {
        const draftStill = dataPesanan.find(x=>x.isAuto);
        if(!draftStill){
        }
    }
    renderTable(document.getElementById("cari").value);
    renderPembayaran();
    updateStat();
}

async function hapusData(index) {
    const target = dataPesanan[index];
    const isDraft = target.isAuto;
    if (!confirm("Hapus pesanan " + target.nota + " ("+target.nama+") ?")) return;
    if (API_AVAILABLE && !isDraft) {
        const res = await apiFetch(`/pesanan/${target.nota}`, { method: "DELETE" });
        if (res) {
            await loadPesananFromApi(document.getElementById("cari").value);
            if(isDraft){
                keranjang = {};
                renderMenuMakananMinuman();
                updateKeranjang();
            }
            renderTable(document.getElementById("cari").value);
            renderPembayaran();
            updateStat();
            updateNota();
            return;
        }
    }
    dataPesanan.splice(index, 1);
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    if(isDraft){
        keranjang = {};
        renderMenuMakananMinuman();
        updateKeranjang();
    }
    renderTable(document.getElementById("cari").value);
    renderPembayaran();
    updateStat();
    updateNota();
}

async function hapusSemua() {
    if (dataPesanan.length === 0) return alert("Belum ada data pesanan.");
    if (!confirm("Hapus SEMUA data pesanan? Tindakan tidak bisa dibatalkan!")) return;
    if (API_AVAILABLE) {
        const res = await apiFetch("/pesanan/", { method: "DELETE" });
        if (res) {
            await loadPesananFromApi();
            keranjang = {};
            renderMenuMakananMinuman();
            updateKeranjang();
            renderTable();
            renderPembayaran();
            updateStat();
            updateNota();
            document.getElementById("hasil").classList.add("hidden");
            return;
        }
    }
    dataPesanan = [];
    localStorage.removeItem("angkringan_lor_dalan");
    keranjang = {};
    renderMenuMakananMinuman();
    updateKeranjang();
    renderTable();
    renderPembayaran();
    updateStat();
    updateNota();
    document.getElementById("hasil").classList.add("hidden");
}

async function filterData() {
    const q = document.getElementById("cari").value;
    if (API_AVAILABLE) {
        await loadPesananFromApi(q);
    }
    renderTable(q);
}

function updateStat() {
    const total = dataPesanan.length;
    const antri = dataPesanan.filter(d => d.status === "Antri" || d.status === "Proses Masak").length;
    const omzet = dataPesanan.filter(d => d.status !== "Batal").reduce((a,b)=>a+(b.total||0),0);

    const elTotal = document.getElementById("totalData");
    const elAntri = document.getElementById("totalAntri");
    const elOmzet = document.getElementById("totalOmzet");
    const elSideTotal = document.getElementById("sideTotal");
    const elSideOmzet = document.getElementById("sideOmzet");

    if(elTotal) elTotal.textContent = total;
    if(elAntri) elAntri.textContent = antri;
    if(elOmzet) elOmzet.textContent = formatRupiah(omzet);
    if(elSideTotal) elSideTotal.textContent = total;
    if(elSideOmzet) elSideOmzet.textContent = formatRupiah(omzet);
}

function resetForm() {
    document.getElementById("formPesanan").reset();
    document.getElementById("tanggal").valueAsDate = new Date();
    const now = new Date();
    document.getElementById("jamPesan").value = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
    keranjang = {};
    // hapus draft auto jika ada
    const draftIdx = dataPesanan.findIndex(d=>d.isAuto);
    if(draftIdx !== -1){
        dataPesanan.splice(draftIdx,1);
        localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
        renderTable();
        renderPembayaran();
        updateStat();
    }
    renderMenuMakananMinuman();
    updateKeranjang();
    document.getElementById("hasil").classList.add("hidden");
    updateNota();
}
