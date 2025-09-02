import { appSettings, saveSettings } from './settings.js';

let isFetchingWeather = false;

const WEATHER_TIPS = {
    spring: {
        morning: {
            clear: ["春日悠悠，阳光唤醒万物，也唤醒你。", "早上好，今天适合踏青，记得防晒哦。", "一年之计在于春，一日之计在于晨，加油！"],
            cloudy: ["早安，云朵遮不住你的好心情。", "微风拂面，春意盎然，多云天也很舒服。", "泡一杯香茗，静待云散风清。"],
            overcast: ["天空虽阴，但满是春天气息。", "阴天，宜静心思考，规划新的一周。", "记得带件薄外套，小心春寒料峭。"],
            rain: ["春雨贵如油，早安。出门带伞，小心路滑。", "细雨蒙蒙，春天低语，宜窗边阅读。", "雨天微凉，注意保暖，热茶更惬意。"],
            fog: ["雾气弥漫的清晨，仿佛置身仙境。", "大雾天气，出行请注意安全，减速慢行。", "雾散之后，便是清新的世界，请耐心等待。"],
            windy: ["春风拂面，带来花草讯息。戴好帽子哦。", "风有点大，请关好门窗，防止杨絮飞入。", "在风中，感受春天的力量与活力。"],
            default: ["早安，愿你的一天如春日般充满希望。"]
        },
        afternoon: {
            clear: ["午后阳光正好，适合公园散步。", "春日暖阳，不妨小憩片刻，恢复精力。", "紫外线渐强，午后出门别忘防晒。"],
            cloudy: ["多云午后，无烈日，宜户外活动。", "天空如画布，云朵是自由的画笔，下午好。", "喝杯下午茶，享受这份宁静的春日时光。"],
            overcast: ["阴天午后，适合室内运动或看电影。", "天气微凉，一件针织衫会让你更舒适。", "虽然没有阳光，但心情要保持明媚哦。"],
            rain: ["春雨绵绵，午后听雨别有风味。", "雨天路滑，外出请注意脚下安全。", "下雨天和巧克力更配哦！"],
            fog: ["午后雾未散，视野受限，少外出。", "室内开窗通风时，注意雾中的湿气。", "一杯热咖啡，可以驱散雾气带来的沉闷。"],
            windy: ["风和日丽，正是放风筝的好时节。", "春风得意，衣角飞扬，愿你心情轻快。", "风大的午后，皮肤容易干燥，记得保湿。"],
            default: ["下午好，愿春风带走你的疲惫。"]
        },
        evening: {
            clear: ["晴朗夜晚，星空璀璨，适合散步。", "春天的夜晚，微风和煦，月色温柔。", "忙碌了一天，享受这宁静的春夜吧。"],
            cloudy: ["云遮月光，但城市灯火依然温暖。", "多云夜晚，宜朋友小聚或独自静享。", "晚安，愿你梦里有繁花和星辰。"],
            overcast: ["阴沉夜晚，宜点灯读几页闲书。", "天气转凉，睡前记得关好窗户。", "今夜，让温暖的被窝治愈你一天的疲惫。"],
            rain: ["听，窗外雨打芭蕉，是春夜的交响曲。", "雨夜，宜早睡，伴着雨声安然入梦。", "睡前喝杯温牛奶，驱散雨夜的湿冷。"],
            fog: ["夜雾渐浓，早点回家，注意安全。", "雾中的城市，别有一番朦胧的美感。", "晚安，愿你的梦境清晰而美好。"],
            windy: ["晚风轻拂，吹散一天的烦恼。", "风大的夜晚，可能会有些声响，不用担心。", "听着风声入睡，仿佛睡在自然的怀抱里。"],
            default: ["晚安，愿你拥抱一个温柔的春夜。"]
        }
    },
    summer: {
        morning: {
            clear: ["夏日炎炎，早安！出门记得防晒补水。", "阳光正好，微风不燥，是夏日最美的清晨。", "元气满满的一天，从冰美式开始！"],
            cloudy: ["多云的早晨，躲避了烈日，享受片刻凉爽。", "早安，今天或有阵雨，出门请带伞。", "云层是天然的遮阳伞，早起锻炼正合适。"],
            overcast: ["阴天的早晨，闷热感或会加重，注意通风。", "虽无太阳，紫外线仍在，防晒别松懈。", "阴天，让夏日的浮躁沉淀下来，早安。"],
            rain: ["夏日雷雨多，早安。雷鸣时请远离窗户。", "一场大雨为夏天降温，空气都清新了。", "雨天出行，注意安全，当心积水。"],
            hot: ["清晨已热浪滚滚，今天注定热情似火。", "防暑降温是今日主题，早安！", "绿豆汤、西瓜，你的解暑神器备好了吗？"],
            windy: ["清晨的风，吹走了些许闷热，带来一丝清凉。", "风大的早晨，适合在室内做些舒缓运动。", "听，是夏天的风在唱歌。"],
            default: ["早安，愿你拥有一个充满活力的夏日开端。"]
        },
        afternoon: {
            clear: ["烈日当空，酷暑难耐，午后少出门。", "下午好，冰饮西瓜是此刻最好的慰藉。", "心静自然凉，但空调可能是更好的选择。"],
            cloudy: ["多云天紫外线仍强，备好防晒用具。", "午后犯困，小睡一会或听音乐提神。", "天气闷热，谨防中暑，多补充电解质。"],
            overcast: ["阴沉的午后，或有雷阵雨，请提前准备。", "室内昏暗，开盏灯让心情也明亮。", "这样的天气，最适合在空调房里追剧了。"],

            rain: ["午后暴雨，来去匆匆，稍等片刻再出门。", "雨后的空气格外清新，适合开窗通风。", "雨声是最好的白噪音，适合午睡。"],
            hot: ["热！下午最热，请多保重。", "减少外出，静心养神，平安度夏。", "如果可以，游泳是下午最好的选择。"],
            windy: ["大风吹过，或会带来降雨，注意天气变化。", "风大的午后，不宜进行水上活动。", "在室内感受风的凉意，也是一种享受。"],
            default: ["下午好，炎炎夏日，记得保持心平气和。"]
        },
        evening: {
            clear: ["日落余晖，晚霞似火，一天中最美。", "夏夜晚风吹散燥热，适合出门纳凉。", "萤火虫、星空、冰西瓜，是夏夜的浪漫。"],
            cloudy: ["云层遮住了月亮，但挡不住夏夜的惬意。", "晚饭后，和家人朋友散散步，聊聊天吧。", "多云的夜晚，蚊虫可能较多，注意防蚊。"],
            overcast: ["阴沉的夜晚，闷热依旧，开空调会更舒适。", "晚安，愿你摆脱烦闷，拥有清爽的梦。", "睡前冲个温水澡，有助于睡眠。"],
            rain: ["雨后夜晚，凉爽舒适，宜安然入睡。", "听着雨声，放下手机，让身心都得到放松。", "晚来风急，雨声潺潺，祝你好梦。"],
            hot: ["夜晚依旧闷热，空调电扇是好伙伴。", "睡前喝点温水，补充身体流失的水分。", "一张凉席，一个好梦，晚安。"],
            windy: ["晚风送爽，终于可以大口呼吸了。", "风大的夜晚，晾晒的衣物要收好哦。", "在风声中，结束这喧嚣的一天吧。"],
            default: ["晚安，愿夏夜的凉风吹走你所有的疲惫。"]
        }
    },
    autumn: {
        morning: {
            clear: ["秋高气爽，天朗气清，早安！", "金色的阳光洒满大地，是收获的颜色。", "天气微凉，出门记得加件薄外套。"],
            cloudy: ["多云的早晨，秋意更浓。", "云层之上，是湛蓝的秋日天空。", "一杯热咖啡，开启元气满满的一天。"],
            overcast: ["秋日阴天，别有一番萧瑟之美。", "天气转凉，注意保暖，预防感冒。", "阴天，让心绪沉淀，适合深度阅读。"],
            rain: ["一场秋雨一场寒，注意及时添衣。", "秋雨绵绵，洗尽尘埃，空气格外清新。", "雨天路滑，早安，出行请慢行。"],
            fog: ["秋雾弥漫，能见度低，晨练可改为室内。", "开车请打开雾灯，保持安全车距。", "云开雾散时，便是秋日好“枫”光。"],
            windy: ["秋风瑟瑟，落叶纷飞。戴好围巾保暖。", "风起，是秋天在提醒你加衣服啦。", "大风天空气干燥，多喝水润燥。"],
            default: ["早安，愿你的心情如秋日般静美。"]
        },
        afternoon: {
            clear: ["秋日午后，阳光正好，不冷不热最宜人。", "泡一壶桂花茶，享受这份秋日限定。", "天气干燥，别忘了给皮肤补水。"],
            cloudy: ["多云的下午，适合去郊外走走，看看红叶。", "没有阳光直射，是摄影的好时机。", "秋乏来袭，起来走动走动，伸个懒腰吧。"],
            overcast: ["阴天的午后，适合逛逛博物馆或书店。", "一杯暖暖的下午茶，能驱散阴天的沉闷。", "天色暗得早，请合理安排时间哦。"],
            rain: ["秋雨淅沥，宜窝在沙发看暖心电影。", "雨水带来了降温，注意保暖。", "这种天气，吃顿热腾腾的火锅吧？"],
            fog: ["午后有雾，不如在家整理房间，换个好心情。", "雾天湿气重，可以打开除湿机。", "迷雾之中，更要看清前行的方向。"],
            windy: ["风吹走了夏日的暑气，带来了秋的讯息。", "登高望远，感受秋风拂面的辽阔。", "风干物燥，注意用火安全。"],
            default: ["下午好，愿秋日的宁静能抚平你的烦忧。"]
        },
        evening: {
            clear: ["皓月当空，秋夜静谧，宜赏月，宜思念。", "天凉如水，晚归的人记得多穿一件。", "晚安，愿你梦里有桂花香和金色麦浪。"],
            cloudy: ["云遮月，星稀疏，但秋夜的凉爽依然。", "适合与家人围坐，共享天伦之乐。", "夜深了，早点休息，养足精神。"],
            overcast: ["阴冷的秋夜，宜早睡，宜好梦。", "睡前用热水泡泡脚，可以提高睡眠质量。", "晚安，明天又会是新的一天。"],
            rain: ["窗外雨声滴答，是秋夜的催眠曲。", "雨夜寒意重，盖好被子，别着凉。", "听雨入眠，一夜安睡到天明。"],
            fog: ["夜雾四起，非必要不外出。", "在家享受一个安静的夜晚吧。", "晚安，愿你拨开生活的迷雾，找到方向。"],
            windy: ["风声鹤唳，关好门窗，安心入睡。", "秋风起，蟹脚痒，是品尝大闸蟹的好时节。", "在风声中，静静地与世界道晚安。"],
            default: ["晚安，愿你在这收获的季节里，收获好梦。"]
        }
    },
    winter: {
        morning: {
            clear: ["冬日暖阳珍贵，早安，出门晒太阳吧！", "晴朗的冬晨，天空湛蓝，心情也随之明媚。", "虽冷，但有阳光的早晨总是充满希望。"],
            cloudy: ["没有太阳的冬晨更冷，多穿一点哦。", "起床大作战成功了吗？为你点赞！", "一杯热可可，温暖你的整个早晨。"],
            overcast: ["阴沉的早晨，仿佛世界都按下了静音键。", "注意保暖，特别是头部和脚部。", "一顿热腾腾的早餐，是对冬天最大的尊重。"],
            snow: ["下雪啦！银装素裹的世界，早安。", "瑞雪兆丰年，今天会是充满惊喜的一天。", "出门请注意防滑，慢走欣赏雪景。"],
            fog: ["大雾锁城，今天的世界充满了神秘感。", "能见度极低，出行注意安全，优选公交。", "待在室内，也是一种安全的选择。"],
            windy: ["寒风凛冽如刀割，戴好帽子围巾手套！", "今天的风，是冬天的信使。", "大风天，体感温度更低，注意防寒。"],
            cold: ["今天“冻”力十足，你是“抗冻”勇士！", "离开温暖的被窝，是今天最大的挑战。", "多喝热水，是冬天里最朴素的关心。"],
            default: ["早安，愿你有暖阳照身，有热茶暖心。"]
        },
        afternoon: {
            clear: ["午后阳光正好，是晒太阳补钙的好时机。", "找个朝南的窗边，感受猫一样的午后。", "天气虽冷，但阳光能带来温暖和力量。"],
            cloudy: ["多云的午后，光线柔和，适合在室内拍照。", "室外寒冷，不如在家做运动暖暖身子。", "一杯姜茶，可以帮你驱散寒意。"],
            overcast: ["阴冷的下午，最适合和朋友一起吃火锅。", "天色昏暗，开盏暖黄灯，营造温馨氛围。", "离天黑又近了一步，珍惜白天的时光。"],
            snow: ["雪还在下，不如堆雪人打雪仗找回童趣。", "雪景虽美，但户外不宜久留，小心冻伤。", "一杯热红酒，配上窗外的雪景，绝了。"],
            fog: ["雾气沉沉，不如静心读一本想读的书。", "减少外出，享受一个安逸的下午。", "大雾天空气质量或不佳，尽量少开窗。"],
            windy: ["狂风呼啸，是冬天的咆哮。在家最安全。", "检查窗户是否关紧，以防冷风侵入。", "这样的天气，宜“猫冬”，不宜出门。"],
            cold: ["滴水成冰的下午，你还好吗？", "用一个热水袋捂捂手，会舒服很多。", "天寒地冻，但我们对生活的热情不结冰。"],
            default: ["下午好，越是寒冷，越要活得热气腾腾。"]
        },
        evening: {
            clear: ["冬夜的星空，清澈而寒冷，别有一番风味。", "天气寒冷，早点结束忙碌，回家取暖吧。", "晚安，愿你梦里春暖花开。"],
            cloudy: ["没有星月的夜晚，更显宁静。", "适合窝在沙发里，看一部治愈的电影。", "睡前用热水泡脚，可以提高睡眠质量。"],
            overcast: ["阴冷冬夜，宜与家人闲坐，灯火可亲。", "窗外天寒地冻，屋内温暖如春是幸福。", "晚安，盖好被子，别让寒气入侵。"],
            snow: ["雪夜，宜围炉夜话，宜静思，宜好梦。", "窗外的世界一片洁白，内心也变得宁静。", "晚安，雪花会为你覆盖一整夜的温柔。"],
            fog: ["夜雾茫茫，早点休息，明天又是新的一天。", "所有看不清的，时间都会给你答案。", "祝你有个清晰温暖的梦。"],
            windy: ["听着窗外的风声，感觉被窝里格外温暖。", "风会带走所有不开心，晚安。", "今夜，宜拥抱，宜取暖。"],
            cold: ["这是需要勇气才能离开被窝的夜晚。", "晚安，请查收一份来自冬夜的温暖。", "睡个好觉，为身体充满抵御严寒的能量。"],
            default: ["晚安，愿你在这寒冷的冬夜里，被温柔以待。"]
        }
    },
    default: {
        default: [
            "愿你眼里的星星，永远闪亮。",
            "生活或许不易，但请别忘了微笑。😊",
            "每一天都是一份独一无二的礼物。",
            "无论天气如何，记得带上自己的阳光。",
            "嘿，陌生人，祝你今天开心。"
        ]
    }
};

