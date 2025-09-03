/**
 * @file calendar.js
 * @description
 * 本文件是一个全面的日历计算工具库，主要用于处理中国农历。
 * 它基于一个包含1900-2050年农历信息的紧凑数据集，能够进行公历到农历的转换，
 * 计算节气、法定节假日、传统节日以及其他特殊日期（如三伏天）。
 *
 * @module components/ui/holiday/calendar
 */

// --- 数据定义 ---

/** @const {number[]} lunarInfo - 农历数据压缩表。每个16进制数包含了某一年的闰月信息、大小月信息。*/
const lunarInfo = [0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0xd954, 0x0d4a0, 0xda50, 0x07552, 0x056a0, 0xabb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0];
/** @const {string[]} solarTerm - 24节气的名称列表。*/
const solarTerm = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"];
/** @const {number[]} sTermInfo - 24节气的时间偏移量数据，用于计算具体日期。*/
const sTermInfo = [0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758];
/** @const {object[]} sFtv - 公历（阳历）固定节日列表。*/
const sFtv = [
    { date: "0101", name: "元旦", start: 1949 },
    { date: "0110", name: "警察节", start: 2021 },
    { date: "0214", name: "情人节" },
    { date: "0308", name: "妇女节", start: 1949 },
    { date: "0312", name: "植树节", start: 1979 },
    { date: "0315", name: "消费者日", start: 1983 },
    { date: "0401", name: "愚人节" },
    { date: "0501", name: "劳动节", start: 1949 },
    { date: "0504", name: "青年节", start: 1949 },
    { date: "0512", name: "护士节", start: 1912 },
    { date: "0601", name: "儿童节", start: 1949 },
    { date: "0701", name: "建党节", start: 1921 },
    { date: "0707", name: "七七事变", start: 1937 },
    { date: "0801", name: "建军节", start: 1927 },
    { date: "0815", name: "日本投降日", start: 1945 },
    { date: "0903", name: "抗战胜利纪念日", start: 1945 },
    { date: "0910", name: "教师节", start: 1985 },
    { date: "0918", name: "九一八事变", start: 1931 },
    { date: "1001", name: "国庆节", start: 1949 },
    { date: "1213", name: "国家公祭日", start: 2014 },
    { date: "1224", name: "平安夜" },
    { date: "1225", name: "圣诞节" },
];
/** @const {object[]} lFtv - 农历（阴历）固定节日列表。*/
const lFtv = [
    { date: "0101", name: "春节" },
    { date: "0115", name: "元宵节" },
    { date: "0202", name: "龙抬头" },
    { date: "0505", name: "端午节" },
    { date: "0707", name: "七夕" },
    { date: "0715", name: "中元节" },
    { date: "0815", name: "中秋节" },
    { date: "0909", name: "重阳节" },
    { date: "1208", name: "腊八节" },
    { date: "1223", name: "北方小年" },
    { date: "1224", name: "南方小年" },
];

// --- 日历核心计算函数 ---
/** @description 计算农历y年一整年的总天数。*/
function lYearDays(y) { let i, sum = 348; for (i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0; return (sum + leapDays(y)); }
/** @description 计算农历y年闰月的天数。*/
function leapDays(y) { if (leapMonth(y)) return ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29); else return (0); }
/** @description 计算农历y年闰哪个月，返回值是月份，0为不闰。*/
function leapMonth(y) { return (lunarInfo[y - 1900] & 0xf); }
/** @description 计算农历y年m月的总天数。*/
export function monthDays(y, m) { return ((lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29); }
/**
 * @description 核心的公历转农历函数。
 * 这是一个复杂的算法，通过与1900年1月31日的偏移量来计算目标日期的农历信息。
 * @param {Date} objDate - 需要转换的公历日期对象。
 * @returns {object} 一个包含农历年、月、日、是否闰月等信息的对象。
 */
export function Dianaday(objDate) {
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const utcTarget = Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate());
    const utcBase = Date.UTC(1900, 0, 31);
    var offset = (utcTarget - utcBase) / msPerDay;

    var i, leap = 0, temp = 0;
    this.dayCyl = offset + 40; this.monCyl = 14; for (i = 1900; i < 2050 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; this.monCyl += 12; } if (offset < 0) { offset += temp; i--; this.monCyl -= 12; } this.year = i; this.yearCyl = i - 1864; leap = leapMonth(i); this.isLeap = false; for (i = 1; i < 13 && offset > 0; i++) { if (leap > 0 && i == (leap + 1) && this.isLeap == false) { --i; this.isLeap = true; temp = leapDays(this.year); } else { temp = monthDays(this.year, i); } if (this.isLeap == true && i == (leap + 1)) this.isLeap = false; offset -= temp; if (this.isLeap == false) this.monCyl++; } if (offset == 0 && leap > 0 && i == leap + 1) if (this.isLeap) { this.isLeap = false; } else { this.isLeap = true; --i; --this.monCyl; } if (offset < 0) { offset += temp; --i; --this.monCyl; } this.month = i; this.day = offset + 1;
}

// --- 三伏天特定日期 ---
// 由于三伏天计算复杂（基于夏至后的第三个庚日），为保证准确性，此处使用预先查定的日期。
const sanfuData = {
    2023: { rufu: '07-11', zhongfu: '07-21', mofu: '08-10' },
    2024: { rufu: '07-15', zhongfu: '07-25', mofu: '08-14' },
    2025: { rufu: '07-20', zhongfu: '07-30', mofu: '08-09' },
    2026: { rufu: '07-15', zhongfu: '07-25', mofu: '08-14' },
    2027: { rufu: '07-15', zhongfu: '07-25', mofu: '08-14' },
    2028: { rufu: '07-19', zhongfu: '07-29', mofu: '08-08' },
    2029: { rufu: '07-14', zhongfu: '07-24', mofu: '08-13' },
    2030: { rufu: '07-19', zhongfu: '07-29', mofu: '08-08' },
};

