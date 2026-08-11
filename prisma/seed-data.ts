/**
 * Development seed catalogue for All American Muscle.
 *
 * IMPORTANT: every product in this file is flagged sourceType=SAMPLE and
 * needsReview=true. Names, specs and prices are development placeholders
 * modelled on the kinds of parts the store sells (public category/brand
 * information). They are NOT migrated live data. Run the crawler or the
 * WooCommerce importer (see scripts/) to replace this catalogue with the
 * real one before launch. See reports/crawl-report.md for why the live
 * crawl could not run in the build environment.
 */

export const engineFamilies = [
  { slug: "small-block-chevy", name: "Small Block Chevy", make: "Chevrolet", aliases: ["SBC", "small block", "smallblock chevy", "265", "283", "305", "327", "350", "400 small block", "chevy 350"] },
  { slug: "big-block-chevy", name: "Big Block Chevy", make: "Chevrolet", aliases: ["BBC", "big block", "396", "427", "454", "rat motor"] },
  { slug: "ford-windsor", name: "Ford Windsor (Small Block)", make: "Ford", aliases: ["SBF", "small block ford", "289", "302", "351W", "351 windsor", "5.0", "boss 302"] },
  { slug: "ford-cleveland", name: "Ford Cleveland", make: "Ford", aliases: ["351C", "351 cleveland", "cleveland"] },
  { slug: "ford-fe", name: "Ford FE Big Block", make: "Ford", aliases: ["FE", "390", "427 ford", "428", "428 cobra jet"] },
  { slug: "gm-ls", name: "GM LS", make: "Chevrolet", aliases: ["LS", "LS1", "LS2", "LS3", "LSX", "gen iii", "gen iv", "5.3", "6.0", "6.2"] },
  { slug: "mopar-la", name: "Mopar Small Block (LA)", make: "Dodge", aliases: ["LA", "318", "340", "360", "mopar small block"] },
  { slug: "mopar-b-rb", name: "Mopar Big Block (B/RB)", make: "Dodge", aliases: ["RB", "383", "413", "426 wedge", "440", "mopar big block"] },
  { slug: "mopar-hemi", name: "Mopar 426 Hemi", make: "Dodge", aliases: ["hemi", "426 hemi", "elephant motor"] },
];

export const makes = [
  {
    slug: "ford", name: "Ford",
    models: [
      { slug: "mustang-1964-1973", name: "Mustang", yearFrom: 1964, yearTo: 1973 },
      { slug: "f-100-1953-1979", name: "F-100", yearFrom: 1953, yearTo: 1979 },
      { slug: "fairlane-1962-1970", name: "Fairlane", yearFrom: 1962, yearTo: 1970 },
      { slug: "galaxie-1959-1974", name: "Galaxie", yearFrom: 1959, yearTo: 1974 },
    ],
  },
  {
    slug: "chevrolet", name: "Chevrolet",
    models: [
      { slug: "camaro-1967-1981", name: "Camaro", yearFrom: 1967, yearTo: 1981 },
      { slug: "corvette-1963-1982", name: "Corvette", yearFrom: 1963, yearTo: 1982 },
      { slug: "chevelle-1964-1977", name: "Chevelle", yearFrom: 1964, yearTo: 1977 },
      { slug: "nova-1962-1979", name: "Nova", yearFrom: 1962, yearTo: 1979 },
      { slug: "c10-1960-1987", name: "C10 Pickup", yearFrom: 1960, yearTo: 1987 },
      { slug: "impala-1958-1976", name: "Impala", yearFrom: 1958, yearTo: 1976 },
      { slug: "bel-air-1953-1975", name: "Bel Air", yearFrom: 1953, yearTo: 1975 },
    ],
  },
  {
    slug: "dodge", name: "Dodge",
    models: [
      { slug: "charger-1966-1974", name: "Charger", yearFrom: 1966, yearTo: 1974 },
      { slug: "challenger-1970-1974", name: "Challenger", yearFrom: 1970, yearTo: 1974 },
      { slug: "dart-1963-1976", name: "Dart", yearFrom: 1963, yearTo: 1976 },
      { slug: "d100-1961-1980", name: "D100 Pickup", yearFrom: 1961, yearTo: 1980 },
    ],
  },
  {
    slug: "plymouth", name: "Plymouth",
    models: [
      { slug: "barracuda-1964-1974", name: "Barracuda", yearFrom: 1964, yearTo: 1974 },
      { slug: "road-runner-1968-1975", name: "Road Runner", yearFrom: 1968, yearTo: 1975 },
      { slug: "duster-1970-1976", name: "Duster", yearFrom: 1970, yearTo: 1976 },
    ],
  },
  {
    slug: "pontiac", name: "Pontiac",
    models: [
      { slug: "gto-1964-1974", name: "GTO", yearFrom: 1964, yearTo: 1974 },
      { slug: "firebird-1967-1981", name: "Firebird", yearFrom: 1967, yearTo: 1981 },
    ],
  },
];

export const brands = [
  { slug: "mastodon", name: "Mastodon", description: "All American Muscle's house range of workshop-proven performance and dress-up parts." },
  { slug: "enginetech", name: "Enginetech", description: "Engine rebuild kits and internal components." },
  { slug: "arp", name: "ARP", description: "Automotive Racing Products — high-strength fasteners." },
  { slug: "edelbrock", name: "Edelbrock", description: "Intake manifolds, carburettors and performance packages." },
  { slug: "comp-cams", name: "COMP Cams", description: "Camshafts and valvetrain components." },
  { slug: "fel-pro", name: "Fel-Pro", description: "Gaskets and sealing solutions." },
  { slug: "lokar", name: "Lokar", description: "Shifters, cables and billet accessories." },
  { slug: "holley", name: "Holley", description: "Carburettors, fuel systems and EFI." },
  { slug: "ap-racing", name: "AP Racing", description: "Brake calipers and high-performance braking." },
  { slug: "ford-racing", name: "Ford Racing", description: "Ford Performance parts and crate engines." },
  { slug: "speedmaster", name: "Speedmaster", description: "Performance engine and driveline components." },
  { slug: "dynacorn", name: "Dynacorn", description: "Licensed reproduction body shells and panels." },
  { slug: "msd", name: "MSD", description: "Ignition boxes, distributors and coils." },
  { slug: "moog", name: "Moog", description: "Steering and suspension components." },
];

export const categories = [
  { slug: "engines-components", name: "Engines & Components", children: ["camshafts-valvetrain", "pistons-rotating", "cylinder-heads", "crate-engines", "rebuild-kits"] },
  { slug: "air-fuel-delivery", name: "Air & Fuel Delivery", children: ["carburettors", "intake-manifolds", "fuel-pumps", "air-cleaners"] },
  { slug: "gaskets-seals", name: "Gaskets & Seals", children: [] },
  { slug: "ignition-electrical", name: "Ignition & Electrical", children: ["distributors", "ignition-boxes", "wiring"] },
  { slug: "transmission-drivetrain", name: "Transmission & Drivetrain", children: ["shifters", "clutches", "differentials"] },
  { slug: "cooling-heating", name: "Cooling & Heating", children: ["radiators", "water-pumps", "fans"] },
  { slug: "chassis-suspension", name: "Chassis & Suspension", children: ["control-arms", "springs-shocks", "steering"] },
  { slug: "interior-accessories", name: "Interior & Accessories", children: [] },
  { slug: "brakes", name: "Brakes", children: ["disc-conversion-kits", "calipers-pads", "boosters-masters"] },
  { slug: "body-exterior", name: "Body & Exterior", children: ["body-shells", "panels", "trim"] },
  { slug: "exhaust", name: "Exhaust", children: ["headers", "mufflers"] },
  { slug: "fasteners-hardware", name: "Fasteners & Hardware", children: [] },
  { slug: "lighting", name: "Lighting", children: [] },
  { slug: "gauges", name: "Gauges", children: [] },
  { slug: "wheels-tyres", name: "Wheels & Tyres", children: [] },
];

