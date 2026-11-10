// DOM Binding & Controller
document.addEventListener("DOMContentLoaded", () => {
    const calcEngine = new SolarCalculator(solarData);
    // Prices published to data.js take priority over older per-device settings.
    calcEngine.settings = { ...solarData.defaults };

    // Elements
    const inverterSelect = document.getElementById("inverterSelect");
    const inverterQty = document.getElementById("inverterQty");
    const inverterUnitPrice = document.getElementById("inverterUnitPrice");
    const inverterPillText = document.getElementById("inverterPillText");

    const panelSelect = document.getElementById("panelSelect");
    const panelQty = document.getElementById("panelQty");
    const panelUnitPrice = document.getElementById("panelUnitPrice");
    const totalPanelWatt = document.getElementById("totalPanelWatt");

    const batterySelect = document.getElementById("batterySelect");
    const batteryQty = document.getElementById("batteryQty");
    const batteryUnitPrice = document.getElementById("batteryUnitPrice");
    const totalBatteryCap = document.getElementById("totalBatteryCap");

    const includeStructure = document.getElementById("includeStructure");
    const includeProtection = document.getElementById("includeProtection");
    const includeLabor = document.getElementById("includeLabor");
    const connectionYes = document.getElementById("connectionYes");
    const paymentCash = document.getElementById("paymentCash");
    const paymentInstallment = document.getElementById("paymentInstallment");
    const installmentBox = document.getElementById("installmentBox");

    const cashTotalEl = document.getElementById("cashTotal");
    const auxCostEl = document.getElementById("auxCost");
    const laborCostEl = document.getElementById("laborCost");
    const connectionCostEl = document.getElementById("connectionCost");
    const grandCashTotalEl = document.getElementById("grandCashTotal");

    const downPaymentAmount = document.getElementById("downPaymentAmount");
    const displayDownPayment = document.getElementById("displayDownPayment");
    const displayRemaining = document.getElementById("displayRemaining");
    const displayInterest = document.getElementById("displayInterest");
    const displayMonthlyInstallment = document.getElementById("displayMonthlyInstallment");

    const printQuoteBtn = document.getElementById("printQuoteBtn");
    const whatsappBtn = document.getElementById("whatsappBtn");
    const resetBtn = document.getElementById("resetBtn");

    // Admin Modal Elements
    const openAdminBtn = document.getElementById("openAdminBtn");
    const closeAdminBtn = document.getElementById("closeAdminBtn");
    const adminModal = document.getElementById("adminModal");
    const saveAdminSettings = document.getElementById("saveAdminSettings");
    const usdRate = document.getElementById("usdRate");
    const laborPriceConfig = document.getElementById("laborPriceConfig");
    const structurePricePerPanel = document.getElementById("structurePricePerPanel");
    const protectionPriceConfig = document.getElementById("protectionPriceConfig");
    const connectionPriceUnder30 = document.getElementById("connectionPriceUnder30");
    const connectionPriceOver30 = document.getElementById("connectionPriceOver30");

    // Populate Select Options
    function populateDropdowns() {
        inverterSelect.innerHTML = solarData.inverters.map(i => 
            `<option value="${i.id}">${i.name} - ${i.priceIQD.toLocaleString()} د.ع</option>`
        ).join("");

        panelSelect.innerHTML = solarData.panels.map(p => 
            `<option value="${p.id}">${p.name} - ${p.priceIQD.toLocaleString()} د.ع</option>`
        ).join("");

        batterySelect.innerHTML = solarData.batteries.map(b => 
            `<option value="${b.id}">${b.name} - ${b.priceIQD.toLocaleString()} د.ع</option>`
        ).join("");
    }

    function formatIQD(num) {
        return Math.round(num).toLocaleString("ar-IQ") + " د.ع";
    }

    function updateCalculations() {
        const params = {
            inverterId: inverterSelect.value,
            inverterQty: Number(inverterQty.value) || 1,
            panelId: panelSelect.value,
            panelQty: Number(panelQty.value) || 0,
            batteryId: batterySelect.value,
            batteryQty: Number(batteryQty.value) || 0,
            includeStructure: includeStructure.checked,
            includeProtection: includeProtection.checked,
            includeLabor: includeLabor.checked,
            includeConnection: connectionYes.checked,
            downPaymentInput: downPaymentAmount.value !== "" ? Number(downPaymentAmount.value) : null
        };

        const res = calcEngine.calculate(params);

        // Update step UI
        inverterUnitPrice.textContent = formatIQD(res.items.inverter.priceIQD);
        inverterPillText.textContent = `القدرة المختارة: ${res.items.inverter.name}`;

        panelUnitPrice.textContent = formatIQD(res.items.panel.priceIQD);
        totalPanelWatt.textContent = res.items.panel.totalWattage.toLocaleString();

        batteryUnitPrice.textContent = formatIQD(res.items.battery.priceIQD);
        totalBatteryCap.textContent = res.items.battery.totalBatteryCapacity;

        // Update Summary
        cashTotalEl.textContent = formatIQD(res.financials.baseCashTotal);
        auxCostEl.textContent = formatIQD(res.financials.auxTotal);
        laborCostEl.textContent = formatIQD(res.financials.laborCost);
        connectionCostEl.textContent = formatIQD(res.items.connectionCost);
        grandCashTotalEl.textContent = formatIQD(res.financials.grandCashTotal);

        // Update Installments
        displayDownPayment.textContent = formatIQD(res.financials.downPayment);
        displayRemaining.textContent = formatIQD(res.financials.remainingBalance);
        displayInterest.textContent = `${formatIQD(res.financials.interestAmount)} (${res.financials.ratePercent}%)`;
        displayMonthlyInstallment.textContent = `${formatIQD(res.financials.monthlyInstallment)} / شهر`;
        installmentBox.classList.toggle("is-hidden", paymentCash.checked);
        downPaymentAmount.max = String(res.financials.grandCashTotal);
        downPaymentAmount.setCustomValidity(Number(downPaymentAmount.value) > res.financials.grandCashTotal ? "الدفعة المقدمة لا يمكن أن تتجاوز السعر النقدي" : "");

        return res;
    }

    // Event listeners
    [inverterSelect, inverterQty, panelSelect, panelQty, batterySelect, batteryQty,
     includeStructure, includeProtection, includeLabor, connectionYes, document.getElementById("connectionNo"), paymentCash, paymentInstallment].forEach(el => {
        el.addEventListener("change", updateCalculations);
        el.addEventListener("input", updateCalculations);
    });

    downPaymentAmount.addEventListener("input", updateCalculations);

    // Reset button
    resetBtn.addEventListener("click", () => {
        inverterSelect.selectedIndex = 0;
        inverterQty.value = 1;
        panelSelect.selectedIndex = 0;
        panelQty.value = 8;
        batterySelect.selectedIndex = 0;
        batteryQty.value = 1;
        includeStructure.checked = true;
        includeProtection.checked = true;
        includeLabor.checked = true;
        downPaymentAmount.value = "";
        connectionYes.checked = true;
        paymentCash.checked = true;
        updateCalculations();
    });

    // The public button opens the dedicated admin page. It does not edit prices locally.
    openAdminBtn.addEventListener("click", () => {
        window.location.href = "./admin.html";
    });

    function validateInstallmentInput(res) {
        if (!paymentInstallment.checked) return true;
        const raw = downPaymentAmount.value.trim();
        const amount = Number(raw);
        if (raw === "" || !Number.isFinite(amount) || amount < 0 || amount > res.financials.grandCashTotal) {
            alert("يرجى إدخال مبلغ الدفعة المقدمة بشكل صحيح، وألا يتجاوز السعر النقدي للمنظومة.");
            downPaymentAmount.focus();
            return false;
        }
        return true;
    }

    // Print & PDF quotation setup
    printQuoteBtn.addEventListener("click", () => {
        const res = updateCalculations();
        if (!validateInstallmentInput(res)) return;
        const dateStr = new Date().toLocaleDateString("ar-IQ", { year: 'numeric', month: 'long', day: 'numeric' });
        const quoteNum = "ALN-" + Math.floor(100000 + Math.random() * 900000);

        document.getElementById("printDate").textContent = dateStr;
        document.getElementById("printQuoteNumber").textContent = quoteNum;

        const tbody = document.getElementById("printTableBody");
        tbody.innerHTML = `
            <tr>
                <td>1</td>
                <td>عاكس شمسي هجين (Inverter)</td>
                <td>${res.items.inverter.name}</td>
                <td>${res.items.inverter.qty}</td>
                <td>${res.items.inverter.priceIQD.toLocaleString()} د.ع</td>
                <td>${res.items.inverter.total.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>2</td>
                <td>ألواح طاقة شمسية</td>
                <td>${res.items.panel.name} (إجمالي ${res.items.panel.totalWattage} واط)</td>
                <td>${res.items.panel.qty}</td>
                <td>${res.items.panel.priceIQD.toLocaleString()} د.ع</td>
                <td>${res.items.panel.total.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>3</td>
                <td>منظومة تخزين الطاقة (بطاريات)</td>
                <td>${res.items.battery.name} (${res.items.battery.totalBatteryCapacity} kWh)</td>
                <td>${res.items.battery.qty}</td>
                <td>${res.items.battery.priceIQD.toLocaleString()} د.ع</td>
                <td>${res.items.battery.total.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>4</td>
                <td>هياكل وقواعد التثبيت</td>
                <td>قواعد مقاومة للرياح ومجلفنة</td>
                <td>${res.items.panel.qty} لوح</td>
                <td>${calcEngine.settings.structurePricePerPanel.toLocaleString()} د.ع</td>
                <td>${res.items.structureCost.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>5</td>
                <td>منظومة الحماية والكوابل</td>
                <td>لوحة قواطع DC/AC + فواصم + حماية الصواعق وتأريض</td>
                <td>1 مجموعة</td>
                <td>${res.items.protectionCost.toLocaleString()} د.ع</td>
                <td>${res.items.protectionCost.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>6</td>
                <td>أجور الربط</td>
                <td>${connectionYes.checked ? (res.items.connectionCost ? "مع ربط" : "مع ربط - بدون أجور") : "بدون ربط"}</td>
                <td>1 خدمة</td>
                <td>${res.items.connectionCost.toLocaleString()} د.ع</td>
                <td>${res.items.connectionCost.toLocaleString()} د.ع</td>
            </tr>
            <tr>
                <td>7</td>
                <td>النقل والتركيب والتشغيل</td>
                <td>تثبيت وبرمجة هندسية فاحصة مع الضمان</td>
                <td>1 موقع</td>
                <td>${res.items.laborCost.toLocaleString()} د.ع</td>
                <td>${res.items.laborCost.toLocaleString()} د.ع</td>
            </tr>
        `;

        document.getElementById("printTotalCash").textContent = formatIQD(res.financials.grandCashTotal);
        
        const instInfo = document.getElementById("printInstallmentInfo");
        instInfo.innerHTML = paymentInstallment.checked ? `
            <div style="margin-top: 10px; font-size: 11pt; border-top: 1px dashed #999; padding-top: 8px;">
                <p><strong>خطة التقسيط المعتمدة:</strong> دفعة مقدمة: ${formatIQD(res.financials.downPayment)} | المتبقي: ${formatIQD(res.financials.remainingBalance)}</p>
                <p><strong>تحميل 40% على المتبقي:</strong> ${formatIQD(res.financials.interestAmount)}</p>
                <p><strong>القسط الشهري:</strong> <span style="color:#0b3d2c; font-size: 13pt; font-weight:bold;">${formatIQD(res.financials.monthlyInstallment)}</span> لمدة 18 شهراً.</p>
            </div>
        ` : `<p><strong>طريقة الدفع: نقداً</strong></p>`;

        window.print();
    });

    // WhatsApp integration
    whatsappBtn.addEventListener("click", () => {
        const res = updateCalculations();
        if (!validateInstallmentInput(res)) return;
        const msg = `*طلب عرض سعر منظومة طاقة شمسية - مجمع النور التجاري*\n` +
            `-----------------------------------\n` +
            `العاكس: ${res.items.inverter.name} (عدد: ${res.items.inverter.qty})\n` +
            `الألواح: ${res.items.panel.name} (عدد: ${res.items.panel.qty}) بقدرة ${res.items.panel.totalWattage}W\n` +
            `البطاريات: ${res.items.battery.name} (عدد: ${res.items.battery.qty}) بسعة ${res.items.battery.totalBatteryCapacity}kWh\n` +
            `خدمة الربط: ${connectionYes.checked ? "مع ربط" : "بدون ربط"}\n` +
            `الإجمالي النقدي: ${res.financials.grandCashTotal.toLocaleString()} دينار عراقي\n` +
            (paymentInstallment.checked ? `الدفعة المقدمة: ${res.financials.downPayment.toLocaleString()} د.ع\n` +
            `تحميل 40% على المتبقي: ${res.financials.interestAmount.toLocaleString()} د.ع\n` +
            `القسط الشهري: ${res.financials.monthlyInstallment.toLocaleString()} د.ع (18 شهر)\n` : `طريقة الدفع: نقداً\n`) +
            `-----------------------------------\n` +
            `يرجى التواصل لتحديد موعد الكشف الميداني والتثبيت.`;

        const encoded = encodeURIComponent(msg);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    });

    // Initial boot
    populateDropdowns();
    updateCalculations();
});