function getWeatherTip(weatherData) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const hour = now.getHours();

    // 1. Determine Season
    let season = 'default';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    // 2. Determine Time of Day
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';

    // 3. Determine Weather Condition
    let condition = 'default';
    const tempC = parseInt(weatherData.tempC, 10);
    const weatherDesc = weatherData.weatherDesc.toLowerCase();
    const windSpeed = parseInt(weatherData.windSpeedKmph, 10);

    if (tempC > 32) condition = 'hot';
    else if (tempC < 0) condition = 'cold';
    else if (weatherDesc.includes('snow') || weatherDesc.includes('sleet') || weatherDesc.includes('blizzard')) condition = 'snow';
    else if (weatherDesc.includes('rain') || weatherDesc.includes('shower') || weatherDesc.includes('drizzle')) condition = 'rain';
    else if (weatherDesc.includes('fog') || weatherDesc.includes('mist')) condition = 'fog';
    else if (weatherDesc.includes('haze') || weatherDesc.includes('smoke') || weatherDesc.includes('dust')) condition = 'haze';
    else if (windSpeed > 25) condition = 'windy';
    else if (weatherDesc.includes('overcast')) condition = 'overcast';
    else if (weatherDesc.includes('cloudy')) condition = 'cloudy';
    else if (weatherDesc.includes('clear') || weatherDesc.includes('sunny')) condition = 'clear';

    // 4. Retrieve Tip with Fallbacks
    let tips = WEATHER_TIPS[season]?.[timeOfDay]?.[condition];

    if (!tips || tips.length === 0) {
        tips = WEATHER_TIPS[season]?.[timeOfDay]?.default;
    }
    if (!tips || tips.length === 0) {
        // Fallback to season-level default if time-of-day default is missing
        tips = WEATHER_TIPS[season]?.default?.default;
    }
    if (!tips || tips.length === 0) {
        // Ultimate fallback
        tips = WEATHER_TIPS.default.default;
    }
    
    // 5. Return a random tip from the selected array
    return tips[Math.floor(Math.random() * tips.length)];
}

