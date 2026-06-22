"use strict";

const moneyINR = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const moneyUSD = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value, digits = 2) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
const field = (id, label, options = {}) => ({ id, label, type: "number", min: 0, step: "any", ...options });

const calculators = [
  { slug: "emi-calculator", name: "EMI Calculator", category: "India Finance", desc: "Estimate monthly loan EMI, total interest and repayment.", formula: "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)", fields: [field("principal", "Loan amount", { prefix: "₹", value: 500000 }), field("rate", "Annual interest rate", { suffix: "%", value: 9 }), field("years", "Loan tenure", { suffix: "years", value: 5 })], calc: v => { const n=v.years*12,r=v.rate/1200,p=v.principal,emi=r ? p*r*(1+r)**n/((1+r)**n-1) : p/n; return { value: moneyINR(emi)+" / month", detail: `Total payment: ${moneyINR(emi*n)} · Total interest: ${moneyINR(emi*n-p)}` }; } },
  { slug: "sip-calculator", name: "SIP Calculator", category: "India Finance", desc: "Project the future value of monthly mutual fund investments.", formula: "Future value = P × [((1 + r)ⁿ − 1) ÷ r] × (1 + r)", fields: [field("monthly", "Monthly investment", { prefix: "₹", value: 5000 }), field("rate", "Expected annual return", { suffix: "%", value: 12 }), field("years", "Investment period", { suffix: "years", value: 10 })], calc: v => { const r=v.rate/1200,n=v.years*12,total=v.monthly*n,fv=r ? v.monthly*((1+r)**n-1)/r*(1+r) : total; return { value: moneyINR(fv), detail: `Invested: ${moneyINR(total)} · Estimated gain: ${moneyINR(fv-total)}` }; } },
  { slug: "fd-calculator", name: "FD Calculator", category: "India Finance", desc: "Calculate fixed deposit maturity value and interest earned.", formula: "Maturity = Principal × (1 + rate ÷ 4)⁽⁴ × years⁾", fields: [field("principal", "Deposit amount", { prefix: "₹", value: 100000 }), field("rate", "Annual interest rate", { suffix: "%", value: 7 }), field("years", "Deposit term", { suffix: "years", value: 5 })], calc: v => { const m=v.principal*(1+v.rate/400)**(4*v.years); return { value: moneyINR(m), detail: `Interest earned: ${moneyINR(m-v.principal)} (quarterly compounding)` }; } },
  { slug: "rd-calculator", name: "RD Calculator", category: "India Finance", desc: "Estimate recurring deposit maturity from monthly savings.", formula: "Maturity = P × [((1 + r)ⁿ − 1) ÷ r] × (1 + r)", fields: [field("monthly", "Monthly deposit", { prefix: "₹", value: 3000 }), field("rate", "Annual interest rate", { suffix: "%", value: 7 }), field("years", "Deposit term", { suffix: "years", value: 3 })], calc: v => { const r=v.rate/1200,n=v.years*12,paid=v.monthly*n,m=r?v.monthly*((1+r)**n-1)/r*(1+r):paid; return { value: moneyINR(m), detail: `Total deposits: ${moneyINR(paid)} · Interest: ${moneyINR(m-paid)}` }; } },
  { slug: "gst-calculator", name: "GST Calculator", category: "India Finance", desc: "Add GST to a base price or remove it from an inclusive price.", formula: "GST = Amount × rate ÷ 100 (exclusive) or Amount × rate ÷ (100 + rate) (inclusive)", fields: [field("amount", "Amount", { prefix: "₹", value: 1000 }), field("rate", "GST rate", { suffix: "%", value: 18 }), { id: "mode", label: "Amount type", type: "select", options: [["exclusive","Before GST"],["inclusive","Including GST"]] }], calc: v => { const gst=v.mode==="inclusive"?v.amount*v.rate/(100+v.rate):v.amount*v.rate/100,total=v.mode==="inclusive"?v.amount:v.amount+gst,base=total-gst; return { value: moneyINR(total), detail: `Base: ${moneyINR(base)} · GST: ${moneyINR(gst)}` }; } },
  { slug: "income-tax-calculator-india", name: "Income Tax Calculator India", category: "India Finance", desc: "Get an indicative new-regime income tax estimate for FY 2025–26.", formula: "Tax is calculated progressively across applicable income slabs, plus 4% cess.", note: "This simplified estimate uses FY 2025–26 new-regime slabs and a ₹75,000 salaried standard deduction. It excludes surcharge and special-rate income. Verify current rules before filing.", fields: [field("income", "Annual salary income", { prefix: "₹", value: 1200000 }), field("other", "Other taxable income", { prefix: "₹", value: 0 })], calc: v => { const taxable=Math.max(0,v.income-75000+v.other); if(taxable<=1200000)return {value:moneyINR(0),detail:`Taxable income: ${moneyINR(taxable)} · Rebate applied (indicative)`}; const slabs=[[400000,0],[800000,.05],[1200000,.10],[1600000,.15],[2000000,.20],[2400000,.25],[Infinity,.30]]; let tax=0,low=0; for(const [high,rate] of slabs){tax+=Math.max(0,Math.min(taxable,high)-low)*rate;if(taxable<=high)break;low=high;} return {value:moneyINR(tax*1.04),detail:`Tax before 4% cess: ${moneyINR(tax)} · Taxable income: ${moneyINR(taxable)}`}; } },
  { slug: "mortgage-calculator", name: "Mortgage Calculator", category: "International", desc: "Estimate a monthly home loan payment and total interest.", formula: "Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)", fields: [field("price", "Home price", { prefix: "$", value: 400000 }), field("down", "Down payment", { prefix: "$", value: 80000 }), field("rate", "Annual interest rate", { suffix: "%", value: 6.5 }), field("years", "Loan term", { suffix: "years", value: 30 })], calc: v => { const p=v.price-v.down,n=v.years*12,r=v.rate/1200,m=r?p*r*(1+r)**n/((1+r)**n-1):p/n; return {value:moneyUSD(m)+" / month",detail:`Loan: ${moneyUSD(p)} · Total interest: ${moneyUSD(m*n-p)} (taxes and insurance excluded)`}; } },
  { slug: "loan-calculator", name: "Loan Calculator", category: "International", desc: "Calculate monthly payments for a standard amortizing loan.", formula: "Payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)", fields: [field("principal", "Loan amount", { prefix: "$", value: 20000 }), field("rate", "Annual interest rate", { suffix: "%", value: 8 }), field("years", "Loan term", { suffix: "years", value: 4 })], calc: v => { const n=v.years*12,r=v.rate/1200,m=r?v.principal*r*(1+r)**n/((1+r)**n-1):v.principal/n; return {value:moneyUSD(m)+" / month",detail:`Total payment: ${moneyUSD(m*n)} · Interest: ${moneyUSD(m*n-v.principal)}`}; } },
  { slug: "compound-interest-calculator", name: "Compound Interest Calculator", category: "International", desc: "See how money grows when interest compounds over time.", formula: "A = P × (1 + r ÷ n)⁽ⁿᵗ⁾", fields: [field("principal", "Starting amount", { prefix: "$", value: 10000 }), field("rate", "Annual interest rate", { suffix: "%", value: 7 }), field("years", "Time", { suffix: "years", value: 10 }), { id:"frequency",label:"Compounds per year",type:"select",options:[[1,"Annually"],[4,"Quarterly"],[12,"Monthly"],[365,"Daily"]] }], calc:v=>{const a=v.principal*(1+v.rate/100/v.frequency)**(v.frequency*v.years);return{value:moneyUSD(a),detail:`Interest earned: ${moneyUSD(a-v.principal)}`};} },
  { slug: "hourly-to-salary-calculator", name: "Hourly to Salary Calculator", category: "International", desc: "Convert an hourly wage into weekly, monthly and annual pay.", formula: "Annual salary = hourly rate × hours per week × working weeks", fields: [field("hourly", "Hourly rate", { prefix: "$", value: 25 }), field("hours", "Hours per week", { value: 40 }), field("weeks", "Working weeks", { value: 52, max: 52 })], calc:v=>{const annual=v.hourly*v.hours*v.weeks;return{value:moneyUSD(annual)+" / year",detail:`Monthly: ${moneyUSD(annual/12)} · Weekly: ${moneyUSD(annual/v.weeks)}`};} },
  { slug: "salary-to-hourly-calculator", name: "Salary to Hourly Calculator", category: "International", desc: "Convert an annual salary into an equivalent hourly wage.", formula: "Hourly rate = annual salary ÷ (hours per week × working weeks)", fields: [field("salary", "Annual salary", { prefix: "$", value: 60000 }), field("hours", "Hours per week", { value: 40 }), field("weeks", "Working weeks", { value: 52, max: 52 })], calc:v=>{const hourly=v.salary/(v.hours*v.weeks);return{value:moneyUSD(hourly)+" / hour",detail:`Monthly: ${moneyUSD(v.salary/12)} · Weekly: ${moneyUSD(v.salary/v.weeks)}`};} },
  { slug: "overtime-pay-calculator", name: "Overtime Pay Calculator", category: "International", desc: "Estimate regular and overtime earnings for one week.", formula: "Overtime pay = hourly rate × overtime hours × multiplier", fields: [field("hourly", "Hourly rate", { prefix: "$", value: 20 }), field("regular", "Regular hours", { value: 40 }), field("overtime", "Overtime hours", { value: 8 }), field("multiplier", "Overtime multiplier", { value: 1.5 })], calc:v=>{const regular=v.hourly*v.regular,ot=v.hourly*v.overtime*v.multiplier;return{value:moneyUSD(regular+ot),detail:`Regular: ${moneyUSD(regular)} · Overtime: ${moneyUSD(ot)}`};} },
  { slug: "pay-raise-calculator", name: "Pay Raise Calculator", category: "International", desc: "Find your new pay and the value of a percentage raise.", formula: "New pay = current pay × (1 + raise percentage ÷ 100)", fields: [field("pay", "Current annual pay", { prefix: "$", value: 50000 }), field("raise", "Pay raise", { suffix: "%", value: 5 })], calc:v=>{const increase=v.pay*v.raise/100;return{value:moneyUSD(v.pay+increase),detail:`Annual increase: ${moneyUSD(increase)} · Monthly increase: ${moneyUSD(increase/12)}`};} },
  { slug: "percentage-calculator", name: "Percentage Calculator", category: "Student", desc: "Find what percentage one number is of another.", formula: "Percentage = value ÷ total × 100", fields: [field("value", "Value", { value: 75 }), field("total", "Total", { value: 100 })], calc:v=>({value:number(v.value/v.total*100)+"%",detail:`${number(v.value)} is ${number(v.value/v.total*100)}% of ${number(v.total)}`}) },
  { slug: "cgpa-calculator", name: "CGPA Calculator", category: "Student", desc: "Calculate credit-weighted CGPA across all your subjects.", formula: "CGPA = total (credits × grade points) ÷ total credits", custom: "cgpa" },
  { slug: "sgpa-to-cgpa-calculator", name: "SGPA to CGPA Calculator", category: "Student", desc: "Combine an existing CGPA with a new semester SGPA by credits.", formula: "CGPA = (old CGPA × old credits + SGPA × semester credits) ÷ total credits", fields: [field("oldCgpa", "Current CGPA", { value: 8.2, max: 10 }), field("oldCredits", "Completed credits", { value: 80 }), field("sgpa", "New semester SGPA", { value: 8.8, max: 10 }), field("newCredits", "New semester credits", { value: 20 })], calc:v=>({value:number((v.oldCgpa*v.oldCredits+v.sgpa*v.newCredits)/(v.oldCredits+v.newCredits),3),detail:`Weighted across ${number(v.oldCredits+v.newCredits,0)} total credits`}) },
  { slug: "cgpa-to-percentage-calculator", name: "CGPA to Percentage Calculator", category: "Student", desc: "Convert CGPA to an indicative Indian percentage using × 9.5.", formula: "Percentage = CGPA × 9.5", note: "The 9.5 multiplier is common in India, but it is not universal. Always use the conversion rule published by your school, board or university.", fields: [field("cgpa", "CGPA", { value: 8.5, max: 10 })], calc:v=>({value:number(v.cgpa*9.5)+"%",detail:`Using the CGPA × 9.5 convention`}) },
  { slug: "attendance-calculator", name: "Attendance Calculator", category: "Student", desc: "Check attendance percentage and classes needed for a target.", formula: "Attendance = attended classes ÷ total classes × 100", fields: [field("attended", "Classes attended", { value: 72 }), field("total", "Total classes", { value: 90 }), field("target", "Target attendance", { suffix: "%", value: 75, max: 100 })], calc:v=>{const pct=v.attended/v.total*100,needed=pct>=v.target?0:Math.ceil((v.target*v.total-100*v.attended)/(100-v.target));return{value:number(pct)+"%",detail:needed?`Attend the next ${needed} classes to reach ${number(v.target)}%.`:`You meet the ${number(v.target)}% target.`};} },
  { slug: "age-calculator", name: "Age Calculator", category: "Health", desc: "Calculate exact age from a date of birth to today.", formula: "Age is the calendar difference between birth date and today.", fields: [{id:"dob",label:"Date of birth",type:"date",value:"2000-01-01"}], calc:v=>{const birth=new Date(v.dob+"T00:00:00"),today=new Date();let y=today.getFullYear()-birth.getFullYear(),m=today.getMonth()-birth.getMonth(),d=today.getDate()-birth.getDate();if(d<0){m--;d+=new Date(today.getFullYear(),today.getMonth(),0).getDate();}if(m<0){y--;m+=12;}return{value:`${y} years`,detail:`${m} months and ${d} days beyond the completed years`};} },
  { slug: "bmi-calculator", name: "BMI Calculator", category: "Health", desc: "Estimate body mass index from weight and height.", formula: "BMI = weight in kilograms ÷ height in metres²", fields: [field("weight", "Weight", { suffix: "kg", value: 70 }), field("height", "Height", { suffix: "cm", value: 170 })], calc:v=>{const bmi=v.weight/(v.height/100)**2,band=bmi<18.5?"underweight range":bmi<25?"healthy range":bmi<30?"overweight range":"obesity range";return{value:number(bmi,1),detail:`This falls in the standard adult ${band}. BMI is a screening measure, not a diagnosis.`};} },
  { slug: "calorie-calculator", name: "Calorie Calculator", category: "Health", desc: "Estimate daily maintenance calories from activity and body data.", formula: "Mifflin–St Jeor BMR × activity factor", fields: [field("age", "Age", { suffix: "years", value: 30 }), {id:"sex",label:"Sex used by formula",type:"select",options:[["male","Male"],["female","Female"]]}, field("weight", "Weight", { suffix: "kg", value: 70 }), field("height", "Height", { suffix: "cm", value: 170 }), {id:"activity",label:"Activity level",type:"select",options:[[1.2,"Sedentary"],[1.375,"Lightly active"],[1.55,"Moderately active"],[1.725,"Very active"]]}], calc:v=>{const bmr=10*v.weight+6.25*v.height-5*v.age+(v.sex==="male"?5:-161),cal=bmr*v.activity;return{value:number(cal,0)+" kcal / day",detail:`Estimated BMR: ${number(bmr,0)} kcal/day. Needs vary by health and goals.`};} },
  { slug: "water-intake-calculator", name: "Water Intake Calculator", category: "Health", desc: "Get a simple daily water estimate based on weight and exercise.", formula: "Water = body weight × 35 ml + exercise minutes × 12 ml", fields: [field("weight", "Weight", { suffix: "kg", value: 70 }), field("exercise", "Daily exercise", { suffix: "minutes", value: 30 })], calc:v=>{const ml=v.weight*35+v.exercise*12;return{value:number(ml/1000,2)+" litres / day",detail:`About ${number(ml/250,0)} glasses of 250 ml. Climate, pregnancy and health conditions can change needs.`};} }
];

