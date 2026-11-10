// Calculation Engine
class SolarCalculator {
    constructor(data) {
        this.data = data;
        this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem("alnoor_solar_settings");
        if (saved) {
            try {
                this.settings = { ...this.data.defaults, ...JSON.parse(saved) };
            } catch (e) {
                this.settings = { ...this.data.defaults };
            }
        } else {
            this.settings = { ...this.data.defaults };
        }
    }

    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem("alnoor_solar_settings", JSON.stringify(this.settings));
    }

    calculate(params) {
        const {
            inverterId,
            inverterQty,
            panelId,
            panelQty,
            batteryId,
            batteryQty,
            includeStructure,
            includeProtection,
            includeLabor,
            includeConnection,
            downPaymentInput
        } = params;

        // Inverter
        const inverter = this.data.inverters.find(i => i.id === inverterId) || this.data.inverters[0];
        const inverterTotal = inverter.priceIQD * inverterQty;

        // Panel
        const panel = this.data.panels.find(p => p.id === panelId) || this.data.panels[0];
        const panelTotal = panel.priceIQD * panelQty;
        const totalWattage = panel.watt * panelQty;

        // Battery
        const battery = this.data.batteries.find(b => b.id === batteryId) || this.data.batteries[0];
        const batteryTotal = battery.priceIQD * batteryQty;
        const totalBatteryCapacity = (battery.capacityKwh * batteryQty).toFixed(1);

        // Accessories & Labor
        let structureCost = 0;
        if (includeStructure) {
            structureCost = panelQty * this.settings.structurePricePerPanel;
        }

        let protectionCost = 0;
        if (includeProtection) {
            protectionCost = this.settings.protectionPrice;
        }

        let laborCost = 0;
        if (includeLabor) {
            laborCost = this.settings.laborPrice;
        }

        const connectionCost = includeConnection
            ? (panelQty <= 30 ? Number(this.settings.connectionPriceUnder30 || 0) : Number(this.settings.connectionPriceOver30 || 0))
            : 0;
        const auxTotal = structureCost + protectionCost;
        const baseCashTotal = inverterTotal + panelTotal + batteryTotal;
        const grandCashTotal = baseCashTotal + auxTotal + connectionCost + laborCost;

        // Financing: fixed 18 months; 40% loading applies only to the balance after the customer's manual down payment.
        let downPayment = 0;
        if (downPaymentInput !== undefined && downPaymentInput !== null && downPaymentInput !== "") {
            downPayment = Number(downPaymentInput);
        }
        if (!Number.isFinite(downPayment) || downPayment < 0) downPayment = 0;
        if (downPayment > grandCashTotal) downPayment = grandCashTotal;

        const remainingBalance = grandCashTotal - downPayment;
        const months = 18;
        const rate = 0.40;
        const interestAmount = Math.round(remainingBalance * rate);
        const totalInstallmentCost = remainingBalance + interestAmount;
        const monthlyInstallment = Math.round(totalInstallmentCost / months);
        const finalFinancedGrandTotal = downPayment + totalInstallmentCost;

        return {
            items: {
                inverter: { ...inverter, qty: inverterQty, total: inverterTotal },
                panel: { ...panel, qty: panelQty, total: panelTotal, totalWattage },
                battery: { ...battery, qty: batteryQty, total: batteryTotal, totalBatteryCapacity },
                structureCost,
                protectionCost,
                laborCost,
                connectionCost
            },
            financials: {
                baseCashTotal,
                auxTotal,
                laborCost,
                grandCashTotal,
                downPayment,
                remainingBalance,
                ratePercent: 40,
                interestAmount,
                monthlyInstallment,
                months,
                finalFinancedGrandTotal
            }
        };
    }
}