// --- [NEW] Weather API Fallback Logic ---

function setWeatherSpinner(isSpinning) {
    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-spin', isSpinning);
        }
    }
}

function getWeatherIconName(weatherData) {
    const { weatherDesc: desc, windSpeedKmph: wind, isDay, weatherCode } = weatherData;
    const weatherDesc = desc.toLowerCase();
    const iconPrefix = 'https://basmilius.github.io/weather-icons/production/fill/all/';
    let iconName = 'not-available.svg';

    if (weatherDesc.includes('thunder') && weatherDesc.includes('snow')) {
        iconName = isDay ? 'thunderstorms-day-snow.svg' : 'thunderstorms-night-snow.svg';
    } else if (weatherDesc.includes('thunder') && weatherDesc.includes('rain')) {
        iconName = isDay ? 'thunderstorms-day-rain.svg' : 'thunderstorms-night-rain.svg';
    } else if (weatherDesc.includes('thunder')) {
        iconName = isDay ? 'thunderstorms-day.svg' : 'thunderstorms-night.svg';
    } else if (weatherDesc.includes('snow') || weatherDesc.includes('blizzard')) {
        iconName = isDay ? 'partly-cloudy-day-snow.svg' : 'partly-cloudy-night-snow.svg';
        if (weatherDesc.includes('heavy') || weatherDesc.includes('blizzard')) iconName = 'snow.svg';
    } else if (weatherDesc.includes('sleet')) {
        iconName = isDay ? 'partly-cloudy-day-sleet.svg' : 'partly-cloudy-night-sleet.svg';
    } else if (weatherDesc.includes('rain') || weatherDesc.includes('shower')) {
        if (weatherDesc.includes('light') || weatherDesc.includes('drizzle')) {
            iconName = isDay ? 'partly-cloudy-day-drizzle.svg' : 'partly-cloudy-night-drizzle.svg';
        } else if (weatherDesc.includes('heavy')) {
            iconName = 'rain.svg';
        } else {
            iconName = isDay ? 'partly-cloudy-day-rain.svg' : 'partly-cloudy-night-rain.svg';
        }
    } else if (weatherDesc.includes('hail')) {
        iconName = 'hail.svg';
    } else if (weatherDesc.includes('fog')) {
        iconName = isDay ? 'fog-day.svg' : 'fog-night.svg';
    } else if (weatherDesc.includes('haze') || weatherDesc.includes('smoke') || weatherDesc.includes('dust')) {
        iconName = isDay ? 'haze-day.svg' : 'haze-night.svg';
    } else if (parseInt(wind) > 30) {
        iconName = 'wind.svg';
    } else if (weatherDesc.includes('overcast')) {
        iconName = isDay ? 'overcast-day.svg' : 'overcast-night.svg';
    } else if (weatherDesc.includes('cloudy')) {
        iconName = isDay ? 'partly-cloudy-day.svg' : 'partly-cloudy-night.svg';
    } else if (weatherDesc.includes('clear') || weatherDesc.includes('sunny')) {
        iconName = isDay ? 'clear-day.svg' : 'clear-night.svg';
    } else {
        // Fallback to code if description is not specific enough
        const codeStr = String(weatherCode);
        switch (codeStr) {
            case '113': iconName = isDay ? 'clear-day.svg' : 'clear-night.svg'; break;
            case '116': iconName = isDay ? 'partly-cloudy-day.svg' : 'partly-cloudy-night.svg'; break;
            case '119': iconName = 'cloudy.svg'; break;
            case '122': iconName = 'overcast.svg'; break;
            case '143': iconName = 'fog.svg'; break; // Generic fog
            case '176': case '263': case '266': case '293': case '296': case '353':
                iconName = isDay ? 'partly-cloudy-day-rain.svg' : 'partly-cloudy-night-rain.svg'; break;
            case '179': case '323': case '326': case '368':
                iconName = isDay ? 'partly-cloudy-day-snow.svg' : 'partly-cloudy-night-snow.svg'; break;
            case '182': case '317': case '362': case '365':
                iconName = isDay ? 'partly-cloudy-day-sleet.svg' : 'partly-cloudy-night-sleet.svg'; break;
            case '185': iconName = isDay ? 'partly-cloudy-day-drizzle.svg' : 'partly-cloudy-night-drizzle.svg'; break;
            case '200': case '386': case '389':
                iconName = isDay ? 'thunderstorms-day-rain.svg' : 'thunderstorms-night-rain.svg'; break;
            case '227': case '230': iconName = 'wind.svg'; break;
            case '248': case '260': iconName = 'fog.svg'; break;
            case '281': case '284': case '311': case '314': iconName = 'sleet.svg'; break;
            case '299': case '302': case '305': case '308': case '356': case '359': iconName = 'rain.svg'; break;
            case '329': case '332': case '335': case '338': case '371': iconName = 'snow.svg'; break;
            case '350': case '374': case '377': iconName = 'hail.svg'; break;
            case '392': case '395': iconName = isDay ? 'thunderstorms-day-snow.svg' : 'thunderstorms-night-snow.svg'; break;
        }
    }
    return iconPrefix + iconName;
}

