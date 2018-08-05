const isNumericable = (val) => !isNaN(parseFloat(n));
const isNumeric = (val) => !isNaN(val) && isFinite(val);
const formatNumber = (val, precision) => val.toLocaleString(undefined, {maximumFractionDigits: precision});
const calculatePct = (val, { min, max }) => 100 * ((val - min) / (max - min));
const formatPctStr = (pct) => `${pct}%`;
const forceArray = (a) => Array.isArray(a) ? a : [a];

function getTypologyFromPct(pct) {
    // very simple way of defining bins 
    // should do jenks (?)

    if (pct < 33) {
        return 'integrated';
    } else if (pct < 66) {
        return 'transitioning';
    } else {
        return 'emerging';
    }
}

function clearReadout(prop) {
    let $stat = document.querySelector(`#stat-${prop}`);
    let $bar = document.querySelector(`#bar-${prop} > .bar`);

    $bar.className = 'bar na';
    $stat.innerHTML = 'N/A';
}

export function clearReadouts() {
    PROPERTY_ORDER.forEach(clearReadout);
}

export function populateReadouts(features, verbose=false) {

    PROPERTY_ORDER.forEach((prop) => {
        let info = property_config[prop];
        let $stat = document.querySelector(`#stat-${prop}`);
        let $bar = document.querySelector(`#bar-${prop} > .bar`);
        let val = info.summarizer(features);

        if (isNumeric(val)) {
            let pct = calculatePct(val, info.range);

            $bar.style.width = formatPctStr(pct);
            $stat.innerHTML = formatNumber(val, info.precision); 
            $bar.className = 'bar ' + getTypologyFromPct(pct);
        } else {
            clearReadout(prop);
        }
    });
}

function createSimpleSummarizer(prop) {
    return (features) => {
        features = Array.isArray(features) ? features : [features];

        let valid_features = features.filter((f) => isNumeric(f.properties[prop]));

        if (valid_features.length == 0) {
            return undefined;
        }

        let sum = valid_features.reduce((total, f) => {
            return total + f.properties[prop];
        }, 0);

        return sum / features.length;
    };
}

export const PROPERTY_ORDER = [
    "vmt",
    "housing",
    "afford-transport",
    "afford-house-transport",
    "ghg",
    "pop-density",
    "jobs-density",
    "dwelling-density",
    "ped-environment",
    "pedcol",
    "walkscore",
    "walkshare",
    "jobs-accessibility",
    "cardio",
    "obesity"
];

export let property_config = {
    "vmt": {
        name: "Vehicle Miles Traveled",
        dom_name: "vmt",
        precision: 0,
        summarizer: createSimpleSummarizer("hh_type1_vmt")
    }, 
    "housing": {
        name: "Housing Affordability",
        dom_name: "housing",
        precision: 1,
        summarizer: createSimpleSummarizer("hh_type1_h")
    }, 
    "afford-transport": {
        name: "Transportation Affordability",
        dom_name: "afford-transport",
        precision: 1,
        summarizer: createSimpleSummarizer("hh_type1_t")
    }, 
    "afford-house-transport": {
        name: "Housing + Transportation Affordability",
        dom_name: "afford-house-transport",
        precision: 1,
        summarizer: createSimpleSummarizer("hh_type1_ht")
    }, 
    "pop-density": {
        name: "Population Density",
        dom_name: "pop-density",
        precision: 1,
        summarizer: createSimpleSummarizer("D1B")
    }, 
    "dwelling-density": {
        name: "Dwelling Density",
        dom_name: "dwelling-density",
        precision: 1,
        summarizer: createSimpleSummarizer("D1A")
    }, 
    "jobs-density": {
        name: "Jobs Density",
        dom_name: "jobs-density",
        precision: 1,
        summarizer: createSimpleSummarizer("D1C")
    }, 
    "ped-environment": {
        name: "Pedestrian Environment",
        dom_name: "ped-environment",
        precision: 1,
        summarizer: createSimpleSummarizer("D3b")
    }, 
    "jobs-accessibility": {
        name: "Jobs Accessibility",
        dom_name: "jobs-accessibility",
        precision: 0,
        summarizer: createSimpleSummarizer("D5br_cleaned")
    }, 
    "walkscore": {
        name: "WalkScore",
        dom_name: "walkscore",
        precision: 1,
        summarizer: createSimpleSummarizer("walkscore")
    }, 
    "cardio": {
        name: "Cardiovascular Disease",
        dom_name: "cardio",
        precision: 1,
        summarizer: createSimpleSummarizer("Cardiova_1")
    }, 
    "obesity": {
        name: "Obesity",
        dom_name: "obesity",
        precision: 1,
        summarizer: createSimpleSummarizer("OBESITY_Cr")
    }, 
    "walkshare": {
        name: "Walking Percent",
        dom_name: "walkshare",
        precision: 1,
        summarizer: (features) => {
            features = forceArray(features);

            let valid_features = features.filter((f) => { 
                let props = ['JTW_WALK', 'JTW_TOTAL'];

                for (let i = 0; i < props.length; i++) {
                    if (!isNumeric(f.properties[props[i]])) {
                        return false;
                    }
                }

                return true;
            });

            if (valid_features.length == 0) {
                return undefined;
            }

            let sums = valid_features.reduce((totals, f) => {
                let props = f.properties;

                totals['JTW_WALK'] += parseFloat(props['JTW_WALK']);
                totals['JTW_TOTAL'] += parseFloat(props['JTW_TOTAL']);

                return totals;
            }, { 'JTW_WALK': 0, 'JTW_TOTAL': 0 });

            return 100 * sums['JTW_WALK'] / sums['JTW_TOTAL'];
        }
    }, 
    "ghg": {
        name: "Carbon Emissions",
        dom_name: "ghg",
        precision: 0,
        summarizer: (features) => {
            features = forceArray(features);

            let valid_features = features.filter((f) => isNumeric(f.properties["hh_type1_vmt"]));

            if (valid_features.length == 0) {
                return undefined;
            }

            let sum = valid_features.reduce((total, f) => {
                return total + f.properties["hh_type1_vmt"] * .90
            }, 0);

            return sum / features.length;
        }
    }, 
    "pedcol": {
        name: "Pedestrian Collisions",
        dom_name: "pedcol",
        precision: 1,
        summarizer: (features) => {
            features = forceArray(features); 

            let valid_features = features.filter((f) => { 
                let props = ['SumAllPed', 'JTW_WALK', 'JTW_TOTAL', 'TOTPOP1'];

                for (let i = 0; i < props.length; i++) {
                    if (!isNumeric(f.properties[props[i]])) {
                        return false;
                    }
                }

                return true;
            });

            if (valid_features.length == 0) {
                return undefined;
            }

            let sums = valid_features.reduce((totals, f) => {
                let props = f.properties;

                totals['SumAllPed'] += parseInt(props['SumAllPed']);
                totals['JTW_WALK'] += parseInt(props['JTW_WALK']);
                totals['JTW_TOTAL'] += parseInt(props['JTW_TOTAL']);
                totals['TOTPOP1'] += parseInt(props['TOTPOP1']);

                return totals;
            }, { 'SumAllPed': 0, 'JTW_WALK': 0, 'JTW_TOTAL': 0, 'TOTPOP1': 0 });

            return 100000 * (sums['SumAllPed'] / sums['TOTPOP1']) / (sums['JTW_WALK'] / sums['JTW_TOTAL']) / 365.25;
        }
    }
};


        