const popularSlugs = ["emi-calculator","sip-calculator","percentage-calculator","bmi-calculator"];
const grids = { "India Finance":"indiaGrid", International:"internationalGrid", Student:"studentGrid", Health:"healthGrid" };
const state = { current: null, resultText: "", subjectCount: 5, currency: "" };
const storageKeys = { favorites:"allcalc-favorites", recent:"allcalc-recent", history:"allcalc-history", currency:"allcalc-currency" };
const readLocal = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const writeLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable in private contexts. */ } };
const getFavorites = () => readLocal(storageKeys.favorites);
const isFavorite = slug => getFavorites().includes(slug);

function cardMarkup(calc) {
  const icon = calc.category === "India Finance" ? "₹" : calc.category === "International" ? "$" : calc.category === "Student" ? "›" : "+";
  const favorite = isFavorite(calc.slug);
  return `<article class="calculator-card" data-search="${calc.name.toLowerCase()} ${calc.category.toLowerCase()}"><button class="favorite-button" type="button" data-favorite="${calc.slug}" aria-label="${favorite?"Remove":"Add"} ${calc.name} ${favorite?"from":"to"} favorites" aria-pressed="${favorite}">${favorite?"♥":"♡"}</button><span class="card-arrow" aria-hidden="true">${icon}</span><h3>${calc.name}</h3><p>${calc.desc}</p><span class="card-cta">${calc.category === "Health" ? "Open" : "Calculate →"}</span><a href="#${calc.slug}" aria-label="Open ${calc.name}"></a></article>`;
}