function getWeatherDataHtml(weatherData) {
    const iconUrl = getWeatherIconName(weatherData);
    
    const sunriseTime = appSettings.timeFormat === '24h' ? convert12hto24h(weatherData.sunrise) : weatherData.sunrise.replace(' ', '');
    const sunsetTime = appSettings.timeFormat === '24h' ? convert12hto24h(weatherData.sunset) : weatherData.sunset.replace(' ', '');

    return `
        <div class="flex flex-col md:flex-row gap-y-4 md:gap-x-8 items-center md:items-stretch w-full">
            <!-- Column 1: 图标和主温度 (固定宽度, 居中) -->
            <div class="flex-shrink-0 flex flex-row md:flex-col items-center justify-center w-full md:w-32 gap-x-4">
                <img id="weather-icon-img" src="${iconUrl}" alt="${weatherData.weatherDesc}" class="w-16 h-16 weather-icon-initial">
                <p class="font-bold text-3xl" style="color: var(--text-color-primary);">${weatherData.tempC}°</p>
            </div>

            <!-- Column 2: Location, Condition, Tip (Flexible, Center-aligned on mobile) -->
            <div class="flex-1 flex flex-col text-center md:text-left justify-between space-y-1">
                <p class="font-bold text-xl truncate" style="color: var(--text-color-primary);" title="${weatherData.location}">${weatherData.location}</p>
                <p class="text-base font-medium" style="color: var(--text-color-secondary);">${weatherData.weatherDesc}</p>
                <p class="text-base font-medium" style="color: var(--text-color-secondary);">最高 ${weatherData.maxTempC}° 最低 ${weatherData.minTempC}°</p>
                <p class="text-sm" style="color: var(--text-color-tertiary);">${weatherData.tip}</p>
            </div>

            <!-- Column 3: 详细信息 (固定宽度, 左对齐) -->
            <div class="flex-shrink-0 flex flex-col text-sm space-y-2 w-56">
                <div class="flex items-center justify-between">
                    <div class="flex items-center w-20">
                        <i class="far fa-sun fa-fw w-5 text-center" style="color: var(--text-color-secondary);"></i>
                        <span class="ml-2" style="color: var(--text-color-secondary);">日出/落</span>
                    </div>
                    <span class="font-semibold" style="color: var(--text-color-primary);">${sunriseTime} / ${sunsetTime}</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center w-20">
                        <i class="fas fa-temperature-half fa-fw w-5 text-center" style="color: var(--text-color-secondary);"></i>
                        <span class="ml-2" style="color: var(--text-color-secondary);">体感</span>
                    </div>
                    <span class="font-semibold" style="color: var(--text-color-primary);">${weatherData.feelsLikeC}°</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center w-20">
                        <i class="fas fa-droplet fa-fw w-5 text-center" style="color: var(--text-color-secondary);"></i>
                        <span class="ml-2" style="color: var(--text-color-secondary);">湿度</span>
                    </div>
                    <span class="font-semibold" style="color: var(--text-color-primary);">${weatherData.humidity}%</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center w-20">
                        <i class="fas fa-wind fa-fw w-5 text-center" style="color: var(--text-color-secondary);"></i>
                        <span class="ml-2" style="color: var(--text-color-secondary);">风速</span>
                    </div>
                    <span class="font-semibold" style="color: var(--text-color-primary);">${weatherData.windSpeedKmph} km/h</span>
                </div>
            </div>
        </div>
    `;
}

