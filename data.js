// Solar Components Catalog
const solarData = {
    inverters: [
        { id: "deye_6kw", name: "Deye هجين 6.0 kW (داي سينجل فيز)", priceIQD: 1450000, powerKw: 6.0, type: "Hybrid" },
        { id: "deye_8kw", name: "Deye هجين 8.0 kW (داي سينجل فيز)", priceIQD: 1980000, powerKw: 8.0, type: "Hybrid" },
        { id: "deye_10kw", name: "Deye هجين 10.0 kW (داي 3 فيز)", priceIQD: 2650000, powerKw: 10.0, type: "Hybrid 3-Phase" },
        { id: "growatt_5kw", name: "Growatt 5.0 kW ES (غروات أوف غريد)", priceIQD: 950000, powerKw: 5.0, type: "Off-Grid" },
        { id: "must_5kw", name: "MUST PV1800 5.2 kW (موست)", priceIQD: 780000, powerKw: 5.2, type: "Off-Grid" }
    ],
    panels: [
        { id: "longi_585", name: "Longi Hi-MO 6 نيم تايب 585W (لونجي)", priceIQD: 135000, watt: 585 },
        { id: "jinko_575", name: "Jinko Tiger Neo N-Type 575W (جينكو)", priceIQD: 130000, watt: 575 },
        { id: "ja_550", name: "JA Solar Half-Cell 550W (جي إيه سولار)", priceIQD: 120000, watt: 550 }
    ],
    batteries: [
        { id: "dyness_5kwh", name: "Dyness ليثيوم حائطي 5.12 kWh (داينس 100Ah)", priceIQD: 1650000, capacityKwh: 5.12 },
        { id: "felicity_10kwh", name: "Felicity ليثيوم 10.0 kWh (فيليسيتي)", priceIQD: 2950000, capacityKwh: 10.0 },
        { id: "pylontech_3.5kwh", name: "Pylontech US3000C 3.5 kWh (بايلونتك)", priceIQD: 1350000, capacityKwh: 3.5 },
        { id: "gel_200ah", name: "أنبوبية جل Deep Cycle 200Ah (12V)", priceIQD: 320000, capacityKwh: 2.4 }
    ],
    defaults: {
        usdRate: 150000, // 100 USD
        laborPrice: 250000,
        structurePricePerPanel: 25000,
        protectionPrice: 180000,
        connectionPriceUnder30: 500000,
        connectionPriceOver30: 750000
    }
};