function personalItemMarkup(calc) {
  return `<a class="personal-item" href="#${calc.slug}"><strong>${calc.name}</strong><span>${calc.category} →</span></a>`;
}

function renderPersonalSections() {
  const favorites=getFavorites().map(slug=>calculators.find(c=>c.slug===slug)).filter(Boolean);
  const recent=readLocal(storageKeys.recent).map(slug=>calculators.find(c=>c.slug===slug)).filter(Boolean).slice(0,8);
  document.getElementById("favoritesList").innerHTML=favorites.length?favorites.map(personalItemMarkup).join(""):`<p class="personal-empty">Use the heart on any calculator to save it here.</p>`;
  document.getElementById("recentList").innerHTML=recent.length?recent.map(personalItemMarkup).join(""):`<p class="personal-empty">Calculators you open will appear here.</p>`;
}

function toggleFavorite(slug) {
  const favorites=getFavorites(),next=favorites.includes(slug)?favorites.filter(item=>item!==slug):[...favorites,slug];
  writeLocal(storageKeys.favorites,next);
  document.querySelectorAll(`[data-favorite="${slug}"]`).forEach(button=>{const active=next.includes(slug),calc=calculators.find(c=>c.slug===slug);button.textContent=active?"♥":"♡";button.setAttribute("aria-pressed",String(active));button.setAttribute("aria-label",`${active?"Remove":"Add"} ${calc.name} ${active?"from":"to"} favorites`);});
  renderPersonalSections();
}