const childNames: Record<string, string> = {
  "camshafts-valvetrain": "Camshafts & Valvetrain",
  "pistons-rotating": "Pistons & Rotating Assemblies",
  "cylinder-heads": "Cylinder Heads",
  "crate-engines": "Crate Engines",
  "rebuild-kits": "Engine Rebuild Kits",
  carburettors: "Carburettors",
  "intake-manifolds": "Intake Manifolds",
  "fuel-pumps": "Fuel Pumps",
  "air-cleaners": "Air Cleaners",
  distributors: "Distributors",
  "ignition-boxes": "Ignition Boxes",
  wiring: "Wiring",
  shifters: "Shifters",
  clutches: "Clutches",
  differentials: "Differentials",
  radiators: "Radiators",
  "water-pumps": "Water Pumps",
  fans: "Fans",
  "control-arms": "Control Arms",
  "springs-shocks": "Springs & Shocks",
  steering: "Steering",
  "disc-conversion-kits": "Disc Brake Conversion Kits",
  "calipers-pads": "Calipers & Pads",
  "boosters-masters": "Boosters & Master Cylinders",
  "body-shells": "Body Shells",
  panels: "Panels",
  trim: "Trim",
  headers: "Headers",
  mufflers: "Mufflers",
};
export const childCategoryName = (slug: string) => childNames[slug] ?? slug;

export type SeedFitment = {
  make?: string; // make slug
  model?: string; // model slug
  yearFrom?: number;
  yearTo?: number;
  engine?: string; // engine family slug
  status: "CONFIRMED" | "UNIVERSAL_WITH_REQUIREMENTS" | "POTENTIAL" | "NOT_COMPATIBLE";
  notes?: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  sku: string;
  brand: string;
  priceR: number; // rand
  saleR?: number;
  stock?: "IN_STOCK" | "OUT_OF_STOCK" | "BACKORDER";
  qty?: number;
  short: string;
  desc: string;
  specs?: [string, string][];
  cats: string[]; // category slugs (parent or child)
  engines?: string[]; // engine family slugs
  universal?: boolean;
  fitmentCheck?: boolean;
  safety?: boolean;
  fitments?: SeedFitment[];
  included?: string[];
  required?: string[];
  installNotes?: string;
  featured?: boolean;
  bestSeller?: boolean;
  popularity?: number;
  weightG?: number;
  relations?: { slug: string; type: "RELATED" | "CROSS_SELL" | "UPSELL" | "REQUIRED" | "RECOMMENDED" | "FREQUENTLY_BOUGHT_TOGETHER"; note?: string }[];
};

