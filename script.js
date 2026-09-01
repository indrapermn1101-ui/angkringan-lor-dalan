// Angkringan Lor Dalan - Data Warung
// Alamat: Sambi Gedong, Tawengan, Sambi, Boyolali
const DAFTAR_MENU = [
    { id: 'naskuc', nama: 'Nasi Kucing', harga: 5000, kategori: 'Nasi' },
    { id: 'nasbak', nama: 'Nasi Bakar Ayam', harga: 15000, kategori: 'Nasi' },
    { id: 'nasGor', nama: 'Nasi Goreng Jawa', harga: 14000, kategori: 'Nasi' },
    { id: 'sate_usus', nama: 'Sate Usus', harga: 3500, kategori: 'Sate' },
    { id: 'sate_telur', nama: 'Sate Telur Puyuh', harga: 4000, kategori: 'Sate' },
    { id: 'sate_ayam', nama: 'Sate Ayam', harga: 5000, kategori: 'Sate' },
    { id: 'sate_ati', nama: 'Sate Ati Ampela', harga: 4500, kategori: 'Sate' },
    { id: 'gor_tahu', nama: 'Tahu Bacem', harga: 2000, kategori: 'Gorengan' },
    { id: 'gor_tempe', nama: 'Tempe Mendoan', harga: 2000, kategori: 'Gorengan' },
    { id: 'gor_bakwan', nama: 'Bakwan Goreng', harga: 2000, kategori: 'Gorengan' },
    { id: 'sosis', nama: 'Sosis Bakar', harga: 6000, kategori: 'Bakaran' },
    { id: 'kopi_joss', nama: 'Kopi Joss Arang', harga: 8000, kategori: 'Minuman' },
    { id: 'wedang_jahe', nama: 'Wedang Jahe Susu', harga: 8000, kategori: 'Minuman' },
    { id: 'teh', nama: 'Teh Hangat / Es Teh', harga: 5000, kategori: 'Minuman' },
    { id: 'es_jeruk', nama: 'Es Jeruk Peras', harga: 7000, kategori: 'Minuman' },
    { id: 'indomie', nama: 'Indomie Goreng/Telor', harga: 13000, kategori: 'Mie' },
];

let keranjang = {}; // {id: qty}
let dataPesanan = JSON.parse(localStorage.getItem("angkringan_lor_dalan") || localStorage.getItem("service_hp_data") || "[]");

if (dataPesanan.length > 0 && dataPesanan[0].merek !== undefined) {
    localStorage.setItem("backup_service_hp", JSON.stringify(dataPesanan));
    dataPesanan = JSON.parse(localStorage.getItem("angkringan_lor_dalan") || "[]");
}