function syncFavoriteButtons() {
  document.querySelectorAll("[data-favorite]").forEach(button=>{const slug=button.dataset.favorite,active=isFavorite(slug),calc=calculators.find(c=>c.slug===slug);button.textContent=active?"♥":"♡";button.setAttribute("aria-pressed",String(active));button.setAttribute("aria-label",`${active?"Remove":"Add"} ${calc.name} ${active?"from":"to"} favorites`);});
}

function recordRecent(slug) {
  const recent=readLocal(storageKeys.recent).filter(item=>item!==slug);
  writeLocal(storageKeys.recent,[slug,...recent].slice(0,8));
  renderPersonalSections();
}

function renderDirectory() {
  document.getElementById("popularGrid").innerHTML = popularSlugs.map(slug => cardMarkup(calculators.find(c => c.slug === slug))).join("");
  Object.entries(grids).forEach(([category,id]) => {
    let items = calculators.filter(c => c.category === category);
    if (category === "Student") items = items.filter(c => c.slug !== "cgpa-calculator");
    document.getElementById(id).innerHTML = items.map(cardMarkup).join("");
  });
  renderPersonalSections();
  syncFavoriteButtons();
}

function fieldMarkup(f) {
  if (f.type === "select") return `<div class="field"><label for="${f.id}">${f.label}</label><div class="input-shell"><select id="${f.id}" name="${f.id}">${f.options.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></div></div>`;
  const affix = f.suffix ? `<span class="input-affix">${f.suffix}</span>` : "";
  const prefix = f.prefix ? `<span class="input-affix money-affix" style="border-left:0;border-right:1px solid var(--border)">${f.prefix}</span>` : "";
  return `<div class="field"><label for="${f.id}">${f.label}</label><div class="input-shell">${prefix}<input id="${f.id}" name="${f.id}" type="${f.type}" value="${f.value ?? ""}" ${f.type === "number" ? `min="${f.min ?? 0}" ${f.max ? `max="${f.max}"` : ""} step="${f.step ?? "any"}" inputmode="decimal"` : ""} required>${affix}</div></div>`;
}

function currencyControlMarkup(calc) {
  if(!["India Finance","International"].includes(calc.category))return "";
  const defaultCurrency=calc.category==="India Finance"?"INR":"USD",selected=readLocal(storageKeys.currency,defaultCurrency);
  state.currency=["INR","USD","GBP","EUR"].includes(selected)?selected:defaultCurrency;
  return `<div class="currency-control"><label for="currencySelect">Display currency</label><select id="currencySelect" aria-describedby="currencyNote"><option value="INR" ${state.currency==="INR"?"selected":""}>₹ INR</option><option value="USD" ${state.currency==="USD"?"selected":""}>$ USD</option><option value="GBP" ${state.currency==="GBP"?"selected":""}>£ GBP</option><option value="EUR" ${state.currency==="EUR"?"selected":""}>€ EUR</option></select><small id="currencyNote">Changes the currency label only; it does not apply an exchange rate.</small></div>`;
}