export const products: SeedProduct[] = [
  // ---- Air & fuel: carburettors ----
  {
    slug: "edelbrock-performer-carburetor-600-cfm-manual-choke",
    name: "Edelbrock Performer Carburettor 600 CFM Manual Choke",
    sku: "EDL-1405-S", brand: "edelbrock", priceR: 8799.99, qty: 4,
    short: "600 CFM four-barrel carburettor with manual choke — a dependable street calibration for small and mid-size V8s.",
    desc: "The Performer-series 600 CFM four-barrel is the classic street carburettor: metering rods instead of power valves, easy tuning, and a calibration that favours smooth part-throttle response and fuel economy. Manual choke version. Suits most small-block V8s with a square-bore intake flange.",
    specs: [["CFM", "600"], ["Choke", "Manual"], ["Flange", "Square bore"], ["Finish", "Satin"]],
    cats: ["carburettors"], engines: ["small-block-chevy", "ford-windsor", "mopar-la"],
    universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Requires a square-bore intake manifold flange and correct throttle/kickdown linkage for your transmission." }],
    required: ["Square-bore intake manifold", "Carburettor base gasket", "Throttle cable & return spring kit"],
    featured: true, bestSeller: true, popularity: 95, weightG: 5200,
    relations: [
      { slug: "edelbrock-performer-eps-intake-manifold-sbc", type: "FREQUENTLY_BOUGHT_TOGETHER" },
      { slug: "mastodon-throttle-return-springs-bracket-kit", type: "REQUIRED", note: "A positive throttle return is essential with a new carburettor installation." },
      { slug: "holley-carburettor-service-renew-kit", type: "RELATED" },
    ],
  },
  {
    slug: "holley-classic-carburetor-750cfm",
    name: "Holley Classic Carburettor 750 CFM",
    sku: "HLY-0-3310S", brand: "holley", priceR: 11499, qty: 2,
    short: "The legendary 750 CFM vacuum-secondary four-barrel for healthy street and strip V8s.",
    desc: "Holley's 750 CFM classic with vacuum secondaries and single fuel inlet. A proven match for warmed-over small blocks and mild big blocks that need more airflow than a 600 can supply.",
    specs: [["CFM", "750"], ["Secondaries", "Vacuum"], ["Choke", "Electric"], ["Flange", "Square bore"]],
    cats: ["carburettors"], engines: ["small-block-chevy", "big-block-chevy", "ford-windsor", "mopar-b-rb"],
    universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Best suited to engines of 350 cu in and larger, or high-RPM smaller engines. Square-bore flange required." }],
    required: ["Square-bore intake manifold", "Carburettor base gasket"],
    bestSeller: true, popularity: 88, weightG: 5500,
    relations: [{ slug: "holley-carburettor-service-renew-kit", type: "CROSS_SELL" }],
  },
  {
    slug: "holley-street-warrior-600-cfm-manual",
    name: "Holley Street Warrior Carburettor 600 CFM Manual Choke",
    sku: "HLY-0-80457S", brand: "holley", priceR: 9899, qty: 3,
    short: "Entry-level Holley four-barrel tuned for street drivability.",
    desc: "The Street Warrior 600 CFM is a factory-calibrated street carburettor with vacuum secondaries — a straightforward bolt-on for stock to mildly modified V8s.",
    specs: [["CFM", "600"], ["Secondaries", "Vacuum"], ["Choke", "Manual"]],
    cats: ["carburettors"], engines: ["small-block-chevy", "ford-windsor"],
    universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Square-bore flange required." }],
    popularity: 61, weightG: 5400,
  },
  {
    slug: "holley-carburettor-service-renew-kit",
    name: "Holley Carburettor Service Parts Renew Kit",
    sku: "HLY-37-119", brand: "holley", priceR: 1499, qty: 12,
    short: "Gaskets, needle & seat, power valve and pump diaphragm to freshen a Holley four-barrel.",
    desc: "Complete renew kit for popular Holley four-barrel models. Includes the gaskets and wear parts needed for a full service.",
    cats: ["carburettors"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Verify your carburettor list number against the kit application table before ordering." }],
    popularity: 40, weightG: 500,
  },
  {
    slug: "mastodon-throttle-return-springs-bracket-kit",
    name: "Mastodon Throttle Return Springs & Bracket Kit",
    sku: "MAS-TRS-01", brand: "mastodon", priceR: 449, qty: 25,
    short: "Dual-spring throttle return kit with mounting bracket — a must with any carburettor swap.",
    desc: "Workshop-assembled dual throttle return spring kit with plated bracket. Positive throttle return is a safety essential on every carburetted build.",
    cats: ["air-fuel-delivery"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Universal fit; bracket may need slotting on some intake manifolds." }],
    bestSeller: true, popularity: 70, weightG: 150,
  },
  {
    slug: "edelbrock-performer-eps-intake-manifold-sbc",
    name: "Edelbrock Performer EPS Intake Manifold — 1955-86 Small Block Chevy",
    sku: "EDL-2701", brand: "edelbrock", priceR: 7999, qty: 3,
    short: "Dual-plane street intake for 1955-86 small-block Chevy, idle-5500 RPM power band.",
    desc: "The Performer EPS is a dual-plane, low-rise intake designed for street 262-400 cu in small-block Chevys. Excellent throttle response and torque from idle to 5500 RPM. Square-bore carburettor pad; non-EGR.",
    specs: [["Material", "Aluminium"], ["RPM range", "Idle–5500"], ["Carb pad", "Square bore"], ["EGR", "No"]],
    cats: ["intake-manifolds"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [
      { make: "chevrolet", engine: "small-block-chevy", yearFrom: 1955, yearTo: 1986, status: "CONFIRMED", notes: "Fits 1955-86 SBC with standard (non-Vortec) head bolt pattern. Will not fit Vortec heads or LT1/LT4." },
    ],
    required: ["Intake manifold gasket set", "Thermostat housing gasket"],
    featured: true, popularity: 82, weightG: 9800,
    relations: [
      { slug: "fel-pro-intake-gasket-set-sbc", type: "REQUIRED" },
      { slug: "arp-intake-manifold-bolt-kit-sbc", type: "RECOMMENDED" },
    ],
  },
  {
    slug: "holley-mechanical-fuel-pump-sbc-110gph",
    name: "Holley Mechanical Fuel Pump 110 GPH — Small Block Chevy",
    sku: "HLY-12-834", brand: "holley", priceR: 2799, qty: 6,
    short: "High-volume mechanical pump for carburetted small-block Chevys.",
    desc: "110 GPH mechanical fuel pump for small-block Chevy. Supports healthy street engines while retaining the stock pushrod actuation.",
    specs: [["Flow", "110 GPH"], ["Pressure", "6.5-8 PSI"]],
    cats: ["fuel-pumps"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Fits SBC engines with mechanical fuel pump boss and pushrod." }],
    popularity: 45, weightG: 1600,
  },
  {
    slug: "edelbrock-pro-flo-air-cleaner-14",
    name: "Edelbrock Pro-Flo 14\" Round Air Cleaner",
    sku: "EDL-1207", brand: "edelbrock", priceR: 1899, qty: 8,
    short: "14-inch chrome air cleaner with paper element for four-barrel carburettors.",
    desc: "Classic 14-inch round air cleaner with a 5-1/8\" neck to suit common four-barrel carburettors. Check bonnet clearance on low-profile engine bays.",
    cats: ["air-cleaners"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "5-1/8\" carburettor neck required; verify bonnet clearance." }],
    popularity: 35, weightG: 1900,
  },

  // ---- Engines & components ----
  {
    slug: "comp-cams-xtreme-energy-xe268h-sbc",
    name: "COMP Cams Xtreme Energy XE268H Hydraulic Flat Tappet Cam — SBC",
    sku: "CCA-12-242-2", brand: "comp-cams", priceR: 4299, qty: 5,
    short: "Popular street performance cam for small-block Chevy: strong mid-range, noticeable idle.",
    desc: "The XE268H delivers a strong 1500-5500 RPM power band with a performance idle. A favourite for 350 street builds with a four-barrel, headers and 2500+ stall or manual box.",
    specs: [["Duration @ .050\"", "224/230"], ["Lift", ".477/.480\""], ["LSA", "110°"], ["RPM range", "1500-5500"]],
    cats: ["camshafts-valvetrain"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Fits 1955-98 SBC (not LT1/LS). Flat-tappet: use new lifters and break-in oil." }],
    required: ["New hydraulic flat tappet lifters", "Valve springs matched to cam", "Break-in oil with ZDDP", "Timing set"],
    installNotes: "Never re-use old lifters on a new flat-tappet cam. Follow the 20-minute 2000-2500 RPM break-in procedure with high-zinc oil.",
    featured: true, popularity: 77, weightG: 4200,
    relations: [
      { slug: "comp-cams-lifters-sbc-hydraulic", type: "REQUIRED" },
      { slug: "comp-cams-valve-springs-981", type: "REQUIRED" },
      { slug: "enginetech-timing-set-sbc", type: "RECOMMENDED" },
    ],
  },
  {
    slug: "comp-cams-lifters-sbc-hydraulic",
    name: "COMP Cams Hydraulic Flat Tappet Lifters — SBC (Set of 16)",
    sku: "CCA-812-16", brand: "comp-cams", priceR: 2399, qty: 9,
    short: "Matched lifter set for hydraulic flat-tappet camshafts.",
    desc: "Set of 16 hydraulic flat tappet lifters. Mandatory with any new flat-tappet camshaft installation.",
    cats: ["camshafts-valvetrain"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED" }],
    popularity: 50, weightG: 1800,
  },
  {
    slug: "comp-cams-valve-springs-981",
    name: "COMP Cams Single Valve Springs (Set of 16)",
    sku: "CCA-981-16", brand: "comp-cams", priceR: 1999, qty: 7,
    short: "Single springs with damper for mild street hydraulic cams.",
    desc: "Single valve springs with flat damper suited to mild hydraulic flat-tappet street camshafts. Confirm installed height and pressure against your cam card.",
    cats: ["camshafts-valvetrain"], universal: true, fitmentCheck: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Must be matched to the camshaft specification — check the cam card or ask our specialists." }],
    popularity: 33, weightG: 1400,
  },
  {
    slug: "enginetech-rebuild-kit-chevy-350",
    name: "Enginetech Engine Rebuild Kit — Chevrolet 350 (1969-85)",
    sku: "ENT-RCM350A", brand: "enginetech", priceR: 12999, qty: 2,
    short: "Complete rebuild kit for the 1969-85 Chevy 350: pistons, rings, bearings, gaskets, oil pump and timing set.",
    desc: "Everything needed to refresh a standard 350: cast pistons, moly rings, main/rod/cam bearings, full gasket set, oil pump, timing set and core plugs. Specify bore/journal sizes when ordering.",
    cats: ["rebuild-kits"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", yearFrom: 1969, yearTo: 1985, status: "CONFIRMED", notes: "For 2-piece rear main seal 350 blocks. Machine shop verification of sizes required." }],
    included: ["Pistons (8)", "Ring set", "Main bearings", "Rod bearings", "Cam bearings", "Full gasket set", "Oil pump", "Timing set", "Core plugs"],
    featured: true, popularity: 65, weightG: 22000,
  },
  {
    slug: "enginetech-timing-set-sbc",
    name: "Enginetech Timing Chain Set — SBC",
    sku: "ENT-TS350", brand: "enginetech", priceR: 899, qty: 14,
    short: "Replacement timing chain and gear set for small-block Chevy.",
    desc: "Standard-replacement timing set for SBC. Upgrade recommended with any camshaft change.",
    cats: ["pistons-rotating"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED" }],
    popularity: 28, weightG: 1500,
  },
  {
    slug: "ford-racing-crate-engine-302-340hp",
    name: "Ford Racing 302 Crate Engine — 340 HP",
    sku: "FRP-M-6007-X302", brand: "ford-racing", priceR: 189999, stock: "BACKORDER",
    short: "Turn-key 302 cu in small-block Ford crate engine rated at 340 HP.",
    desc: "A fully assembled 302 Windsor-based crate engine for street use. Aluminium heads, hydraulic roller cam, dual-plane intake. The fastest route to a strong, reliable small-block Ford.",
    specs: [["Displacement", "302 cu in (4.9 L)"], ["Power", "340 HP"], ["Cam", "Hydraulic roller"], ["Compression", "9.0:1 (premium pump fuel)"]],
    cats: ["crate-engines"], engines: ["ford-windsor"],
    fitmentCheck: true,
    fitments: [
      { make: "ford", engine: "ford-windsor", status: "POTENTIAL", notes: "Physical fitment depends on chassis, headers, sump and transmission — confirm with our workshop before ordering." },
    ],
    featured: true, popularity: 59, weightG: 200000,
  },
  {
    slug: "speedmaster-aluminium-cylinder-heads-sbc-190cc",
    name: "Speedmaster Aluminium Cylinder Heads — SBC 190cc (Pair)",
    sku: "SPM-PCE281-2011", brand: "speedmaster", priceR: 24999, qty: 2,
    short: "Assembled aluminium heads for small-block Chevy: 190cc runners, 64cc chambers.",
    desc: "Pair of assembled aluminium cylinder heads for SBC with 190cc intake runners, 64cc chambers, 2.02/1.60 valves. A significant airflow upgrade over stock iron heads for street/strip 350-383 builds.",
    specs: [["Runner", "190cc"], ["Chamber", "64cc"], ["Valves", "2.02\"/1.60\""]],
    cats: ["cylinder-heads"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Standard SBC bolt pattern; verify piston-to-valve clearance with performance camshafts." }],
    required: ["Head gaskets", "Head bolts or studs", "Pushrods (length check)"],
    popularity: 42, weightG: 24000,
    relations: [
      { slug: "fel-pro-head-gasket-set-sbc", type: "REQUIRED" },
      { slug: "arp-head-bolt-kit-sbc", type: "REQUIRED" },
    ],
  },

  // ---- Fasteners ----
  {
    slug: "arp-head-bolt-kit-sbc",
    name: "ARP High Performance Head Bolt Kit — SBC",
    sku: "ARP-134-3601", brand: "arp", priceR: 2899, qty: 10,
    short: "8740 chromoly head bolts for small-block Chevy with standard heads.",
    desc: "ARP High Performance series head bolt kit for SBC. 8740 chromoly, 190,000 PSI, with hardened washers. Torque to specification with ARP Ultra-Torque lubricant.",
    cats: ["fasteners-hardware"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "For OEM and most aftermarket heads using stock bolt pattern." }],
    bestSeller: true, popularity: 55, weightG: 2100,
  },
  {
    slug: "arp-intake-manifold-bolt-kit-sbc",
    name: "ARP Intake Manifold Bolt Kit — SBC",
    sku: "ARP-134-2001", brand: "arp", priceR: 799, qty: 15,
    short: "Chromoly intake bolts with hex heads for small-block Chevy.",
    desc: "Stainless or chromoly intake manifold bolt kit for SBC — the clean, strong way to finish an intake installation.",
    cats: ["fasteners-hardware"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED" }],
    popularity: 22, weightG: 500,
  },
  {
    slug: "arp-rod-bolt-kit-ford-302",
    name: "ARP Rod Bolt Kit — Ford 289/302",
    sku: "ARP-154-6002", brand: "arp", priceR: 1999, qty: 6,
    short: "High-strength rod bolts for Ford 289/302 connecting rods.",
    desc: "ARP 8740 rod bolts for Ford small-block 289/302 rods. Essential insurance on any rebuild that will see sustained RPM.",
    cats: ["fasteners-hardware"], engines: ["ford-windsor"],
    fitments: [{ make: "ford", engine: "ford-windsor", status: "CONFIRMED", notes: "For OEM 289/302 rods; resizing recommended after installation." }],
    popularity: 25, weightG: 600,
  },

  // ---- Gaskets ----
  {
    slug: "fel-pro-head-gasket-set-sbc",
    name: "Fel-Pro Head Gasket Set — SBC",
    sku: "FEL-HS8548PT", brand: "fel-pro", priceR: 2299, qty: 8,
    short: "PermaTorque head gasket set for small-block Chevy.",
    desc: "Fel-Pro PermaTorque head set for SBC including head gaskets and upper-end sealing components.",
    cats: ["gaskets-seals"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Verify bore size and application year." }],
    popularity: 38, weightG: 1200,
  },
  {
    slug: "fel-pro-intake-gasket-set-sbc",
    name: "Fel-Pro Intake Manifold Gasket Set — SBC",
    sku: "FEL-1256", brand: "fel-pro", priceR: 649, qty: 20,
    short: "Printoseal intake gaskets for 1955-86 small-block Chevy.",
    desc: "Fel-Pro Printoseal intake gasket set for standard-port SBC heads.",
    cats: ["gaskets-seals"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", yearFrom: 1955, yearTo: 1986, status: "CONFIRMED" }],
    popularity: 30, weightG: 400,
  },
  {
    slug: "fel-pro-oil-pan-gasket-ford-302",
    name: "Fel-Pro Oil Pan Gasket — Ford 289/302",
    sku: "FEL-OS34510T", brand: "fel-pro", priceR: 899, qty: 11,
    short: "One-piece oil pan gasket for small-block Ford.",
    desc: "One-piece moulded rubber pan gasket for Ford 289/302 — far easier to seal than the old four-piece design.",
    cats: ["gaskets-seals"], engines: ["ford-windsor"],
    fitments: [{ make: "ford", engine: "ford-windsor", status: "CONFIRMED" }],
    popularity: 27, weightG: 350,
  },

  // ---- Ignition ----
  {
    slug: "msd-pro-billet-distributor-sbc",
    name: "MSD Pro-Billet Distributor — SBC",
    sku: "MSD-8360", brand: "msd", priceR: 8499, qty: 3,
    short: "CNC-machined billet distributor with mechanical advance for small-block Chevy.",
    desc: "MSD Pro-Billet distributor for SBC with adjustable mechanical advance and maintenance-free magnetic pickup. Pair with an MSD 6-series box for the full benefit.",
    cats: ["distributors"], engines: ["small-block-chevy", "big-block-chevy"],
    fitments: [{ make: "chevrolet", status: "CONFIRMED", notes: "Fits SBC and BBC with conventional distributor location." }],
    popularity: 48, weightG: 2300,
    relations: [{ slug: "msd-6al-ignition-box", type: "FREQUENTLY_BOUGHT_TOGETHER" }],
  },
  {
    slug: "msd-6al-ignition-box",
    name: "MSD 6AL Ignition Control Box with Rev Limiter",
    sku: "MSD-6425", brand: "msd", priceR: 7299, qty: 4,
    short: "Multiple-spark CD ignition box with built-in soft-touch rev limiter.",
    desc: "The classic MSD 6AL capacitive-discharge ignition delivers multiple sparks below 3000 RPM and includes a built-in rev limiter. Works with points, magnetic pickup or amplifier triggers.",
    cats: ["ignition-boxes"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "12V negative-earth vehicles. Requires compatible coil (use with MSD Blaster series)." }],
    popularity: 52, weightG: 1700,
  },
  {
    slug: "mastodon-battery-cable-kit",
    name: "Mastodon Heavy-Duty Battery Cable Kit",
    sku: "MAS-BCK-01", brand: "mastodon", priceR: 1299, qty: 18,
    short: "Workshop-grade battery and earth cable kit for classic V8 installations.",
    desc: "Heavy-gauge copper battery cable kit with soldered lugs, sized for high-compression V8 starters. Includes engine and body earth straps.",
    cats: ["wiring"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Universal; confirm cable lengths for boot-mounted batteries." }],
    popularity: 20, weightG: 2500,
  },

  // ---- Transmission ----
  {
    slug: "lokar-shifter-th350-8-inch",
    name: "Lokar 8\" Shifter — TH350/TH400",
    sku: "LOK-ATS6350A8", brand: "lokar", priceR: 6499, qty: 3,
    short: "Billet aluminium floor shifter for GM TH350/TH400 automatics.",
    desc: "Lokar's classic 8-inch single-bend billet shifter for TH350/TH400. Smooth detent action and a clean look for street rods and muscle cars.",
    cats: ["shifters"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", status: "CONFIRMED", notes: "For GM TH350/TH400 transmissions regardless of body; floor mounting required." }],
    popularity: 34, weightG: 2800,
  },
  {
    slug: "lokar-kickdown-cable-th350",
    name: "Lokar Kickdown Cable Kit — TH350",
    sku: "LOK-KD-2350U", brand: "lokar", priceR: 1799, qty: 6,
    short: "Universal stainless kickdown cable for TH350 automatics.",
    desc: "Braided stainless kickdown cable kit for TH350 with carburettor bracket hardware. Correct kickdown geometry protects the transmission under load.",
    cats: ["transmission-drivetrain"],
    fitments: [{ make: "chevrolet", status: "CONFIRMED", notes: "TH350 transmissions with Holley/Edelbrock style carburettor linkage." }],
    popularity: 18, weightG: 700,
  },

  // ---- Cooling ----
  {
    slug: "mastodon-aluminium-radiator-sbc-3-row",
    name: "Mastodon 3-Row Aluminium Radiator — Chevrolet V8",
    sku: "MAS-RAD-350", brand: "mastodon", priceR: 5999, qty: 5,
    short: "Triple-row aluminium radiator sized for small-block and mild big-block Chevys in South African conditions.",
    desc: "All-aluminium 3-row crossflow radiator built for hot Highveld traffic. Fits common 1960s-70s GM A/F/X-body core supports; check dimensions in the specs before ordering.",
    specs: [["Core", "3-row aluminium"], ["Outlets", "1.75\" / 1.5\""], ["Core size", "660 x 440 mm"]],
    cats: ["radiators"], engines: ["small-block-chevy", "big-block-chevy"],
    fitmentCheck: true,
    fitments: [
      { make: "chevrolet", model: "camaro-1967-1981", yearFrom: 1967, yearTo: 1969, status: "CONFIRMED" },
      { make: "chevrolet", model: "chevelle-1964-1977", yearFrom: 1964, yearTo: 1972, status: "CONFIRMED" },
      { make: "chevrolet", model: "nova-1962-1979", status: "POTENTIAL", notes: "Core support varies by year — measure before ordering." },
    ],
    featured: true, popularity: 57, weightG: 7800,
    relations: [{ slug: "mastodon-16-inch-electric-fan", type: "FREQUENTLY_BOUGHT_TOGETHER" }],
  },
  {
    slug: "mastodon-16-inch-electric-fan",
    name: "Mastodon 16\" Electric Fan & Relay Kit",
    sku: "MAS-FAN-16", brand: "mastodon", priceR: 2499, qty: 10,
    short: "16-inch puller fan with wiring relay kit and thermo switch.",
    desc: "High-flow 16\" electric puller fan with complete relay wiring kit and adjustable thermostatic switch.",
    cats: ["fans"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Requires 40A circuit and at least 90mm clearance between radiator and engine." }],
    popularity: 41, weightG: 3200,
  },
  {
    slug: "edelbrock-water-pump-sbc-short",
    name: "Edelbrock Victor Series Water Pump — SBC Short",
    sku: "EDL-8810", brand: "edelbrock", priceR: 4599, qty: 4,
    short: "High-flow aluminium water pump for short water pump small-block Chevys.",
    desc: "Victor Series aluminium water pump for SBC short-pump applications. High-flow impeller reduces cavitation at sustained RPM.",
    cats: ["water-pumps"], engines: ["small-block-chevy"],
    fitmentCheck: true,
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Short water pump configuration only — verify pulley alignment." }],
    popularity: 29, weightG: 4900,
  },

  // ---- Brakes ----
  {
    slug: "mastodon-front-disc-conversion-mustang-64-73",
    name: "Mastodon Front Disc Brake Conversion Kit — 1964-73 Mustang",
    sku: "MAS-DBK-M6473", brand: "mastodon", priceR: 18999, qty: 2,
    short: "Complete front drum-to-disc conversion for 1964-73 Mustangs: rotors, calipers, spindle hardware, hoses and master cylinder.",
    desc: "Everything required to convert a drum-brake 1964-73 Mustang front end to modern disc braking: 11\" vented rotors, single-piston calipers, bearings, seals, braided hoses, dual-circuit master cylinder and proportioning valve. Assembled and checked by our workshop.",
    cats: ["disc-conversion-kits"],
    fitmentCheck: true, safety: true,
    fitments: [
      { make: "ford", model: "mustang-1964-1973", yearFrom: 1964, yearTo: 1973, status: "CONFIRMED", notes: "V8-spindle cars. 14\" wheels may not clear the calipers — 15\" minimum recommended." },
    ],
    included: ["Vented rotors (pair)", "Calipers with pads", "Bearings & seals", "Braided hoses", "Dual-circuit master cylinder", "Proportioning valve", "Hardware"],
    required: ["Brake fluid DOT 4", "Professional bleeding and inspection before road use"],
    installNotes: "Braking systems are safety-critical. We strongly recommend installation or final inspection by a qualified technician.",
    featured: true, bestSeller: true, popularity: 74, weightG: 32000,
    relations: [{ slug: "ap-racing-brake-pads-street", type: "CROSS_SELL" }],
  },
  {
    slug: "ap-racing-brake-pads-street",
    name: "AP Racing Street Performance Brake Pads",
    sku: "APR-LD20", brand: "ap-racing", priceR: 3499, qty: 6,
    short: "Fast-bedding street compound pads for common muscle-car caliper patterns.",
    desc: "AP Racing street compound pads offering strong cold bite and fade resistance. Multiple caliper shapes available — confirm your caliper type when ordering.",
    cats: ["calipers-pads"], universal: false, fitmentCheck: true, safety: true,
    fitments: [{ status: "POTENTIAL", notes: "Pad shape must be matched to your caliper — send us your caliper details for confirmation." }],
    popularity: 26, weightG: 1800,
  },
  {
    slug: "mastodon-brake-booster-master-combo-9",
    name: "Mastodon 9\" Brake Booster & Dual Master Cylinder Combo",
    sku: "MAS-BBM-09", brand: "mastodon", priceR: 6999, qty: 4,
    short: "9-inch vacuum booster with dual-circuit master cylinder for disc/drum setups.",
    desc: "Single-diaphragm 9\" booster paired with a dual-circuit master cylinder, suitable for disc/drum conversions on most 1960s American platforms.",
    cats: ["boosters-masters"], fitmentCheck: true, safety: true,
    fitments: [{ status: "POTENTIAL", notes: "Firewall pattern and pushrod length vary — verification needed for your platform." }],
    popularity: 31, weightG: 5600,
  },

  // ---- Suspension / steering ----
  {
    slug: "moog-upper-control-arm-camaro-67-69",
    name: "Moog Upper Control Arm — 1967-69 Camaro (Each)",
    sku: "MOOG-K6100", brand: "moog", priceR: 4299, qty: 4,
    short: "Assembled upper control arm with ball joint and bushings for first-gen Camaro.",
    desc: "Moog problem-solver upper control arm for 1967-69 Camaro and 1968-74 Nova, assembled with ball joint and bushings.",
    cats: ["control-arms"], fitmentCheck: true, safety: true,
    fitments: [
      { make: "chevrolet", model: "camaro-1967-1981", yearFrom: 1967, yearTo: 1969, status: "CONFIRMED" },
      { make: "chevrolet", model: "nova-1962-1979", yearFrom: 1968, yearTo: 1974, status: "CONFIRMED" },
    ],
    popularity: 24, weightG: 5100,
  },
  {
    slug: "mastodon-front-coil-springs-1-inch-drop-mustang",
    name: "Mastodon 1\" Lowered Front Coil Springs — 1964-73 Mustang (Pair)",
    sku: "MAS-SPR-M100", brand: "mastodon", priceR: 3299, qty: 6,
    short: "Progressive-rate lowering springs for classic Mustang front ends.",
    desc: "Progressive-rate front coils giving approximately 1\" drop on 1964-73 Mustangs with V8 engines. Improves stance and turn-in without destroying ride quality.",
    cats: ["springs-shocks"], fitmentCheck: true,
    fitments: [{ make: "ford", model: "mustang-1964-1973", status: "CONFIRMED", notes: "V8 cars; six-cylinder cars will sit lower than 1\"." }],
    popularity: 21, weightG: 9000,
  },
  {
    slug: "moog-tie-rod-end-set-mustang",
    name: "Moog Tie Rod End Set — 1964-73 Mustang",
    sku: "MOOG-ES387RL", brand: "moog", priceR: 2599, qty: 5,
    short: "Inner and outer tie rod ends for classic Mustang manual and power steering.",
    desc: "Complete set of Moog inner and outer tie rod ends for 1964-73 Mustang. Wheel alignment required after fitting.",
    cats: ["steering"], fitmentCheck: true, safety: true,
    fitments: [{ make: "ford", model: "mustang-1964-1973", status: "CONFIRMED", notes: "Verify manual vs power steering when ordering." }],
    popularity: 19, weightG: 3400,
  },

  // ---- Exhaust ----
  {
    slug: "mastodon-long-tube-headers-sbc-camaro",
    name: "Mastodon Long Tube Headers — SBC 1967-69 Camaro",
    sku: "MAS-HDR-C6769", brand: "mastodon", priceR: 8999, qty: 3,
    short: "1-5/8\" long tube headers, ceramic coated, for first-gen Camaro with small-block.",
    desc: "Ceramic-coated 1-5/8\" primaries with 3\" collectors for 1967-69 Camaro running SBC. Significant top-end gain over cast manifolds; gaskets and bolts included.",
    cats: ["headers"], engines: ["small-block-chevy"], fitmentCheck: true,
    fitments: [{ make: "chevrolet", model: "camaro-1967-1981", yearFrom: 1967, yearTo: 1969, engine: "small-block-chevy", status: "CONFIRMED", notes: "Not compatible with factory air-conditioning compressor mounts." }],
    included: ["Headers (pair)", "Gaskets", "Bolts", "Collector reducers"],
    popularity: 36, weightG: 14000,
  },
  {
    slug: "mastodon-2-5-dual-exhaust-kit",
    name: "Mastodon 2.5\" Dual Exhaust Kit with Mufflers",
    sku: "MAS-EXH-25D", brand: "mastodon", priceR: 7499, qty: 4,
    short: "Aluminised 2.5\" dual system with turbo-style mufflers — universal muscle car fit.",
    desc: "Universal 2.5\" mandrel-bent dual exhaust kit with turbo mufflers and clamps. Requires cutting and welding to suit your chassis.",
    cats: ["mufflers"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Professional fitting required; sold as a builder's kit." }],
    popularity: 23, weightG: 18000,
  },

  // ---- Body ----
  {
    slug: "dynacorn-mustang-fastback-body-shell-67-68",
    name: "Dynacorn 1967-68 Mustang Fastback Body Shell",
    sku: "DYN-M67FB", brand: "dynacorn", priceR: 549999, stock: "BACKORDER",
    short: "Brand-new fully licensed reproduction 1967-68 Mustang fastback body shell.",
    desc: "A complete, brand-new 1967-68 Mustang fastback body shell, fully licensed and built to original specifications with modern manufacturing quality. The ultimate starting point for a dream build — no rust, no filler, no surprises. Lead time applies; contact us to discuss your project.",
    cats: ["body-shells"],
    fitments: [{ make: "ford", model: "mustang-1964-1973", yearFrom: 1967, yearTo: 1968, status: "CONFIRMED", notes: "Reproduction shell accepting 1967-68 Mustang running gear and trim." }],
    featured: true, popularity: 68, weightG: 350000,
  },
  {
    slug: "mastodon-camaro-front-spoiler-67-69",
    name: "Front Spoiler — 1967-69 Camaro",
    sku: "MAS-SPL-C001", brand: "mastodon", priceR: 1899, qty: 7,
    short: "Reproduction three-piece front spoiler for first-generation Camaro.",
    desc: "ABS reproduction of the factory-style front spoiler for 1967-69 Camaro, supplied with fitting hardware.",
    cats: ["panels"], fitmentCheck: true,
    fitments: [{ make: "chevrolet", model: "camaro-1967-1981", yearFrom: 1967, yearTo: 1969, status: "CONFIRMED" }],
    popularity: 15, weightG: 2400,
  },

  // ---- Interior / gauges / lighting / wheels ----
  {
    slug: "mastodon-5-gauge-set-mechanical",
    name: "Mastodon 5-Gauge Set — Speedo, Tacho, Oil, Temp, Volts",
    sku: "MAS-GAU-5SET", brand: "mastodon", priceR: 4999, qty: 8,
    short: "Classic white-face 5-gauge set with chrome bezels and mechanical speedo.",
    desc: "Complete 5-gauge instrument set: 85mm mechanical speedometer and tachometer plus 52mm oil pressure, water temperature and voltmeter. Includes senders.",
    cats: ["gauges"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Panel cutouts 85mm/52mm; mechanical speedo cable must match your transmission." }],
    included: ["5 gauges", "Senders", "Wiring harness", "Speedo cable"],
    popularity: 32, weightG: 2600,
  },
  {
    slug: "mastodon-halogen-headlight-conversion-7",
    name: "7\" Halogen Headlight Conversion (Pair)",
    sku: "MAS-LGT-H7", brand: "mastodon", priceR: 1599, qty: 12,
    short: "H4 halogen conversion for classic 7-inch sealed-beam headlights.",
    desc: "Glass-lens H4 halogen conversion for any vehicle running 7\" round sealed beams. Big visibility upgrade; relay kit recommended.",
    cats: ["lighting"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "7\" round sealed-beam applications. Relay harness recommended to protect the light switch." }],
    popularity: 17, weightG: 1900,
  },
  {
    slug: "mastodon-steering-wheel-classic-14",
    name: "Mastodon 14\" Classic Wood-Rim Steering Wheel",
    sku: "MAS-INT-SW14", brand: "mastodon", priceR: 3499, qty: 5,
    short: "14-inch riveted wood-rim wheel with polished spokes.",
    desc: "Classic 14\" wood-rim steering wheel with brushed spokes. Requires a hub adapter for your steering column (sold separately).",
    cats: ["interior-accessories"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Requires model-specific hub adapter." }],
    popularity: 14, weightG: 2100,
  },
  {
    slug: "mastodon-15x7-steel-wheel-chevy",
    name: "15x7 Steel Wheel — Chevrolet 5x4.75\" (Each)",
    sku: "MAS-WHL-1575", brand: "mastodon", priceR: 1799, qty: 16,
    short: "Powder-coated 15x7 steel wheel in the classic Chevrolet 5x4.75\" pattern.",
    desc: "15x7 steel wheel with 5x4.75\" (5x120.65) bolt pattern and 4\" backspace, suiting most classic GM passenger cars.",
    cats: ["wheels-tyres"], fitmentCheck: true,
    fitments: [
      { make: "chevrolet", status: "CONFIRMED", notes: "5x4.75\" GM pattern; verify caliper clearance on disc-converted cars." },
      { make: "pontiac", status: "CONFIRMED", notes: "5x4.75\" pattern shared with GM passenger cars." },
    ],
    popularity: 16, weightG: 9500,
  },

  // ---- Mopar corner ----
  {
    slug: "edelbrock-performer-intake-mopar-340-360",
    name: "Edelbrock Performer Intake Manifold — Mopar 340/360",
    sku: "EDL-2176", brand: "edelbrock", priceR: 8499, qty: 2,
    short: "Dual-plane street intake for Mopar LA 340/360 small blocks.",
    desc: "Performer dual-plane intake for LA-series 340/360 Mopar small blocks. Idle-5500 RPM range, square-bore pad.",
    cats: ["intake-manifolds"], engines: ["mopar-la"], fitmentCheck: true,
    fitments: [{ make: "dodge", engine: "mopar-la", status: "CONFIRMED", notes: "340/360 LA engines (not 318 with early narrow ports — verify year)." }],
    popularity: 26, weightG: 9600,
  },
  {
    slug: "comp-cams-xtreme-energy-cam-mopar-440",
    name: "COMP Cams Xtreme Energy Cam — Mopar 440",
    sku: "CCA-23-223-4", brand: "comp-cams", priceR: 4799, qty: 2,
    short: "Street performance hydraulic cam for Mopar B/RB big blocks.",
    desc: "Xtreme Energy hydraulic flat-tappet camshaft for 383-440 Mopar big blocks. Strong mid-range for street Chargers and Road Runners.",
    cats: ["camshafts-valvetrain"], engines: ["mopar-b-rb"], fitmentCheck: true,
    fitments: [{ make: "dodge", engine: "mopar-b-rb", status: "CONFIRMED", notes: "New lifters and break-in procedure required." },
               { make: "plymouth", engine: "mopar-b-rb", status: "CONFIRMED" }],
    required: ["New lifters", "Matched valve springs", "Break-in oil"],
    popularity: 22, weightG: 4600,
  },
  {
    slug: "mastodon-radiator-mopar-b-body-26",
    name: "Mastodon 26\" Aluminium Radiator — Mopar B-Body",
    sku: "MAS-RAD-MB26", brand: "mastodon", priceR: 6499, qty: 3,
    short: "26-inch aluminium radiator for 1966-74 Mopar B-body big-block applications.",
    desc: "Direct-fit 26\" aluminium crossflow radiator for big-block 1966-74 Mopar B-bodies (Charger, Road Runner).",
    cats: ["radiators"], engines: ["mopar-b-rb"], fitmentCheck: true,
    fitments: [
      { make: "dodge", model: "charger-1966-1974", status: "CONFIRMED", notes: "26\" core support cars." },
      { make: "plymouth", model: "road-runner-1968-1975", yearFrom: 1968, yearTo: 1974, status: "CONFIRMED" },
    ],
    popularity: 20, weightG: 8200,
  },

  // ---- Ford extras ----
  {
    slug: "edelbrock-performer-289-intake",
    name: "Edelbrock Performer 289 Intake Manifold — Ford 260/289/302",
    sku: "EDL-2121", brand: "edelbrock", priceR: 7899, qty: 3,
    short: "Dual-plane street intake for small-block Ford 260/289/302.",
    desc: "The Performer 289 is the go-to dual-plane street intake for Ford 260/289/302 (non-Boss). Idle-5500 RPM, square-bore pad, non-EGR.",
    cats: ["intake-manifolds"], engines: ["ford-windsor"], fitmentCheck: true,
    fitments: [{ make: "ford", engine: "ford-windsor", status: "CONFIRMED", notes: "260/289/302 heads; not for 351W without spacers (verify port match)." }],
    popularity: 44, weightG: 9400,
    relations: [{ slug: "edelbrock-performer-carburetor-600-cfm-manual-choke", type: "FREQUENTLY_BOUGHT_TOGETHER" }],
  },
  {
    slug: "mastodon-front-disc-conversion-f100-65-72",
    name: "Mastodon Front Disc Brake Conversion — 1965-72 Ford F-100",
    sku: "MAS-DBK-F100", brand: "mastodon", priceR: 21999, qty: 1,
    short: "Drum-to-disc front conversion kit for 1965-72 F-100 pickups.",
    desc: "Complete front disc conversion for 1965-72 Ford F-100 2WD: rotors, calipers, brackets, bearings, hoses and dual master cylinder.",
    cats: ["disc-conversion-kits"], fitmentCheck: true, safety: true,
    fitments: [{ make: "ford", model: "f-100-1953-1979", yearFrom: 1965, yearTo: 1972, status: "CONFIRMED", notes: "2WD models only. 15\" wheels minimum." }],
    included: ["Rotors", "Calipers", "Brackets", "Bearings & seals", "Hoses", "Dual master cylinder"],
    popularity: 28, weightG: 34000,
  },
  {
    slug: "ford-racing-valve-covers-302",
    name: "Ford Racing Die-Cast Valve Covers — Small Block Ford",
    sku: "FRP-M-6582-A302", brand: "ford-racing", priceR: 3999, qty: 6,
    short: "Black-crinkle die-cast valve covers with Ford Racing lettering.",
    desc: "Die-cast aluminium valve covers for 289/302/351W with baffles and gasket rails. Clearance for most roller rockers.",
    cats: ["engines-components"], engines: ["ford-windsor"],
    fitments: [{ make: "ford", engine: "ford-windsor", status: "CONFIRMED" }],
    popularity: 25, weightG: 4100,
  },
  {
    slug: "speedmaster-electric-fuel-pump-140gph",
    name: "Speedmaster 140 GPH Electric Fuel Pump",
    sku: "SPM-PCE143-1001", brand: "speedmaster", priceR: 3299, qty: 5,
    short: "Inline electric fuel pump for carburetted performance engines.",
    desc: "140 GPH free-flow electric pump for carburetted applications. Use with a regulator set to 6-7 PSI and a return-style or dead-head layout appropriate to your carburettor.",
    cats: ["fuel-pumps"], universal: true, safety: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Requires pressure regulator, correct fuel line sizing, and safe mounting away from heat. Fuel systems are safety-critical — ask us to review your layout." }],
    required: ["Fuel pressure regulator", "Fuel line & fittings", "Relay wiring kit"],
    popularity: 30, weightG: 2200,
  },
  {
    slug: "mastodon-engine-dress-up-kit-sbc-chrome",
    name: "Mastodon Engine Dress-Up Kit — SBC Chrome",
    sku: "MAS-DRS-SBC", brand: "mastodon", priceR: 2799, qty: 9,
    short: "Chrome valve covers, air cleaner, breathers and timing cover for SBC.",
    desc: "Complete chrome dress-up package for short water pump small-block Chevys: tall valve covers, 14\" air cleaner, breathers, wing bolts and timing cover.",
    cats: ["engines-components"], engines: ["small-block-chevy"],
    fitments: [{ make: "chevrolet", engine: "small-block-chevy", status: "CONFIRMED", notes: "Tall covers may foul some brake boosters — check clearance." }],
    included: ["Valve covers", "Air cleaner", "Breathers (2)", "Timing cover", "Wing bolts"],
    popularity: 37, weightG: 6800,
  },
  {
    slug: "enginetech-rebuild-kit-ford-302",
    name: "Enginetech Engine Rebuild Kit — Ford 302 (1968-82)",
    sku: "ENT-RCF302A", brand: "enginetech", priceR: 13999, qty: 2,
    short: "Complete rebuild kit for 1968-82 Ford 302: pistons, rings, bearings, gaskets, oil pump, timing set.",
    desc: "Master rebuild kit for the 1968-82 Ford 302 with cast pistons, moly rings, bearings, full gasket set, oil pump and timing set. Specify machine sizes at order time.",
    cats: ["rebuild-kits"], engines: ["ford-windsor"], fitmentCheck: true,
    fitments: [{ make: "ford", engine: "ford-windsor", yearFrom: 1968, yearTo: 1982, status: "CONFIRMED", notes: "Carburetted 302 (not HO roller blocks)." }],
    included: ["Pistons (8)", "Rings", "Main & rod bearings", "Cam bearings", "Full gasket set", "Oil pump", "Timing set", "Core plugs"],
    popularity: 47, weightG: 21000,
  },
  {
    slug: "lokar-throttle-cable-ford-universal",
    name: "Lokar Universal Throttle Cable — Black Stainless",
    sku: "LOK-TC-1000U", brand: "lokar", priceR: 1299, qty: 10,
    short: "Cut-to-length braided stainless throttle cable for carburettor swaps.",
    desc: "Lokar's universal 24\" cut-to-length throttle cable in black braided stainless. Cleans up any carburettor conversion.",
    cats: ["air-fuel-delivery"], universal: true,
    fitments: [{ status: "UNIVERSAL_WITH_REQUIREMENTS", notes: "Requires matching throttle pedal or adapter." }],
    popularity: 19, weightG: 400,
  },
  {
    slug: "ap-racing-4-piston-caliper-kit-front",
    name: "AP Racing 4-Piston Front Caliper Big Brake Kit",
    sku: "APR-CP7600-KIT", brand: "ap-racing", priceR: 64999, stock: "BACKORDER",
    short: "Serious stopping power: 4-piston AP Racing calipers with 330mm discs for pro-touring builds.",
    desc: "AP Racing 4-piston caliper kit with 330mm two-piece discs, pads and braided lines for pro-touring muscle car builds running 17\"+ wheels. Bracket applications vary — our workshop will confirm fitment for your spindle and wheel package before we accept the order.",
    cats: ["calipers-pads"], fitmentCheck: true, safety: true,
    fitments: [{ status: "POTENTIAL", notes: "Application-specific brackets required. Orders are confirmed only after our workshop verifies spindle, wheel and master cylinder compatibility." }],
    required: ["Verification of spindle & wheel fitment", "Compatible master cylinder & proportioning"],
    popularity: 39, weightG: 26000,
  },
];

export const articles = [
  {
    slug: "choosing-the-right-carburettor-size",
    title: "Choosing the Right Carburettor Size for Your V8",
    category: "Air & Fuel",
    excerpt: "Bigger is not better. How to size a carburettor to your engine's displacement, RPM range and use.",
    body: `A carburettor that is too large is the most common self-inflicted drivability problem we see in the workshop. The engine only needs as much airflow as its displacement and RPM can consume.\n\n## The basic formula\n\nCFM = (Displacement in cubic inches × Maximum RPM) ÷ 3456, multiplied by volumetric efficiency (about 0.85 for a healthy street engine).\n\nA 350 that revs to 5500 RPM needs roughly (350 × 5500 ÷ 3456) × 0.85 ≈ **475 CFM**. That is why a 600 CFM carburettor is the right call for most street small blocks — and why the 750 belongs on 383s, big blocks and engines that genuinely rev.\n\n## Vacuum vs mechanical secondaries\n\nVacuum secondaries open when the engine actually demands the airflow, which makes them forgiving on heavy cars, automatics and street tyres. Mechanical secondaries suit lighter cars, manual gearboxes and drivers who want instant response and will accept the fuel bill.\n\n## What we recommend\n\n- Stock to mild 302/350 street engine: 600 CFM vacuum secondary\n- Warm 350/383 with gears and stall: 650-750 CFM\n- Big block street: 750 CFM\n\nIf you are between sizes, go smaller. The seat-of-the-pants difference is throttle response, and the smaller carburettor wins that every time.\n\n*Ask our AI specialist or WhatsApp the workshop if you want a recommendation for your exact combination.*`,
  },
  {
    slug: "sbc-vs-bbc-how-to-identify",
    title: "Small Block vs Big Block Chevy: How to Identify What You Have",
    category: "Engines",
    excerpt: "Casting numbers, valve cover bolts and other quick ways to tell SBC from BBC — and why it matters when ordering parts.",
    body: `Before ordering engine parts, be certain which family you have. "It's a 350" is said about a lot of engines that turn out to be 305s, 327s or even 400s.\n\n## Quick visual checks\n\n- **Valve covers:** Small blocks (pre-Vortec) use covers held by bolts around the perimeter; big blocks use wider covers on taller heads.\n- **Physical size:** A big block is visibly wider and taller. Between the exhaust manifolds an SBC measures roughly 640mm; a BBC well over 700mm.\n- **Distributor position:** both are at the rear, but the BBC's sits in a noticeably larger valley.\n\n## Casting numbers\n\nThe block casting number lives on the bellhousing flange, driver's side. Decode it before buying pistons, cams or heads — the same casting can hide different bore/stroke combinations built across decades.\n\n## Why it matters\n\nIntakes, heads, cams, water pumps, exhaust manifolds and even some gaskets do not interchange between SBC and BBC. When you shop with us, set your engine family in **My Garage** and the site will flag which parts are verified for your engine.`,
  },
  {
    slug: "ford-windsor-vs-cleveland",
    title: "Ford Windsor vs Cleveland: Know Your Small Block Before You Buy",
    category: "Engines",
    excerpt: "The 351W and 351C share a displacement and nothing else that matters for parts. Here's how to tell them apart.",
    body: `Ford built two completely different 351 small blocks, and parts do not interchange. Ordering a "351 intake" without knowing which engine you have is a coin flip you will lose.\n\n## Telling them apart\n\n- **Valve covers:** Windsor covers use 6 bolts; Cleveland covers use 8.\n- **Thermostat housing:** On a Windsor the top radiator hose meets a housing on the intake manifold. On a Cleveland it bolts straight down into the block.\n- **Heads:** Cleveland heads have big canted valves and square exhaust ports; Windsor heads are conventional inline-valve castings.\n\n## Parts implications\n\nIntakes, heads, head gaskets, cams (different firing order possibilities), water pumps and timing covers are all family-specific. The 289 and 302 share the Windsor architecture, which is why so many parts list "260/289/302" together — but a 351W is taller and wider, so even within the Windsor family, intakes differ.\n\nSet your engine family in **My Garage** and we will keep you honest when browsing.`,
  },
  {
    slug: "classic-mustang-brake-upgrade-guide",
    title: "Upgrading the Brakes on a Classic Mustang: A Practical Guide",
    category: "Brakes",
    excerpt: "From four-wheel drums to confident modern stopping — what actually needs to change, in what order.",
    body: `Braking is the single best-value safety upgrade on any classic. A 1966 Mustang with four-wheel drums was marginal in 1966 traffic; in modern traffic it is a hazard.\n\n## The sensible upgrade path\n\n1. **Front disc conversion.** The front axle does most of the work. A quality kit brings vented rotors, new calipers, bearings and hoses in one box.\n2. **Dual-circuit master cylinder.** Single-circuit systems lose the whole car with one leak. Convert at the same time as the discs — always.\n3. **Proportioning valve.** Disc front / drum rear needs correct front-rear balance to stop straight.\n4. **Booster (optional).** Manual discs work well with the right master cylinder bore; a 9" booster adds light-pedal comfort if the firewall and pedal geometry allow.\n5. **Rear discs (later).** Nice to have, but do fronts, master and balance first.\n\n## What to watch\n\n- **Wheel clearance:** many 14" steel wheels will not clear disc calipers. Plan on 15" minimum.\n- **Bedding in:** new pads and rotors need a proper bed-in cycle before you trust them.\n- **Professional inspection:** brakes are safety-critical. Our workshop fits and certifies every kit we sell — or inspects your own installation.\n\nEvery brake product on this site is flagged safety-critical: the AI specialist will always recommend the full supporting hardware and a professional inspection, and it is right to do so.`,
  },
  {
    slug: "cooling-system-basics-for-modified-v8s",
    title: "Cooling System Basics for Modified V8s in South African Conditions",
    category: "Cooling",
    excerpt: "Why your freshly built engine runs hot in traffic, and how to specify a cooling system that copes with the Highveld.",
    body: `More power means more heat. A cooling system that was marginal with a stock engine will boil with a warm cam and a few extra horsepower — especially in Gauteng summer traffic.\n\n## The big four\n\n1. **Radiator capacity.** Core area beats core thickness. A modern aluminium 2- or 3-row crossflow outperforms the original brass radiator it replaces.\n2. **Airflow.** A fan must pull air *through* the core at idle. A 16" electric puller with a proper shroud transforms traffic behaviour. Wire it through a relay with a thermo switch.\n3. **Water pump flow.** A quality high-flow pump reduces cavitation and keeps coolant moving at low RPM.\n4. **System pressure & recovery.** A correct cap and overflow recovery bottle raise the boiling point and keep the system full.\n\n## Rules of thumb\n\n- Run a 180°F (82°C) thermostat — removing the thermostat does not cure overheating, it usually worsens it.\n- 50/50 coolant mix; pure water corrodes aluminium components.\n- If the gauge climbs on the open road (not just traffic), suspect radiator capacity or ignition timing, not the fan.\n\nOur cooling packages pair radiator, fan, shroud and switch for common muscle platforms — or ask the AI specialist to build one for your combination.`,
  },
  {
    slug: "flat-tappet-cam-break-in",
    title: "Flat-Tappet Camshaft Break-In: Do It Right or Do It Twice",
    category: "Engines",
    excerpt: "Modern oils and old-school cams are a bad mix unless you follow the break-in procedure exactly.",
    body: `Flat-tappet camshafts still make great, affordable power — but modern low-zinc oils have made the first 20 minutes of engine life critical.\n\n## The non-negotiables\n\n1. **New lifters, always.** Never run used lifters on a new cam. Each lifter wears to its lobe.\n2. **Assembly lube on every lobe and lifter face.** Not engine oil — proper moly assembly lube.\n3. **High-zinc oil.** Use a dedicated break-in oil with ZDDP, or a quality additive.\n4. **Prime the oil system** before first start.\n5. **Start immediately and hold 2000-2500 RPM for 20 minutes.** No idling — lobe lubrication at low RPM depends on oil splash that only exists above 2000 RPM.\n6. **Vary the RPM** during the cycle; do not hold one speed.\n7. **Change oil and filter** after break-in, then again at 800 km.\n\n## Set up for success before you start\n\nHave the ignition timed to fire promptly, fuel in the carburettor bowls and the cooling system full before cranking. Long cranking sessions during break-in kill cams.\n\nWe include break-in oil with every flat-tappet cam kit we sell — the site will prompt you if it's missing from your basket.`,
  },
];

/**
 * Public business information gathered from public web sources (search results,
 * the store's public pages). See reports/source-manifest.json for attribution.
 */
export const businessInfo = {
  name: "All American Muscle (Pty) Ltd",
  tagline: "American muscle car parts, restorations and engine builds — Alberton, South Africa",
  address: "15 Tarry Road, Alrode South, Alberton, 1451, Gauteng, South Africa",
  phone: "+27 10 592 1706",
  whatsapp: "+27 72 042 6477",
  whatsappLink: "https://wa.me/27720426477",
  email: "parts@allamericanmuscle.co.za",
  facebook: "https://www.facebook.com/allamericanmusclev8/",
  tiktok: "https://www.tiktok.com/@allamericanmuscle",
  hours: [
    { days: "Monday – Friday", hours: "08:00 – 17:00" },
    { days: "Saturday", hours: "08:00 – 13:00" },
    { days: "Sunday & public holidays", hours: "Closed" },
  ],
};
