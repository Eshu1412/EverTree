export const servicesDb = {
  "health": {
    id: "health",
    title: "Health & Life",
    icon: "FaHeartbeat",
    description: "Comprehensive coverage for you and your family. Compare health, Medicare, and life insurance.",
    subs: {
      "health-aca": {
        title: "Health Insurance (ACA)",
        desc: "Find affordable health coverage under the Affordable Care Act that fits your family.",
        icon: "FaActivity",
        plans: [
          {
            name: "Bronze / Silver Plans",
            price: "Affordable Premiums",
            detail: "Low monthly cost options covering essential health benefits with varying deductibles.",
            features: ["Government subsidies available", "Preventative care included", "Covers pre-existing conditions"]
          },
          {
            name: "Gold / Platinum Plans",
            price: "Low Deductibles",
            detail: "Higher monthly premiums but minimal out-of-pocket costs for frequent medical care.",
            features: ["Comprehensive coverage", "Extensive doctor networks", "Low co-pays"]
          }
        ],
        form: [
          { type: "select", name: "household_size", label: "Household Size", options: ["1", "2", "3", "4", "5+"] },
          { type: "select", name: "income_range", label: "Estimated Annual Household Income?", options: ["Under $20k", "$20k - $40k", "$40k - $60k", "Over $60k"] },
          { type: "select", name: "qualifying_event", label: "Have you had a recent life event?", options: ["Lost previous coverage", "Moved to a new ZIP code", "Got married / Had a baby", "No (Just checking Open Enrollment)"] }
        ]
      },
      "medicare": {
        title: "Medicare & Medicaid",
        desc: "Compare Medicare Advantage, Supplements, and check Medicaid eligibility.",
        icon: "FaStethoscope",
        plans: [
          {
            name: "Medicare Advantage (Part C)",
            price: "$0 Premium Options",
            detail: "All-in-one plans that often include extra benefits like dental, vision, and hearing.",
            features: ["Network-based care (HMO/PPO)", "Prescription drug coverage often included", "Maximum out-of-pocket limits"]
          },
          {
            name: "Medicare Supplement (Medigap)",
            price: "Predictable Costs",
            detail: "Covers the 'gaps' in Original Medicare like copays, coinsurance, and deductibles.",
            features: ["See any doctor accepting Medicare", "No network restrictions or referrals", "Guaranteed renewable"]
          }
        ],
        form: [
          { type: "select", name: "age_group", label: "What is your age range?", options: ["Under 64", "Turning 65 within 6 months", "65 or older"] },
          { type: "select", name: "current_coverage", label: "What is your current coverage?", options: ["Original Medicare (Parts A & B)", "Medicare Advantage Plan", "No coverage / Other"] }
        ]
      },
      "final-expense": {
        title: "Final Expense Insurance",
        desc: "Protect your loved ones from the burden of funeral and end-of-life costs.",
        icon: "FaHeartHandshake",
        plans: [
          {
            name: "Guaranteed Acceptance",
            price: "Fixed Premiums",
            detail: "Whole life insurance designed to cover burial and final debts with no health questions.",
            features: ["No medical exam required", "Rates never increase", "Benefits never decrease"]
          },
          {
            name: "Standard Final Expense",
            price: "Lowest Rates",
            detail: "Affordable end-of-life coverage for individuals in generally good health.",
            features: ["Fast approval process", "Builds cash value over time", "Payout directly to your chosen beneficiary"]
          }
        ],
        form: [
          { type: "select", name: "coverage_amount", label: "Desired Coverage Amount?", options: ["$5,000 - $10,000", "$10,000 - $15,000", "$15,000 - $25,000", "$25,000+"] },
          { type: "select", name: "health_status", label: "How would you describe your current health?", options: ["Excellent", "Good/Fair (Minor issues)", "Poor (Major or chronic conditions)"] }
        ]
      },
      "ssdi": {
        title: "SSDI (Disability)",
        desc: "Get help filing or appealing Social Security Disability Insurance claims.",
        icon: "FaFileText",
        plans: [
          {
            name: "Disability Claim Assistance",
            price: "No Upfront Costs",
            detail: "Professional help filing your initial claim to maximize your chances of approval.",
            features: ["100% Free evaluation", "Application preparation & submission", "No fee unless you win"]
          },
          {
            name: "Claim Appeal Representation",
            price: "Contingency Fee",
            detail: "Legal representation if your initial disability claim was denied by the SSA.",
            features: ["Hearing preparation", "Gathering crucial medical evidence", "Representation before an ALJ"]
          }
        ],
        form: [
          { type: "select", name: "age_range", label: "What is your age?", options: ["Under 50", "50 - 59", "60 or older"] },
          { type: "select", name: "currently_working", label: "Are you currently working?", options: ["Yes, full time", "Yes, part time (under $1,550/mo)", "No, I am unable to work due to my condition"] },
          { type: "select", name: "medical_care", label: "Are you seeing a doctor for your condition?", options: ["Yes, receiving regular treatment", "No, not currently seeing a doctor"] }
        ]
      }
    }
  },
  "insurance": {
    id: "insurance",
    title: "Auto & Home",
    icon: "FaShieldAlt",
    description: "Compare quotes from top property and casualty providers and stop overpaying.",
    subs: {
      "auto": {
        title: "Auto Insurance",
        desc: "Compare local rates and save hundreds a year on your car insurance.",
        icon: "FaCar",
        plans: [
          {
            name: "State Minimum (Liability)",
            price: "Most Affordable",
            detail: "Basic, budget-friendly protection that keeps you legally compliant on the road.",
            features: ["Meets legal requirements", "Covers damage you cause to others", "Best for older, paid-off vehicles"]
          },
          {
            name: "Standard (Full Coverage)",
            price: "Best Value",
            detail: "Well-rounded coverage protecting your vehicle against collisions, theft, and natural disasters.",
            features: ["Liability + Collision + Comprehensive", "Covers your car in accidents", "Covers theft, fire, and weather", "Required for financed cars"]
          }
        ],
        form: [
          { type: "select", name: "insured_status", label: "Are you currently insured?", options: ["Yes", "No"] },
          { type: "select", name: "vehicles", label: "How many vehicles?", options: ["1", "2", "3", "4+"] },
          { type: "select", name: "incidents", label: "Any tickets or accidents in the last 3 years?", options: ["None", "1", "2 or more", "DUI/Suspended"] }
        ]
      },
      "home": {
        title: "Home Insurance",
        desc: "Protect your property, belongings, and equity from the unexpected.",
        icon: "FaHome",
        plans: [
          {
            name: "Basic Policy (HO-3)",
            price: "Standard Rates",
            detail: "Essential coverage for everyday risks to ensure your primary dwelling and belongings are safe.",
            features: ["Dwelling protection", "Personal property coverage", "Liability protection"]
          },
          {
            name: "Enhanced Coverage",
            price: "Recommended",
            detail: "Robust defense including high liability limits and water backup to cover all blind spots.",
            features: ["Replacement cost for belongings", "Water backup coverage", "Higher liability limits"]
          }
        ],
        form: [
          { type: "select", name: "property_use", label: "Property Use", options: ["Primary Residence", "Secondary/Vacation Home", "Rental Property"] },
          { type: "select", name: "year_built", label: "Year Built", options: ["After 2010", "1990 - 2009", "1970 - 1989", "Before 1970"] },
          { type: "select", name: "claims_history", label: "Any claims in the past 5 years?", options: ["0", "1", "2+"] }
        ]
      }
    }
  },
  "home-services": {
    id: "home-services",
    title: "Home Services",
    icon: "FaHammer",
    description: "Your complete hub for home maintenance, repair, and major remodeling.",
    subs: {
      "roofing": {
        title: "Roofing",
        desc: "Expert repairs, replacements, and inspections for lasting protection.",
        icon: "FaLayerGroup",
        plans: [
          {
            name: "Roof Inspection & Repair",
            price: "Varies",
            detail: "Professional evaluation to identify and patch hidden damage.",
            features: ["Leak detection", "Shingle replacement", "Flashing repair"]
          },
          {
            name: "Full Replacement",
            price: "Financing Available",
            detail: "A complete overhaul using high-durability materials.",
            features: ["Complete tear-off", "Premium architectural shingles", "25-year warranties"]
          }
        ],
        form: [
          { type: "select", name: "roof_need", label: "What do you need?", options: ["Repair an existing leak", "Replace entire roof", "Just an inspection"] },
          { type: "select", name: "roof_age", label: "Approximate age of roof?", options: ["Less than 10 years", "10-20 years", "Over 20 years", "I don't know"] }
        ]
      },
      "plumbing": {
        title: "Plumbing",
        desc: "Expert plumbing services for leaks, clogs, and major installations.",
        icon: "FaTint",
        plans: [
          {
            name: "Standard Repair",
            price: "Starts at $99",
            detail: "Fast fixes for leaks, drain clogs, and minor fixture issues.",
            features: ["Same-day service available", "Licensed professionals", "Upfront pricing"]
          },
          {
            name: "Major Installation",
            price: "Custom Quote",
            detail: "Complete water heater replacements, repiping, and major system upgrades.",
            features: ["Warranties included", "Code compliant installations", "Financing available"]
          }
        ],
        form: [
          { type: "select", name: "issue_type", label: "What plumbing issue do you have?", options: ["Leaky pipe", "Clogged drain / toilet", "Water heater issue", "Need installation / replacement", "Other"] },
          { type: "select", name: "urgency", label: "How urgent is this?", options: ["Emergency (Water actively leaking)", "Need help within 24-48 hrs", "Flexible scheduling"] }
        ]
      },
      "hvac": {
        title: "HVAC (Heating & Air)",
        desc: "Repair, maintenance, and installation of AC and heating systems.",
        icon: "FaThermometerHalf",
        plans: [
          {
            name: "Diagnostic & Repair",
            price: "Standard Fee",
            detail: "Expert troubleshooting to get your system cooling or heating properly again.",
            features: ["All major brands serviced", "Emergency service available", "Parts warranties"]
          },
          {
            name: "New System Install",
            price: "Financing Available",
            detail: "High-efficiency AC and heating systems to lower your utility bills.",
            features: ["Energy savings analysis", "Rebates available", "Free replacement estimates"]
          }
        ],
        form: [
          { type: "select", name: "system_type", label: "What type of system do you have?", options: ["Central AC & Furnace", "Heat Pump", "Ductless Mini-Split", "Not Sure"] },
          { type: "select", name: "issue_description", label: "What do you need help with?", options: ["System won't turn on", "Not blowing hot/cold air", "Making strange noises", "Routine maintenance tune-up", "Need a full replacement"] }
        ]
      },
      "windows": {
        title: "Windows & Doors",
        desc: "Upgrade your home's curb appeal and energy efficiency with new windows.",
        icon: "FaWindowMaximize",
        plans: [
          {
            name: "Standard Vinyl Replacement",
            price: "Budget Friendly",
            detail: "Durable, low-maintenance vinyl windows that provide an immediate upgrade.",
            features: ["Double-pane insulation", "Easy-clean tilt-in sash", "Lifetime limited warranty"]
          },
          {
            name: "Premium Energy Efficient",
            price: "Best Value",
            detail: "High-performance windows designed to slash your heating and cooling bills.",
            features: ["Low-E glass coating", "Argon gas filled", "Maximum energy savings"]
          }
        ],
        form: [
          { type: "select", name: "window_count", label: "How many windows need replacing?", options: ["1-3", "4-9", "10+ (Full House)"] },
          { type: "select", name: "home_age", label: "Approximate age of the home?", options: ["Under 20 years", "20-40 years", "Over 40 years"] }
        ]
      },
      "bathroom": {
        title: "Bathroom Remodeling",
        desc: "Transform your old bathroom into a modern, functional oasis.",
        icon: "FaBath",
        plans: [
          {
            name: "Tub-to-Shower Conversion",
            price: "Fast Install",
            detail: "Replace your old bathtub with a beautiful, accessible walk-in shower in as little as a day.",
            features: ["Safety grab bars", "Slip-resistant flooring", "Easy to clean acrylic"]
          },
          {
            name: "Full Custom Remodel",
            price: "Premium",
            detail: "A complete tear-down and redesign of your entire bathroom space.",
            features: ["Custom tile work", "New vanities and plumbing", "Complete design consultation"]
          }
        ],
        form: [
          { type: "select", name: "project_type", label: "What type of remodel do you need?", options: ["Tub-to-Shower Conversion", "Just replacing the tub/shower", "Full bathroom gut & remodel"] },
          { type: "select", name: "budget", label: "Estimated Budget?", options: ["Under $5k", "$5k - $10k", "$10k - $25k", "Over $25k"] }
        ]
      },
      "pest-control": {
        title: "Pest Control",
        desc: "Eradicate infestations and protect your home from future invasions.",
        icon: "FaBug",
        plans: [
          {
            name: "One-Time Extermination",
            price: "Starts at $149",
            detail: "Fast and effective targeted treatment for immediate relief.",
            features: ["Targeted specific pest treatment", "Interior & exterior application", "30-day guarantee"]
          },
          {
            name: "Quarterly Preventative",
            price: "$49/month",
            detail: "Year-round peace of mind with proactive seasonal treatments.",
            features: ["4 visits per year", "General pest barrier", "Free re-service"]
          }
        ],
        form: [
          { type: "select", name: "pest_type", label: "What pest are you dealing with?", options: ["Ants", "Termites", "Roaches", "Rodents", "Spiders", "Bed Bugs", "Unsure"] },
          { type: "select", name: "urgency", label: "How urgent is this?", options: ["Emergency (Need help today)", "Within 48 hours", "Planning for the future"] }
        ]
      },
      "water-damage": {
        title: "Water Damage & Mold",
        desc: "Rapid response water extraction, drying, and restoration services.",
        icon: "FaWater",
        plans: [
          {
            name: "Emergency Extraction",
            price: "Immediate Response",
            detail: "Rapid water removal to prevent structural damage and mold growth.",
            features: ["24/7 emergency dispatch", "Industrial-grade vacuums", "Moisture mapping"]
          },
          {
            name: "Full Restoration",
            price: "Covered by Insurance",
            detail: "Complete dry-out, dehumidification, and structural repair.",
            features: ["Direct insurance billing", "Mold prevention treatment", "Complete drywall repair"]
          }
        ],
        form: [
          { type: "select", name: "damage_source", label: "What caused the water damage?", options: ["Burst pipe / plumbing leak", "Appliance failure", "Storm / Flooding", "Sewer backup", "Unsure"] },
          { type: "select", name: "standing_water", label: "Is there currently standing water?", options: ["Yes, actively flooded", "No, water is gone but damage remains", "Unsure"] }
        ]
      },
      "maintenance": {
        title: "Maintenance & Repair",
        desc: "General handyman services and routine home maintenance tasks.",
        icon: "FaWrench",
        plans: [
          {
            name: "General Handyman",
            price: "Hourly Rate",
            detail: "Hire a skilled professional to knock out your entire to-do list.",
            features: ["Drywall patching", "Fixture installation", "Furniture assembly"]
          },
          {
            name: "Seasonal Maintenance Prep",
            price: "Fixed Price",
            detail: "Ensure your home is ready for harsh winter or summer weather.",
            features: ["Gutter cleaning", "Weatherstripping", "Filter replacements"]
          }
        ],
        form: [
          { type: "select", name: "task_size", label: "How big is the task?", options: ["Small (1-2 hours)", "Medium (Half day)", "Large (Multiple days)", "Unsure"] },
          { type: "select", name: "tools_needed", label: "Do you need the pro to supply parts/materials?", options: ["Yes, please bring everything", "No, I have the parts already"] }
        ]
      },
      "remodeling": {
        title: "Improvement & Remodeling",
        desc: "Major structural changes, additions, and full kitchen remodels.",
        icon: "FaTools",
        plans: [
          {
            name: "Kitchen Remodel",
            price: "Custom Quote",
            detail: "Upgrade your cabinets, countertops, and appliances for a dream kitchen.",
            features: ["Custom cabinetry", "Granite/Quartz counters", "Lighting upgrades"]
          },
          {
            name: "Basement Finishing",
            price: "Custom Quote",
            detail: "Add valuable living space to your home by finishing your basement.",
            features: ["Framing & drywall", "Egress windows", "Flooring installation"]
          }
        ],
        form: [
          { type: "select", name: "project_scope", label: "What are you remodeling?", options: ["Kitchen", "Basement", "Adding a Room/Addition", "Whole House Renovation"] },
          { type: "select", name: "home_ownership", label: "Do you own the home?", options: ["Yes", "No, renting", "In the process of buying"] }
        ]
      },
      "cleaning": {
        title: "Cleaning & Sanitation",
        desc: "Professional deep cleaning, move-out cleaning, and recurring maid services.",
        icon: "FaBroom",
        plans: [
          {
            name: "One-Time Deep Clean",
            price: "Starts at $199",
            detail: "A thorough, top-to-bottom scrub of your entire home, perfect for spring cleaning.",
            features: ["Baseboards and blinds", "Inside appliances", "Heavy scrubbing"]
          },
          {
            name: "Recurring Maid Service",
            price: "Discounted Rate",
            detail: "Keep your home spotless week after week with reliable professionals.",
            features: ["Weekly or Bi-weekly", "Consistent cleaners", "Eco-friendly products available"]
          }
        ],
        form: [
          { type: "select", name: "clean_type", label: "What type of cleaning?", options: ["One-time Deep Clean", "Recurring service", "Move-in / Move-out clean", "Post-construction clean"] },
          { type: "select", name: "sq_footage", label: "Approximate Square Footage?", options: ["Under 1,000 sq ft", "1,000 - 2,000 sq ft", "2,000 - 3,500 sq ft", "Over 3,500 sq ft"] }
        ]
      },
      "landscaping": {
        title: "Landscaping & Outdoor",
        desc: "Lawn care, tree removal, hardscaping, and outdoor living spaces.",
        icon: "FaTree",
        plans: [
          {
            name: "Routine Lawn Care",
            price: "Weekly Rates",
            detail: "Mowing, edging, and blowing to keep your yard looking pristine all season.",
            features: ["Reliable weekly schedule", "Fertilization options", "Weed control"]
          },
          {
            name: "Hardscaping & Design",
            price: "Custom Quote",
            detail: "Install beautiful patios, retaining walls, and fire pits.",
            features: ["Paver patios", "Custom outdoor kitchens", "Landscape lighting"]
          }
        ],
        form: [
          { type: "select", name: "outdoor_need", label: "What do you need help with?", options: ["Lawn mowing & maintenance", "Tree trimming/removal", "New patio/hardscaping", "Fencing installation", "Other"] },
          { type: "select", name: "yard_size", label: "Approximate size of yard?", options: ["Small (City lot)", "Medium (Quarter acre)", "Large (Half acre or more)"] }
        ]
      },
      "safety-tech": {
        title: "Property Safety & Tech",
        desc: "Security systems, smart home automation, and fire prevention.",
        icon: "FaShieldAlt",
        plans: [
          {
            name: "Smart Security Install",
            price: "Packages Available",
            detail: "Protect your family with 24/7 monitored cameras, sensors, and smart locks.",
            features: ["App-controlled locks", "Video doorbells", "24/7 monitoring center"]
          },
          {
            name: "Home Automation",
            price: "Custom Setup",
            detail: "Integrate your lighting, climate, and audio into one seamless smart system.",
            features: ["Smart thermostats", "Automated blinds", "Whole-home audio"]
          }
        ],
        form: [
          { type: "select", name: "tech_interest", label: "What are you looking to install?", options: ["Security Cameras/Alarm", "Smart Home Hub (Lights/Thermostat)", "Home Theater", "Other"] },
          { type: "select", name: "current_system", label: "Do you have an existing system?", options: ["Yes, want to upgrade", "No, starting fresh"] }
        ]
      }
    }
  },
  "finance": {
    id: "finance",
    title: "Finance & Debt",
    icon: "FaHandHoldingUsd",
    description: "Take control of your financial future. Solutions for debt, loans, and credit.",
    subs: {
      "debt-relief": {
        title: "Debt Relief",
        desc: "Consolidate or settle high-interest credit card debt and loans.",
        icon: "FaChartLine",
        plans: [
          {
            name: "Debt Consolidation Loan",
            price: "Fixed Rate",
            detail: "Streamline your finances by combining multiple high-interest debts into one manageable payment.",
            features: ["Combine multiple debts into one payment", "Lower interest rate", "Fixed payoff date"]
          },
          {
            name: "Debt Settlement",
            price: "Pay Less Than Owed",
            detail: "Aggressive negotiation to significantly reduce your principal balance during financial hardship.",
            features: ["Negotiate with creditors to reduce balance", "One affordable monthly deposit", "Resolves debt in 24-48 months"]
          }
        ],
        form: [
          { type: "select", name: "debt_amount", label: "Total Unsecured Debt Amount?", options: ["Under $10,000", "$10,000 - $20,000", "$20,000 - $50,000", "Over $50,000"] },
          { type: "select", name: "hardship", label: "Are you experiencing financial hardship?", options: ["Yes, behind on payments", "Struggling but current", "No, just want a lower rate"] }
        ]
      },
      "personal-loan": {
        title: "Personal Loans",
        desc: "Fast funding for home improvements, unexpected expenses, or big purchases.",
        icon: "FaMoneyBillWave",
        plans: [
          {
            name: "Short-Term Installment",
            price: "Quick Cash",
            detail: "Fast, accessible capital designed to bridge the gap during unexpected financial emergencies.",
            features: ["Funds as soon as next day", "12 to 36 month terms", "Fixed payments"]
          },
          {
            name: "Large Personal Loan",
            price: "Up to $100k",
            detail: "Substantial funding with favorable terms, perfect for life-changing purchases or renovations.",
            features: ["For major renovations or debt payoff", "Up to 7 year terms", "Competitive APRs based on credit"]
          }
        ],
        form: [
          { type: "select", name: "loan_amount", label: "Desired Loan Amount?", options: ["$1,000 - $5,000", "$5,000 - $15,000", "$15,000 - $35,000", "$35,000+"] },
          { type: "select", name: "credit_score", label: "Estimated Credit Score?", options: ["Excellent (720+)", "Good (680-719)", "Fair (600-679)", "Poor (Under 600)"] }
        ]
      }
    }
  },
  "legal": {
    id: "legal",
    title: "Legal Help",
    icon: "FaGavel",
    description: "Get the compensation and representation you deserve. Connect with local attorneys.",
    subs: {
      "auto-accident": {
        title: "Auto Accident",
        desc: "Injured in a crash? Find a lawyer to fight for your medical bills and pain & suffering.",
        icon: "FaCarCrash",
        plans: [
          {
            name: "Contingency Representation",
            price: "No Fee Unless You Win",
            detail: "Zero out-of-pocket risk; elite legal representation completely dedicated to maximizing your payout.",
            features: ["100% Free Consultation", "No upfront out-of-pocket costs", "Maximizes settlement value"]
          }
        ],
        form: [
          { type: "select", name: "injury_status", label: "Were you physically injured?", options: ["Yes, severe injuries", "Yes, minor/moderate injuries", "No injuries, property damage only"] },
          { type: "select", name: "fault", label: "Who was at fault?", options: ["The other driver", "I was partially at fault", "I was at fault", "Not sure/Disputed"] },
          { type: "select", name: "accident_year", label: "When did the accident happen?", options: ["Within the last 6 months", "6-12 months ago", "1-2 years ago", "Over 2 years ago"] }
        ]
      },
      "workers-comp": {
        title: "Workers' Compensation",
        desc: "Injured on the job? Ensure you get your lost wages and medical care covered.",
        icon: "FaUserNurse",
        plans: [
          {
            name: "Workers' Comp Review",
            price: "Free Case Evaluation",
            detail: "Professional legal analysis to ensure your employer's insurance is paying what you are owed.",
            features: ["Determine claim eligibility", "Protect against employer retaliation", "Ensure proper medical treatment is approved"]
          }
        ],
        form: [
          { type: "select", name: "reported", label: "Have you reported the injury to your employer?", options: ["Yes", "No", "Not yet, planning to"] },
          { type: "select", name: "missed_work", label: "Have you missed work due to the injury?", options: ["Yes, currently missing work", "Yes, missed some days but returned", "No"] }
        ]
      }
    }
  },
  "travel": {
    id: "travel",
    title: "Flight Booking",
    icon: "FaPlane",
    description: "Compare airfares, book domestic & international flights, and explore exclusive holiday travel packages.",
    subs: {
      "flights": {
        title: "Flight Booking & Airfare",
        desc: "Compare low fares across leading domestic and international airlines.",
        icon: "FaPlaneDeparture",
        plans: [
          {
            name: "Economy Saver",
            price: "Best Value",
            detail: "Budget-friendly airfare with standard seat selection and carry-on allowances.",
            features: ["Free standard carry-on", "Instant digital itinerary", "Flexible cancellation options"]
          },
          {
            name: "Premium / Business Class",
            price: "Maximum Comfort",
            detail: "Priority boarding, extra legroom, gourmet in-flight meals, and lounge access.",
            features: ["Priority check-in & boarding", "Complimentary lounge passes", "2 checked bags included"]
          }
        ],
        form: [
          { type: "select", name: "trip_type", label: "Trip Type", options: ["Round Trip", "One Way"] }
        ]
      },
      "travel-packages": {
        title: "Vacation Packages",
        desc: "Bundle flights and premium hotel stays for up to 30% savings on dream destinations.",
        icon: "FaSuitcase",
        plans: [
          {
            name: "Flight + Hotel Bundle",
            price: "Save up to 30%",
            detail: "Curated resorts and boutique hotels paired with premier airline schedules.",
            features: ["Airport transfers included", "Price drop guarantee", "24/7 travel concierge"]
          }
        ],
        form: [
          { type: "select", name: "package_type", label: "Trip Style?", options: ["Beach & Resort", "City Break", "Adventure & Nature", "Family Vacation"] }
        ]
      }
    }
  }
}