function renderWeatherData(newHtml, isError = false) {
    const weatherLoader = document.getElementById('weather-loader');
    const dataContainer = document.getElementById('weather-data-container');
    const wrapper = document.getElementById('weather-content-wrapper');
    
    if (!dataContainer || !wrapper) return;

    // 1. Fade out current content
    dataContainer.style.opacity = 0;

    // 2. After fade-out, update content and fade back in
    setTimeout(() => {
        setWeatherSpinner(false); // Stop spinner on success or error
        isFetchingWeather = false; // Release the lock
        dataContainer.innerHTML = newHtml;
        if (weatherLoader) {
            weatherLoader.classList.remove('visible');
        }

        // Handle icon fade-in after image load
        const iconImg = document.getElementById('weather-icon-img');
        if (iconImg) {
            const fadeInIcon = () => {
                iconImg.classList.remove('weather-icon-initial');
                iconImg.classList.add('weather-icon-loaded');
            };
            if (iconImg.complete) {
                fadeInIcon();
            } else {
                iconImg.onload = fadeInIcon;
            }
        }

        dataContainer.style.opacity = 1; // Fade in new content

        // This was in the old render function, so keep it for error cases
        if (isError) {
            appSettings.weather.lastFetchedCity = '加载失败';
            updateSettingsUI();
        }
    }, 300); // Match CSS transition duration
}