document.addEventListener("DOMContentLoaded", () => {
    const tgl = document.getElementById("tanggal");
    if (tgl) tgl.valueAsDate = new Date();
    const jam = document.getElementById("jamPesan");
    if (jam) {
        const now = new Date();
        jam.value = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
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
        return `
        <div class="menu-item ${qty>0?'selected':''}" onclick="tambahMenu('${item.id}')">
            <div class="menu-info">
                <strong>${item.nama}</strong>
                <small>${item.kategori} - ${formatRupiah(item.harga)}</small>
            </div>
            <div class="menu-action" onclick="event.stopPropagation()">
                ${qty>0 ? `<button class="btn-qty" onclick="kurangMenu('${item.id}')">-</button><span class="qty-badge">${qty}</span>` : ''}
                <button class="btn-qty add" onclick="tambahMenu('${item.id}')" title="Tambah">+</button>
            </div>
        </div>
        `;
    }

    gridMakanan.innerHTML = makanan.map(itemHtml).join("");
    gridMinuman.innerHTML = minuman.map(itemHtml).join("");
}

function tambahMenu(id){
    keranjang[id] = (keranjang[id] || 0) + 1;
    renderMenuMakananMinuman();
    updateKeranjang();
    syncKeranjangLangsung();
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

    if(ids.length===0){
        wrap.innerHTML = `<p class="keranjang-empty">Belum ada menu dipilih. Klik + pada Daftar Makanan / Minuman di atas!</p>`;
        return;
    }
    wrap.innerHTML = ids.map(id=>{
        const menu = DAFTAR_MENU.find(m=>m.id===id);
        const qty = keranjang[id];
        const sub = menu.harga * qty;
        return `
        <div class="keranjang-item">
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
        items.push({ id, nama: menu.nama, harga: menu.harga, qty, subtotal: sub, kategori: menu.kategori });
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

function simpanPesanan() {
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
        alert("Mohon lengkapi: Nama Pelanggan dan No. Meja / Bungkus!");
        if (!nama) document.getElementById("nama").focus();
        else document.getElementById("meja").focus();
        return;
    }
    if (!keranjangData) {
        alert("Pilih minimal 1 menu dulu, Lur! Klik + pada Daftar Makanan / Minuman di atas.");
        return;
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
        <div class="nota-item-row">
            <span>${it.nama} <small style="color:#78716c;">x${it.qty}</small></span>
            <span>${formatRupiah(it.subtotal)}</span>
        </div>
    `).join("");
    hasil.innerHTML = `
        <h4 style="display:flex;align-items:center;gap:10px;"><img src="AGK.jpg" alt="Logo" style="width:32px;height:32px;border-radius:8px;object-fit:cover;border:1px solid #fde68a;flex-shrink:0;"> Struk - ${d.nota} <span style="margin-left:auto;font-size:11px;background:${statusColor(d.status)};color:white;padding:4px 10px;border-radius:20px;">${d.status}${d.isAuto ? ' - Draft' : ''}</span></h4>
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
        return `
        <tr style="${d.isAuto ? 'background:#fffbeb; border-left:4px solid #f59e0b;' : ''}">
            <td><strong style="color:#92400e;">${d.nota}</strong>${isDraft}</td>
            <td>${formatTanggal(d.tanggal)}<br><small style="color:#78716c;">${d.jam}</small></td>
            <td><strong>${d.nama}</strong><br><small style="color:#78716c;">${d.meja} - ${d.jmlOrang}</small></td>
            <td style="max-width:280px;">
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

function tandaiLunas(index){
    const d = dataPesanan[index];
    if(confirm("Tandai pesanan " + d.nota + " ("+d.nama+" - "+d.totalFormatted+") sebagai Lunas?")){
        d.status = "Selesai / Lunas";
        if(d.isAuto) delete d.isAuto;
        localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
        renderTable(document.getElementById("cari").value);
        renderPembayaran();
        updateStat();
    }
}

function lihatNota(index) {
    const d = dataPesanan[index];
    tampilNota(d, false);
}

function ubahStatus(index){
    const d = dataPesanan[index];
    const opsi = ["Antri","Proses Masak","Siap Saji","Selesai / Lunas"];
    const pilih = prompt(`Ubah status pesanan ${d.nota} (${d.nama}):\nPilih: ${opsi.join(" | ")}\n\nKetik status baru:`, d.status);
    if(pilih===null) return;
    const val = pilih.trim();
    if(!val) return;
    d.status = val;
    if(val.toLowerCase().includes("selesai") || val.toLowerCase().includes("lunas")){
        if(d.isAuto) delete d.isAuto;
    }
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    // jika status jadi lunas dan masih ada keranjang yang sama, reset keranjang
    if(d.isAuto){
        // tetap auto, sync ulang
    } else {
        // jika draft difinalkan via ubah status, kosongkan keranjang jika cocok
        const draftStill = dataPesanan.find(x=>x.isAuto);
        if(!draftStill){
            // tidak ada draft lagi, kosongkan keranjang agar tidak duplikat
        }
    }
    renderTable(document.getElementById("cari").value);
    renderPembayaran();
    updateStat();
}

function hapusData(index) {
    const target = dataPesanan[index];
    const isDraft = target.isAuto;
    if (!confirm("Hapus pesanan " + target.nota + " ("+target.nama+") ?")) return;
    dataPesanan.splice(index, 1);
    localStorage.setItem("angkringan_lor_dalan", JSON.stringify(dataPesanan));
    // jika hapus draft auto, kosongkan keranjang juga
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

function hapusSemua() {
    if (dataPesanan.length === 0) return alert("Belum ada data pesanan.");
    if (!confirm("Hapus SEMUA data pesanan? Tindakan tidak bisa dibatalkan!")) return;
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

function filterData() {
    const q = document.getElementById("cari").value;
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