function applyCurrencyDisplay(result) {
  if(!state.currency)return result;
  const symbols={INR:"₹",USD:"$",GBP:"£",EUR:"€"},symbol=symbols[state.currency];
  return {value:result.value.replace(/[₹$£€]/g,symbol),detail:result.detail.replace(/[₹$£€]/g,symbol)};
}

function workedExampleMarkup(calc) {
  if(calc.custom==="cgpa")return `<h3>Worked example</h3><p>Suppose three subjects have 4 credits each and grade points of 8, 9 and 8. Their total credit points are 32 + 36 + 32 = 100. Divide 100 by 12 total credits to get a CGPA of <strong>8.33</strong>.</p>`;
  try {
    const values={};
    calc.fields.forEach(f=>values[f.id]=f.type==="select"?f.options[0][0]:f.value);
    const result=calc.calc(values),inputs=calc.fields.slice(0,3).map(f=>`${f.label}: ${f.type==="select"?f.options[0][1]:f.value}`).join(", ");
    return `<h3>Worked example</h3><p>Using the sample values ${inputs}, the calculator returns <strong>${result.value}</strong>. ${result.detail} Change one input at a time to see how it affects the result.</p>`;
  } catch { return ""; }
}

function cgpaMarkup() {
  return `<div class="cgpa-setup"><div class="field"><label for="subjectCount">Number of Semesters/Subjects</label><div class="input-shell"><input id="subjectCount" type="number" min="1" max="30" value="5" inputmode="numeric"></div></div><button class="button button-primary" id="setSubjects" type="button">Set</button></div><div class="subject-head" aria-hidden="true"><span>Subject label</span><span>Grade points</span><span>Credits</span></div><div id="subjectRows"></div>`;
}

function subjectRow(index) {
  return `<div class="subject-row"><div class="field"><label class="sr-only" for="subject${index}">Subject ${index + 1} label</label><div class="input-shell"><input id="subject${index}" class="subject-label" type="text" placeholder="e.g. Mathematics"></div></div><div class="field"><label class="sr-only" for="grade${index}">Subject ${index + 1} grade points</label><div class="input-shell"><input id="grade${index}" class="subject-grade" type="number" min="0" max="10" step="0.01" placeholder="Points" required></div></div><div class="field"><label class="sr-only" for="credits${index}">Subject ${index + 1} credits</label><div class="input-shell"><input id="credits${index}" class="subject-credit" type="number" min="0.5" step="0.5" placeholder="Credits" required></div></div></div>`;
}

function detailSidebarMarkup(calc) {
  const items = [["Student","◇","Student Tools","student-section"],["India Finance","▣","India Finance","india-section"],["International","◎","International","international-section"],["Health","⌁","Health","health-section"]];
  return `<aside class="detail-sidebar" aria-label="Calculator categories"><div class="sidebar-title"><strong>Categories</strong><span>22+ Professional Tools</span></div><nav>${items.map(([category,icon,label,target])=>`<a class="${calc.category===category?"active":""}" href="#${target}"><span>${icon}</span>${label}</a>`).join("")}</nav></aside>`;
}

function quickCgpaMarkup() {
  return `<section class="quick-tools" aria-label="Quick CGPA conversions"><div class="quick-card"><h2>↯ &nbsp; CGPA to Percentage</h2><div class="input-shell"><input id="quickCgpa" type="number" min="0" max="10" step="0.01" placeholder="Enter CGPA (e.g. 8.5)"></div><button class="button quick-button" id="quickPercentageButton" type="button">Convert (× 9.5)</button><p id="quickPercentageResult" aria-live="polite"></p></div><div class="quick-card"><h2>↯ &nbsp; SGPA to CGPA</h2><div class="input-shell"><input id="quickSgpa" type="text" placeholder="Enter SGPAs (e.g. 8, 9, 7.5)"></div><button class="button quick-button" id="quickSgpaButton" type="button">Average SGPA</button><p id="quickSgpaResult" aria-live="polite"></p></div></section>`;
}

function historyMarkup(calc) {
  return `<section class="content-card history-card"><div class="history-heading"><h2>Calculation history</h2><button class="text-button" id="clearHistory" type="button">Clear</button></div><div id="historyList"></div><p class="history-note">History stays on this device only.</p></section>`;
}

function renderHistory(calc) {
  const target=document.getElementById("historyList");
  if(!target)return;
  const items=readLocal(storageKeys.history).filter(item=>item.slug===calc.slug).slice(0,6);
  target.innerHTML=items.length?items.map(item=>`<div class="history-item"><strong>${item.value}</strong><span>${item.detail}</span><time datetime="${item.time}">${new Date(item.time).toLocaleString()}</time></div>`).join(""):`<p class="personal-empty">Your recent results for this calculator will appear here.</p>`;
}

function saveHistory(calc, result) {
  const history=readLocal(storageKeys.history);
  history.unshift({slug:calc.slug,value:result.value,detail:result.detail,time:new Date().toISOString()});
  writeLocal(storageKeys.history,history.slice(0,30));
  renderHistory(calc);
}