/**
 * @description 获取指定年份的三伏天日期。
 * @param {number} year - 年份。
 * @returns {object[]} 包含入伏、中伏、末伏日期对象的数组。
 */
function getSanfuDates(year) {
    const dates = sanfuData[year];
    if (!dates) return [];
    
    const rufuDateParts = dates.rufu.split('-');
    const zhongfuDateParts = dates.zhongfu.split('-');
    const mofuDateParts = dates.mofu.split('-');

    return [
        { name: '入伏', date: new Date(year, parseInt(rufuDateParts[0]) - 1, parseInt(rufuDateParts[1])) },
        { name: '中伏', date: new Date(year, parseInt(zhongfuDateParts[0]) - 1, parseInt(zhongfuDateParts[1])) },
        { name: '末伏', date: new Date(year, parseInt(mofuDateParts[0]) - 1, parseInt(mofuDateParts[1])) }
    ];
}

/**
 * @description 获取指定公历年份的所有节日和节气。
 * @param {number} year - 需要查询的年份。
 * @returns {object[]} 一个按日期排序的、包含所有事件（节日、节气）的数组。
 */
export function getAllHolidaysForYear(year) {
    let allEvents = [];
    
    /** @description 内部辅助函数，用于将指定的农历月日转换为当年的公历日期。*/
    function getSolarDateForLunar(targetYear, lunarMonth, lunarDay) {
        for (let i = 0; i < 366; i++) {
            const checkDate = new Date(targetYear, 0, 1);
            checkDate.setDate(checkDate.getDate() + i);
            if (checkDate.getFullYear() !== targetYear) break;
            const lunarDateInfo = new Dianaday(checkDate);
            if (lunarDateInfo.month === lunarMonth && lunarDateInfo.day === lunarDay && !lunarDateInfo.isLeap) return checkDate;
        }
        return null;
    }

    // 1. 计算公历节日
    sFtv.forEach(holiday => {
        if (holiday.start && year < holiday.start) {
            return;
        }
        const month = parseInt(holiday.date.substr(0, 2));
        const day = parseInt(holiday.date.substr(2, 2));
        allEvents.push({ name: holiday.name, date: new Date(year, month - 1, day) });
    });

    // 2. 计算农历节日
    const allLunarHolidays = [...lFtv, { date: "1230", name: "除夕" }];
    allLunarHolidays.forEach(holiday => {
        const name = holiday.name;
        // 除夕的特殊处理逻辑
        if (name === '除夕') {
            // 要找到公历年份 `year` 内的除夕，我们需要先找到该年的春节（正月初一），然后往前推一天。
            const cnyDate = getSolarDateForLunar(year, 1, 1);
            if (cnyDate) {
                let eveDate = new Date(cnyDate);
                eveDate.setDate(eveDate.getDate() - 1);
                // 确保计算出的除夕日期仍然在目标年份内
                if (eveDate.getFullYear() === year) {
                    allEvents.push({ name: '除夕', date: eveDate });
                }
            }
        } else {
            const lMonth = parseInt(holiday.date.substr(0, 2));
            const lDay = parseInt(holiday.date.substr(2, 2));
            const holidayDate = getSolarDateForLunar(year, lMonth, lDay);
            if (holidayDate) allEvents.push({ name: holiday.name, date: holidayDate });
        }
    });

    // 3. 计算24节气
    solarTerm.forEach((termName, i) => {
        const offDate = new Date((31556925974.7 * (year - 1900) + sTermInfo[i] * 60000) + Date.UTC(1900, 0, 6, 2, 5));
        allEvents.push({ name: termName, date: new Date(offDate.getUTCFullYear(), offDate.getUTCMonth(), offDate.getUTCDate()) });
    });

    // 4. 计算按周计算的节日（如母亲节）
    const mayFirst = new Date(year, 4, 1);
    const mothersDay = new Date(year, 4, 1 + (7 - mayFirst.getDay() + 7) % 7 + 7);
    allEvents.push({ name: '母亲节', date: mothersDay });

    const juneFirst = new Date(year, 5, 1);
    const fathersDay = new Date(year, 5, 1 + (7 - juneFirst.getDay() + 7) % 7 + 14);
    allEvents.push({ name: '父亲节', date: fathersDay });

    const novFirst = new Date(year, 10, 1);
    const thanksgivingDay = new Date(year, 10, 1 + (4 - novFirst.getDay() + 7) % 7 + 21);
    allEvents.push({ name: '感恩节', date: thanksgivingDay });
    
    // 5. 添加三伏天
    const sanfuDates = getSanfuDates(year);
    allEvents.push(...sanfuDates);

    // 6. 按日期排序并返回最终结果
    return allEvents.sort((a, b) => a.date - b.date);
}

/**
 * @description 检查当前日期是否处于中国新年期间（除夕到正月初十）。
 * @returns {boolean} 如果是，则返回true。
 */
export function isNewYearPeriod() {
    const today = new Date();
    const lunarDate = new Dianaday(today);

    // 情况一：正月初一到初十
    if (lunarDate.month === 1 && lunarDate.day >= 1 && lunarDate.day <= 10) {
        return true;
    }

    // 情况二：腊月最后一天（除夕）
    if (lunarDate.month === 12) {
        const daysInLastMonth = monthDays(lunarDate.year, 12);
        if (lunarDate.day === daysInLastMonth) {
            return true;
        }
    }

    return false;
}