function convert12hto24h(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier.toUpperCase() === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// API Handler for wttr.in
async function handleWttrIn(locationQuery, locationName) {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(locationQuery)}?format=j1`);
    if (!response.ok) {
        throw new Error(`wttr.in API returned status ${response.status}`);
    }
    const data = await response.json();

    const current = data.current_condition[0];
    const forecast = data.weather[0];
    const nearestArea = data.nearest_area[0];
    const astronomy = forecast.astronomy[0];

    // Helper to convert 12h AM/PM time to a comparable number
    const timeToMinutes = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) { // 12 AM is midnight
            hours = 0;
        }
        return hours * 60 + minutes;
    };

    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = timeToMinutes(astronomy.sunrise);
    const sunsetMinutes = timeToMinutes(astronomy.sunset);
    const isDay = currentTimeMinutes >= sunriseMinutes && currentTimeMinutes < sunsetMinutes;

    const standardizedData = {
        location: nearestArea.areaName[0].value,
        country: nearestArea.country[0].value,
        tempC: current.temp_C,
        feelsLikeC: current.FeelsLikeC,
        weatherCode: current.weatherCode,
        weatherDesc: current.weatherDesc[0].value,
        maxTempC: forecast.maxtempC,
        minTempC: forecast.mintempC,
        windSpeedKmph: current.windspeedKmph,
        humidity: current.humidity,
        sunrise: astronomy.sunrise, // Pass raw 12h string e.g. "6:04 AM"
        sunset: astronomy.sunset,   // Pass raw 12h string e.g. "7:12 PM"
        isDay: isDay,
        tip: "" // Tip will be generated after the object is created
    };
    
    // Generate tip after all data is available
    standardizedData.tip = getWeatherTip(standardizedData);

    appSettings.weather.lastFetchedCity = `${standardizedData.location}, ${standardizedData.country}`;
    saveSettings();
    return standardizedData;
}

// API Handler for Open-Meteo
async function handleOpenMeteo(locationQuery, locationName) {
    // 1. Geocoding step
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1&language=en&format=json`);
    if (!geoResponse.ok) {
        throw new Error(`Open-Meteo Geocoding API failed with status ${geoResponse.status}`);
    }
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Open-Meteo could not find location for "${locationQuery}"`);
    }
    const { latitude, longitude, name: foundName, country } = geoData.results[0];

    // 2. Forecast step
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&wind_speed_unit=kmh&timezone=auto`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
        throw new Error(`Open-Meteo Forecast API failed with status ${forecastResponse.status}`);
    }
    const forecastData = await forecastResponse.json();

    // 3. Parsing and Standardization step
    const WMO_CODES = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
    };

    const current = forecastData.current;
    const daily = forecastData.daily;
    const weatherDesc = WMO_CODES[current.weather_code] || 'Unknown';

    const standardizedData = {
        location: foundName,
        country: country,
        tempC: current.temperature_2m,
        feelsLikeC: current.apparent_temperature,
        weatherDesc: weatherDesc,
        maxTempC: daily.temperature_2m_max[0],
        minTempC: daily.temperature_2m_min[0],
        windSpeedKmph: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
        tip: "" // Tip will be generated after the object is created
    };

    // Generate tip after all data is available
    standardizedData.tip = getWeatherTip(standardizedData);

    appSettings.weather.lastFetchedCity = `${standardizedData.location}, ${standardizedData.country}`;
    saveSettings();
    return standardizedData;
}