function guideMarkup(calc) {
  const specific = calc.note || `${calc.name} turns the values you enter into a practical estimate using the formula shown below. It is useful for quick comparisons, planning and checking a manual calculation.`;
  return `<section class="content-card"><h2>How to use this ${calc.name.toLowerCase()}</h2><p>${specific}</p><p>Enter your information in the labelled fields and select <strong>Calculate</strong>. AllCalc validates the inputs, applies the formula, and shows the main answer with a useful breakdown. Try different values to compare scenarios. Use Reset to restore the example values, Copy Result to place the answer on your clipboard, or Share Calculator to send a link without sharing the numbers you entered.</p><p>Start with values that reflect your current situation, then change one assumption at a time. This makes comparisons easier to understand. For example, you can test a different rate, time period, contribution, grade or target while keeping the other inputs unchanged. Record the assumptions alongside the result if you plan to discuss it with someone else. A result is most useful when everyone understands which numbers and rules produced it.</p><h3>Formula used</h3><p class="formula">${calc.formula}</p>${workedExampleMarkup(calc)}<p>The formula converts the inputs into one primary result, while the breakdown provides context that can help you interpret it. Units matter: percentages should be entered as ordinary percentages, money fields should use the displayed currency, and time fields should match the label. Avoid commas or currency symbols inside number inputs; the formatted result adds them automatically.</p><p>Results are rounded for readability, so a provider, institution or spreadsheet may differ slightly. Interest calculators assume a consistent rate and regular schedule. Academic policies and conversion rules vary by institution. Health tools provide broad screening estimates and cannot account for every personal factor. For important decisions, confirm the assumptions and use the official rules that apply to you.</p></section>`;
}

function faqFor(calc) {
  const faqs = [
    ["Is this calculator free to use?", `Yes. The ${calc.name} is free and runs entirely in your browser without an account.`],
    ["How accurate is the result?", `The arithmetic follows the displayed formula. Real-world results can differ when rates, fees, rounding rules or institutional policies use other assumptions.`],
    ["Does AllCalc save my inputs?", "No. Input values are used for the calculation in your current browser page and are not intentionally stored or sent to a server."],
    ["Can I use the result for an official decision?", "Treat it as an estimate. Check the result with the relevant lender, tax professional, university or healthcare professional when accuracy has important consequences."]
  ];
  return { faqs, markup: `<section class="content-card"><h2>Frequently asked questions</h2>${faqs.map(([q,a])=>`<details class="faq-item"><summary>${q}</summary><p>${a}</p></details>`).join("")}</section>` };
}

function renderCalculator(calc) {
  state.current = calc;
  state.resultText = "";
  state.currency = "";
  recordRecent(calc.slug);
  document.title = `${calc.name} - Free Online Tool | AllCalc`;
  document.querySelector('meta[name="description"]').content = `${calc.desc} Use AllCalc's fast, free and mobile-friendly ${calc.name.toLowerCase()}.`;
  const related = calculators.filter(c => c.category === calc.category && c.slug !== calc.slug).slice(0,4);
  const faq = faqFor(calc);
  document.getElementById("faqSchema").textContent = JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq.faqs.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))});
  const view = document.getElementById("calculatorView");
  const result = `<section class="result-box" id="resultBox" hidden tabindex="-1"><p class="result-label">Your result</p><p class="result-value" id="resultValue"></p><p class="result-detail" id="resultDetail"></p><div class="result-actions"><button class="button button-secondary" type="button" id="copyResult">Copy Result</button><button class="button button-secondary" type="button" id="shareCalculator">Share Calculator</button></div></section>`;
  const relatedMarkup = `<section class="content-card"><h2>Related calculators</h2><div class="related-links">${related.map(c=>`<a href="#${c.slug}">${c.name}</a>`).join("")}</div></section>${historyMarkup(calc)}`;
  const ad = `<div class="ad-placeholder detail-ad"><span>Advertisement Placeholder</span><!-- AdSense Ad Placeholder --></div>`;
  let body;
  if (calc.custom === "cgpa") {
    body = `${ad}<section class="tool-card cgpa-tool-card"><form id="calculatorForm" novalidate><div class="cgpa-form-content">${cgpaMarkup()}</div><p class="error-message" id="formError" role="alert"></p><div class="button-row"><button class="button button-primary" type="submit">Calculate CGPA</button><button class="button button-secondary" type="reset">Reset</button></div></form>${result}</section>${ad}${quickCgpaMarkup()}<div class="content-column detail-content">${guideMarkup(calc)}${faq.markup}${relatedMarkup}</div>`;
  } else {
    body = `${ad}<div class="calculator-layout"><section class="tool-card"><h2>Enter your details</h2><form id="calculatorForm" novalidate>${currencyControlMarkup(calc)}<div class="fields-grid">${calc.fields.map(fieldMarkup).join("")}</div><p class="error-message" id="formError" role="alert"></p><div class="button-row"><button class="button button-primary" type="submit">Calculate</button><button class="button button-secondary" type="reset">Reset</button></div></form>${result}<div class="ad-placeholder"><span>Advertisement</span><!-- AdSense Ad Placeholder --></div></section><div class="content-column">${guideMarkup(calc)}${faq.markup}${relatedMarkup}</div></div>`;
  }
  const eyebrow = calc.category === "Student" ? "✣ &nbsp; Academic excellence" : `✣ &nbsp; ${calc.category}`;
  const favorite=isFavorite(calc.slug);
  view.innerHTML = `<div class="detail-shell">${detailSidebarMarkup(calc)}<div class="detail-main"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><span>${calc.name}</span></nav><header class="calculator-header"><button class="detail-favorite" type="button" data-favorite="${calc.slug}" aria-label="${favorite?"Remove":"Add"} ${calc.name} ${favorite?"from":"to"} favorites" aria-pressed="${favorite}">${favorite?"♥":"♡"}</button><span class="card-tag">${eyebrow}</span><h1>Professional ${calc.name}</h1><p>${calc.desc} Designed for clarity, accuracy, and easy comparison.</p></header>${body}</div></div>`;
  document.getElementById("homeView").hidden = true;
  document.querySelector(".info-pages").hidden = true;
  view.hidden = false;
  wireCalculator(calc);
  renderHistory(calc);
  window.scrollTo({top:0,behavior:"instant"});
}

