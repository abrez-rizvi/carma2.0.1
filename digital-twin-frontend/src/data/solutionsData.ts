// Solutions Catalog Data
// Each solution maps to a predefined policy for the simulation

export interface Solution {
    id: string;
    name: string;
    concept: string;
    mechanism: string;
    barrier: string;
    icon: string;
    // Policy mutation for simulation
    policy: {
        name: string;
        description: string;
        mutations: Array<{
            type: "reduce_edge_weight" | "increase_edge_weight" | "disable_node";
            source?: string;
            target?: string;
            node_id?: string;
            new_weight?: number;
            reason: string;
        }>;
        estimated_impacts: {
            co2_reduction_pct: number;
            aqi_improvement_pct: number;
            confidence: number;
        };
    };
}

export interface SolutionCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    solutions: Solution[];
}

export const solutionCategories: SolutionCategory[] = [
    {
        id: "geo-engineering",
        name: "Geo-Engineering",
        description: "Massive structural projects to physically alter the atmosphere",
        icon: "🏗️",
        color: "#3b82f6",
        solutions: [
            {
                id: "artificial-forest",
                name: "Artificial Forest",
                concept: "Millions of 'artificial trees' (columns packed with resin filters) built across vast land areas.",
                mechanism: "Chemical filters bond with CO₂ from the air; heat is used to release and store the carbon underground.",
                barrier: "Economic impossibility. Requires energy equivalent to a small country to run at a global scale.",
                icon: "🌲",
                policy: {
                    name: "Direct Air Capture Arrays",
                    description: "Deploy large-scale artificial forest DAC technology",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "power-generation",
                            target: "co2",
                            new_weight: 0.35,
                            reason: "DAC captures CO₂ emissions from power generation"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 25,
                        aqi_improvement_pct: 15,
                        confidence: 0.6
                    }
                }
            },
            {
                id: "solar-updraft",
                name: "Solar Updraft Towers",
                concept: "A massive greenhouse base (km wide) feeding into a 600m+ tall central chimney.",
                mechanism: "The sun heats the air, causing a thermal updraft that rushes through filters in the chimney without using electric fans.",
                barrier: "Requires immense amounts of land and construction of the tallest structures on Earth.",
                icon: "☀️",
                policy: {
                    name: "Solar Chimney Network",
                    description: "Build solar updraft towers for passive air filtration",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "energy",
                            target: "generation",
                            new_weight: 0.4,
                            reason: "Solar chimneys provide passive ventilation reducing energy generation needs"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 18,
                        aqi_improvement_pct: 22,
                        confidence: 0.5
                    }
                }
            },
            {
                id: "city-dome",
                name: "City Dome",
                concept: "Enclosing an entire city district under a transparent geodesic dome.",
                mechanism: "Physical isolation. The air inside is conditioned and filtered; the pollution is kept outside.",
                barrier: "Material science limitations (building a dome that big) and unmanageable heat/greenhouse effects inside.",
                icon: "🔮",
                policy: {
                    name: "Geodesic Dome Enclosure",
                    description: "Enclose critical districts under filtered domes",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "vehicle-emissions",
                            target: "co2",
                            new_weight: 0.25,
                            reason: "Dome isolates interior from external vehicle emissions"
                        },
                        {
                            type: "reduce_edge_weight",
                            source: "co2",
                            target: "contributes",
                            new_weight: 0.3,
                            reason: "Filtered dome air prevents pollution contribution to AQI"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 45,
                        aqi_improvement_pct: 60,
                        confidence: 0.3
                    }
                }
            },
            {
                id: "wind-corridors",
                name: "Wind Tunnel Corridors",
                concept: "Demolishing parts of a city to create straight paths aligned with prevailing winds.",
                mechanism: "Prevents air stagnation by allowing natural wind to 'flush' the city of pollutants.",
                barrier: "Requires destroying existing infrastructure; extremely difficult in dense, old cities.",
                icon: "💨",
                policy: {
                    name: "Urban Ventilation Corridors",
                    description: "Create wind paths through urban planning",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "contributes",
                            target: "aqi",
                            new_weight: 0.4,
                            reason: "Wind corridors disperse pollutants preventing AQI concentration"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 10,
                        aqi_improvement_pct: 35,
                        confidence: 0.7
                    }
                }
            }
        ]
    },
    {
        id: "infrastructure",
        name: "Infrastructure",
        description: "Turning city surfaces into purifiers - the 'City as a Filter'",
        icon: "🏙️",
        color: "#10b981",
        solutions: [
            {
                id: "photocatalytic-skins",
                name: "Photocatalytic City Skins",
                concept: "Coating roads and buildings with Titanium Dioxide (TiO₂).",
                mechanism: "Sunlight triggers a chemical reaction that breaks down Nitrogen Oxides (NOx) and VOCs into harmless salts.",
                barrier: "The surface stops working the moment it gets dirty or covered in tire rubber.",
                icon: "🧱",
                policy: {
                    name: "Smog-Eating Concrete Coating",
                    description: "Apply TiO₂ photocatalytic coating to urban surfaces",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "vehicle-emissions",
                            target: "co2",
                            new_weight: 0.45,
                            reason: "Photocatalytic surfaces break down NOx from vehicles"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 8,
                        aqi_improvement_pct: 20,
                        confidence: 0.75
                    }
                }
            },
            {
                id: "smart-streetlights",
                name: "Smart Streetlight Network",
                concept: "Retrofitting every streetlight with a small filtration or ionization unit.",
                mechanism: "Uses the natural heat rising from asphalt roads to push dirty air through filters on the poles above.",
                barrier: "Logistical nightmare of maintaining/cleaning hundreds of thousands of filters manually.",
                icon: "💡",
                policy: {
                    name: "Streetlight Filtration Network",
                    description: "Install air filters on streetlight poles citywide",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "transport",
                            target: "vehicle-emissions",
                            new_weight: 0.45,
                            reason: "Streetlight filters capture vehicle emissions at road level"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 12,
                        aqi_improvement_pct: 18,
                        confidence: 0.65
                    }
                }
            },
            {
                id: "urban-sequoia",
                name: "Urban Sequoia",
                concept: "High-rise buildings designed with a central core that acts as a 'lung.'",
                mechanism: "Uses the 'stack effect' to pull air through carbon-capture filters integrated into the floors and structure.",
                barrier: "High construction complexity; currently just an architectural proposal by SOM.",
                icon: "🏢",
                policy: {
                    name: "Carbon-Sucking Skyscrapers",
                    description: "Construct buildings with integrated carbon capture",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "power-generation",
                            target: "co2",
                            new_weight: 0.4,
                            reason: "Building cores capture and filter emissions from power generation"
                        },
                        {
                            type: "reduce_edge_weight",
                            source: "embodied-use",
                            target: "co2",
                            new_weight: 0.35,
                            reason: "Stack effect pulls emissions through carbon capture floors"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 30,
                        aqi_improvement_pct: 25,
                        confidence: 0.5
                    }
                }
            },
            {
                id: "kinetic-speed-bumps",
                name: "Kinetic Speed Bump Purifiers",
                concept: "Rubber speed bumps that compress when cars drive over them.",
                mechanism: "The compression generates electricity (piezoelectric) to power roadside fans that suck up exhaust fumes immediately.",
                barrier: "Maintenance intensive; currently only small pilot tests exist (e.g., in Serbia).",
                icon: "⚡",
                policy: {
                    name: "Piezoelectric Road Network",
                    description: "Install kinetic energy harvesting speed bumps",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "transport",
                            target: "vehicle-emissions",
                            new_weight: 0.5,
                            reason: "Roadside fans powered by traffic capture exhaust at source"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 8,
                        aqi_improvement_pct: 12,
                        confidence: 0.6
                    }
                }
            }
        ]
    },
    {
        id: "bio-engineering",
        name: "Bio-Engineering",
        description: "Using nature, often genetically enhanced, to clean the air",
        icon: "🧬",
        color: "#22c55e",
        solutions: [
            {
                id: "algae-curtains",
                name: "Living Algae Curtains",
                concept: "Transparent tubes filled with liquid algae draped over building facades.",
                mechanism: "Algae consumes CO₂ and particulates for food (photosynthesis) and releases oxygen.",
                barrier: "Heavy water weight puts stress on buildings; difficult to keep algae healthy in extreme temperatures.",
                icon: "🦠",
                policy: {
                    name: "Photo.Synth.Etica Facades",
                    description: "Install algae bioreactor curtains on buildings",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "co2",
                            target: "contributes",
                            new_weight: 0.5,
                            reason: "Algae absorbs CO₂ through photosynthesis on building surfaces"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 15,
                        aqi_improvement_pct: 12,
                        confidence: 0.7
                    }
                }
            },
            {
                id: "supercharged-plants",
                name: "Supercharged Plants",
                concept: "Plants (like Pothos Ivy) genetically modified with a synthetic 'liver' gene (Cytochrome P450 2E1).",
                mechanism: "The plant produces enzymes that aggressively break down toxins like Chloroform and Benzene 100x faster than normal.",
                barrier: "Regulatory approval for releasing GMO plants into the wild; strictly lab-based for now.",
                icon: "🌿",
                policy: {
                    name: "GMO Air-Purifying Plants",
                    description: "Deploy genetically enhanced plants in urban areas",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "contributes",
                            target: "aqi",
                            new_weight: 0.45,
                            reason: "Enhanced plants break down VOCs and toxins improving AQI"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 10,
                        aqi_improvement_pct: 28,
                        confidence: 0.55
                    }
                }
            },
            {
                id: "liquid-trees",
                name: "Liquid Trees",
                concept: "Urban benches with integrated algae bioreactor tanks.",
                mechanism: "Microalgae in water tanks absorbs CO₂ equivalent to two mature trees in minimal space.",
                barrier: "Requires regular maintenance and algae harvesting; limited scale.",
                icon: "💧",
                policy: {
                    name: "Liquid 3 Bioreactor Benches",
                    description: "Install algae tank benches throughout the city",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "vehicle-emissions",
                            target: "co2",
                            new_weight: 0.55,
                            reason: "Distributed algae tanks absorb CO₂ at street level"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 8,
                        aqi_improvement_pct: 10,
                        confidence: 0.75
                    }
                }
            }
        ]
    },
    {
        id: "physics-active",
        name: "Physics & Active",
        description: "Using forces (lasers, aerodynamics, chemistry) to manipulate air",
        icon: "⚛️",
        color: "#a855f7",
        solutions: [
            {
                id: "aura-towers",
                name: "Aura Towers",
                concept: "Twisted, organic-shaped towers designed by Studio Symbiosis.",
                mechanism: "Uses aerodynamics (Bernoulli principle) to create pressure differences that suck air in naturally, rather than using energy-hungry fans.",
                barrier: "Unproven efficiency at large scale; remains a design concept.",
                icon: "🌀",
                policy: {
                    name: "Aerodynamic Purification Towers",
                    description: "Build passive air-sucking tower network",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "vehicle-emissions",
                            target: "co2",
                            new_weight: 0.5,
                            reason: "Towers use Bernoulli effect to passively filter vehicle emissions"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 15,
                        aqi_improvement_pct: 20,
                        confidence: 0.45
                    }
                }
            },
            {
                id: "laser-zapping",
                name: "Laser/Radio Wave Zapping",
                concept: "Broadcasting electromagnetic waves into the atmosphere.",
                mechanism: "Charges particles (PM2.5) so they clump together (agglomerate), become heavy, and fall to the ground as dust.",
                barrier: "Safety concerns regarding radiating populated cities; lack of field data.",
                icon: "📡",
                policy: {
                    name: "Electromagnetic Particle Settling",
                    description: "Deploy EM wave emitters to agglomerate PM2.5",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "contributes",
                            target: "aqi",
                            new_weight: 0.35,
                            reason: "EM waves cause particles to clump and settle, improving AQI"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 5,
                        aqi_improvement_pct: 35,
                        confidence: 0.35
                    }
                }
            },
            {
                id: "cloud-seeding",
                name: "Artificial Rain (Cloud Seeding)",
                concept: "Spraying silver iodide into clouds from aircraft.",
                mechanism: "Triggers rain to wash down suspended pollutants ('wet scavenging').",
                barrier: "Requires specific cloud conditions (moisture) which are rarely present during dry winter smog episodes.",
                icon: "🌧️",
                policy: {
                    name: "Cloud Seeding Operations",
                    description: "Regular aircraft cloud seeding for rain-induced cleansing",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "co2",
                            target: "contributes",
                            new_weight: 0.45,
                            reason: "Rain washes down suspended pollutants from atmosphere"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 8,
                        aqi_improvement_pct: 40,
                        confidence: 0.5
                    }
                }
            },
            {
                id: "jet-engines",
                name: "Artificial Wind (Jet Engines)",
                concept: "Using decommissioned jet engines to blast air vertically.",
                mechanism: "Brute force attempt to break the 'inversion layer' (lid of cold air) trapping the smog.",
                barrier: "Extreme noise pollution and fuel inefficiency.",
                icon: "✈️",
                policy: {
                    name: "Inversion Layer Breakers",
                    description: "Deploy jet engine installations to disperse trapped smog",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "contributes",
                            target: "aqi",
                            new_weight: 0.5,
                            reason: "Vertical blasts break inversion layer releasing trapped pollution"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 5,
                        aqi_improvement_pct: 25,
                        confidence: 0.4
                    }
                }
            },
            {
                id: "bus-filters",
                name: "Pariyayantra (Bus Roof Filters)",
                concept: "Filters mounted on the roofs of public buses.",
                mechanism: "Uses the vehicle's movement to force air through filters (passive airflow).",
                barrier: "Operational complexity in cleaning filters for thousands of buses daily.",
                icon: "🚌",
                policy: {
                    name: "Mobile Bus Filtration Fleet",
                    description: "Equip public buses with roof-mounted air filters",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "transport",
                            target: "vehicle-emissions",
                            new_weight: 0.4,
                            reason: "Moving buses continuously filter street-level air"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 10,
                        aqi_improvement_pct: 15,
                        confidence: 0.7
                    }
                }
            },
            {
                id: "drone-swarms",
                name: "Autonomous Drone Swarms",
                concept: "Fleets of drones carrying mist sprayers or filters.",
                mechanism: "Deployed to specific 'hotspots' (fires, jams) to scrub the air locally.",
                barrier: "Drone propellers create 'downwash,' blowing dust up into people's faces rather than removing it.",
                icon: "🤖",
                policy: {
                    name: "Drone Air Scrubbing Network",
                    description: "Deploy drone fleets for targeted pollution hotspots",
                    mutations: [
                        {
                            type: "reduce_edge_weight",
                            source: "vehicle-emissions",
                            target: "co2",
                            new_weight: 0.55,
                            reason: "Drones target and spray pollution hotspots with mist"
                        }
                    ],
                    estimated_impacts: {
                        co2_reduction_pct: 5,
                        aqi_improvement_pct: 18,
                        confidence: 0.4
                    }
                }
            }
        ]
    }
];