// Controller that tries a list of API handlers in order.
async function tryWeatherApis(locationQuery, locationName) {
    const apiHandlers = [
        handleWttrIn,
        handleOpenMeteo,
    ];

    for (const handler of apiHandlers) {
        try {
            const weatherData = await handler(locationQuery, locationName);
            if (weatherData) {
                const html = getWeatherDataHtml(weatherData);
                renderWeatherData(html);
                return; // Success, exit the loop.
            }
        } catch (error) {
            console.warn(`API handler ${handler.name} failed:`, error);
            // Log the error and continue to the next handler.
        }
    }

    // If all handlers failed
    const errorHtml = `<div class="text-center"><p style="color: var(--accent-color);">天气信息当前不可用。</p><p class="text-xs mt-2" style="color: var(--text-color-tertiary);">请检查您的网络连接或稍后重试。</p></div>`;
    renderWeatherData(errorHtml, true);
}

// Main entry point for the weather feature.
export async function fetchAndDisplayWeather() {
    if (isFetchingWeather) {
        console.log("Weather fetch already in progress. Ignoring request.");
        return;
    }
    isFetchingWeather = true;

    const weatherLoader = document.getElementById('weather-loader');
    const dataContainer = document.getElementById('weather-data-container');
    const wrapper = document.getElementById('weather-content-wrapper');

    if (!weatherLoader || !dataContainer || !wrapper) return;

    // --- [FIX] Fade out old content before showing loader ---
    dataContainer.style.opacity = 0;

    setTimeout(async () => {
        // Show loader and set initial state after fade out
        weatherLoader.classList.add('visible');
        dataContainer.innerHTML = `<p class="text-center" style="color: var(--text-color-secondary);">正在获取天气...</p>`;
        dataContainer.style.opacity = 1; // Fade in the "Loading..." text

        let locationQuery = appSettings.weather.city;
        let locationName = locationQuery;

        // This part remains the same: get the location first.
        if (appSettings.weather.source === 'auto' && !locationQuery) {
            try {
                const ipResponse = await fetch('https://cors.eu.org/http://ip-api.com/json');
                if (!ipResponse.ok) throw new Error('IP API request failed');
                const ipData = await ipResponse.json();
                locationQuery = ipData.city || 'auto:ip';
                locationName = ipData.city;
            } catch (e) {
                setWeatherSpinner(false);
                isFetchingWeather = false; // Release the lock on early error
                console.error("IP-based geolocation failed.", e);
                const errorHtml = `<div class="text-center"><p style="color: var(--accent-color);">无法自动确定您的位置</p><p class="text-xs mt-2" style="color: var(--text-color-tertiary);">请在设置中手动输入城市。</p></div>`;
                renderWeatherData(errorHtml, true);
                return;
            }
        }

        if (!locationQuery) {
            const errorHtml = `<div class="text-center"><p style="color: var(--accent-color);">未设置城市</p><p class="text-xs mt-2" style="color: var(--text-color-tertiary);">请在设置中手动输入一个城市名称。</p></div>`;
            renderWeatherData(errorHtml, true);
            return;
        }
        
        // Hand off to the controller function.
        await tryWeatherApis(locationQuery, locationName || locationQuery);
    }, 300); // Match CSS transition duration
}