function renderSubjectRows(count) {
  state.subjectCount = Math.max(1, Math.min(30, count));
  document.getElementById("subjectCount").value = state.subjectCount;
  document.getElementById("subjectRows").innerHTML = Array.from({length:state.subjectCount},(_,i)=>subjectRow(i)).join("");
}

function wireCalculator(calc) {
  const form = document.getElementById("calculatorForm");
  if (calc.custom === "cgpa") {
    renderSubjectRows(5);
    document.getElementById("setSubjects").addEventListener("click", () => renderSubjectRows(Number(document.getElementById("subjectCount").value)));
    document.getElementById("quickPercentageButton").addEventListener("click", () => { const cgpa=Number(document.getElementById("quickCgpa").value),out=document.getElementById("quickPercentageResult"); out.textContent=Number.isFinite(cgpa)&&cgpa>=0&&cgpa<=10?`${number(cgpa*9.5)}% (indicative)`:"Enter a CGPA from 0 to 10."; });
    document.getElementById("quickSgpaButton").addEventListener("click", () => { const values=document.getElementById("quickSgpa").value.split(",").map(v=>Number(v.trim())).filter(Number.isFinite),out=document.getElementById("quickSgpaResult"); out.textContent=values.length?`Average: ${number(values.reduce((a,b)=>a+b,0)/values.length,3)}`:"Enter SGPAs separated by commas."; });
  }
  const currencySelect=document.getElementById("currencySelect");
  if(currencySelect){const updateCurrency=()=>{state.currency=currencySelect.value;writeLocal(storageKeys.currency,state.currency);const symbol={INR:"₹",USD:"$",GBP:"£",EUR:"€"}[state.currency];document.querySelectorAll(".money-affix").forEach(item=>item.textContent=symbol);["resultValue","resultDetail"].forEach(id=>{const item=document.getElementById(id);if(item)item.textContent=item.textContent.replace(/[₹$£€]/g,symbol);});state.resultText=state.resultText.replace(/[₹$£€]/g,symbol);};updateCurrency();currencySelect.addEventListener("change",updateCurrency);}
  form.addEventListener("submit", e => { e.preventDefault(); calculate(calc); });
  form.addEventListener("reset", () => setTimeout(() => { document.getElementById("resultBox").hidden = true; document.getElementById("formError").textContent = ""; if(calc.custom === "cgpa")renderSubjectRows(5); },0));
  document.getElementById("copyResult").addEventListener("click", copyResult);
  document.getElementById("shareCalculator").addEventListener("click", shareCalculator);
  document.getElementById("clearHistory").addEventListener("click",()=>{writeLocal(storageKeys.history,readLocal(storageKeys.history).filter(item=>item.slug!==calc.slug));renderHistory(calc);});
}

function calculate(calc) {
  const error = document.getElementById("formError");
  error.textContent = "";
  try {
    let result;
    if (calc.custom === "cgpa") {
      const credits=[...document.querySelectorAll(".subject-credit")].map(i=>Number(i.value));
      const grades=[...document.querySelectorAll(".subject-grade")].map(i=>Number(i.value));
      if(credits.some(v=>!Number.isFinite(v)||v<=0)||grades.some(v=>!Number.isFinite(v)||v<0||v>10))throw new Error("Enter valid credits and grade points from 0 to 10 for every subject.");
      const total=credits.reduce((a,b)=>a+b,0),points=credits.reduce((sum,c,i)=>sum+c*grades[i],0);
      result={value:number(points/total,3),detail:`Total credit points: ${number(points)} · Total credits: ${number(total)}`};
    } else {
      const values={};
      calc.fields.forEach(f=>{const el=document.getElementById(f.id);values[f.id]=f.type==="number"?Number(el.value):el.value;if(f.type==="select"&&!Number.isNaN(Number(values[f.id]))&&values[f.id]!=="")values[f.id]=Number(values[f.id]);});
      const numeric=calc.fields.filter(f=>f.type==="number").map(f=>values[f.id]);
      if(numeric.some(v=>!Number.isFinite(v)||v<0))throw new Error("Enter valid non-negative numbers in every field.");
      if(calc.slug==="age-calculator" && (!values.dob || new Date(values.dob)>new Date()))throw new Error("Choose a valid date of birth in the past.");
      if(["percentage-calculator","salary-to-hourly-calculator"].includes(calc.slug) && numeric.includes(0))throw new Error("The divisor must be greater than zero.");
      result=calc.calc(values);
    }
    if(state.currency)result=applyCurrencyDisplay(result);
    if(!result || /NaN|Infinity/.test(result.value))throw new Error("Check the values and try again.");
    document.getElementById("resultValue").textContent=result.value;
    document.getElementById("resultDetail").textContent=result.detail;
    const box=document.getElementById("resultBox");box.hidden=false;box.focus();
    state.resultText=`${calc.name}: ${result.value}. ${result.detail}`;
    saveHistory(calc,result);
  } catch (err) { error.textContent=err.message; document.getElementById("resultBox").hidden=true; }
}

async function copyResult() {
  const button=document.getElementById("copyResult");
  try { await navigator.clipboard.writeText(state.resultText); button.textContent="Copied!"; } catch { button.textContent="Copy unavailable"; }
  setTimeout(()=>button.textContent="Copy Result",1600);
}

async function shareCalculator() {
  const data={title:`${state.current.name} | AllCalc`,text:state.resultText||state.current.desc,url:location.href};
  if(navigator.share){try{await navigator.share(data);}catch(err){if(err.name!=="AbortError")copyLink();}}else copyLink();
}
async function copyLink(){const b=document.getElementById("shareCalculator");try{await navigator.clipboard.writeText(location.href);b.textContent="Link copied!";}catch{b.textContent="Share unavailable";}setTimeout(()=>b.textContent="Share Calculator",1600);}

function showHome(target) {
  state.current=null; document.title="AllCalc - Fast Free Online Calculators";
  document.querySelector('meta[name="description"]').content="AllCalc offers fast, free calculators for finance, students, health and everyday decisions in India and worldwide.";
  document.getElementById("calculatorView").hidden=true;document.getElementById("homeView").hidden=false;document.querySelector(".info-pages").hidden=false;
  if(target && target!=="home")setTimeout(()=>document.getElementById(target)?.scrollIntoView(),0);else window.scrollTo({top:0,behavior:"instant"});
}

function route() {
  const slug=location.hash.slice(1)||"home",calc=calculators.find(c=>c.slug===slug);
  if(calc)renderCalculator(calc);else showHome(slug);
}

function setupSearch() {
  const input=document.getElementById("calculatorSearch"),status=document.getElementById("searchStatus"),suggestions=document.getElementById("searchSuggestions");
  input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();const matches=new Set();document.querySelectorAll(".calculator-card").forEach(card=>{const show=!q||card.dataset.search.includes(q);card.hidden=!show;if(show)matches.add(card.querySelector("h3").textContent);});const featured=document.querySelector(".student-feature");const showFeatured=!q||featured.dataset.search.includes(q);featured.hidden=!showFeatured;if(showFeatured)matches.add("CGPA Calculator");document.querySelectorAll(".category-section").forEach(s=>s.hidden=![...s.querySelectorAll(".calculator-card")].some(c=>!c.hidden)&&!s.querySelector(".student-feature:not([hidden])"));document.getElementById("noResults").hidden=matches.size!==0;status.textContent=q?`${matches.size} matching calculator${matches.size===1?"":"s"}`:"";const results=q?calculators.filter(c=>`${c.name} ${c.category} ${c.slug}`.toLowerCase().includes(q)).slice(0,6):[];suggestions.innerHTML=results.map(c=>`<a role="option" href="#${c.slug}"><strong>${c.name}</strong><span>${c.category}</span></a>`).join("");suggestions.hidden=!results.length;input.setAttribute("aria-expanded",String(results.length>0));});
  input.addEventListener("keydown",e=>{if(e.key==="ArrowDown"&&!suggestions.hidden){e.preventDefault();suggestions.querySelector("a")?.focus();}if(e.key==="Escape"){suggestions.hidden=true;input.setAttribute("aria-expanded","false");}});
  suggestions.addEventListener("click",()=>{suggestions.hidden=true;input.setAttribute("aria-expanded","false");});
  document.addEventListener("keydown",e=>{if(e.key==="/"&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();input.focus();}});
}

function setupHeaderSearch() {
  const input=document.getElementById("headerCalculatorSearch"),suggestions=document.getElementById("headerSearchSuggestions");
  const close=()=>{suggestions.hidden=true;input.setAttribute("aria-expanded","false");};
  input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase(),results=q?calculators.filter(c=>`${c.name} ${c.category} ${c.slug}`.toLowerCase().includes(q)).slice(0,6):[];suggestions.innerHTML=results.map(c=>`<a role="option" href="#${c.slug}"><strong>${c.name}</strong><span>${c.category}</span></a>`).join("");suggestions.hidden=!results.length;input.setAttribute("aria-expanded",String(results.length>0));});
  input.addEventListener("keydown",e=>{if(e.key==="ArrowDown"&&!suggestions.hidden){e.preventDefault();suggestions.querySelector("a")?.focus();}if(e.key==="Escape")close();});
  suggestions.addEventListener("click",()=>{input.value="";close();});
}

function setupPersonalization() {
  document.addEventListener("click",e=>{const button=e.target.closest("[data-favorite]");if(!button)return;e.preventDefault();e.stopPropagation();toggleFavorite(button.dataset.favorite);});
}

function setupTheme() {
  const saved=localStorage.getItem("allcalc-theme");
  document.documentElement.dataset.theme=saved==="dark"?"dark":"light";
  const button=document.getElementById("themeToggle");
  const update=()=>button.setAttribute("aria-label",document.documentElement.dataset.theme==="dark"?"Switch to light mode":"Switch to dark mode");update();
  button.addEventListener("click",()=>{const dark=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=dark?"light":"dark";localStorage.setItem("allcalc-theme",dark?"light":"dark");update();});
}

function setupPWA() {
  const installButton=document.getElementById("installButton");
  let installPrompt=null;
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event;installButton.hidden=false;});
  installButton.addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true;});
  window.addEventListener("appinstalled",()=>{installPrompt=null;installButton.hidden=true;});
  if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
}

renderDirectory();setupSearch();setupHeaderSearch();setupTheme();setupPersonalization();setupPWA();document.getElementById("currentYear").textContent=new Date().getFullYear();window.addEventListener("hashchange",route);route();
