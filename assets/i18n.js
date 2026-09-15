// UI strings. English is the default; Japanese is a toggle.
// Shop names, and the shop notes when no English note exists, stay Japanese.

export const GENRE_LABELS = {
  en: {
    ramen: "Ramen", teishoku: "Set meal", chinese: "Chinese", curry: "Curry",
    soba: "Soba & udon", yoshoku: "Western", yakiniku: "Yakiniku",
    yakitori: "Yakitori", sushi: "Sushi", ethnic: "Asian", korean: "Korean",
    kissa: "Coffee house", nomi: "Standing bar", late: "Late night",
  },
  ja: {
    ramen: "麺", teishoku: "定食", chinese: "中華", curry: "カレー", soba: "そば",
    yoshoku: "洋食", yakiniku: "焼肉", yakitori: "焼鳥", sushi: "寿司",
    ethnic: "アジア", korean: "韓国", kissa: "喫茶", nomi: "呑み", late: "深夜",
  },
};

export const AREA_LABELS = {
  en: {
    西口: "West exit", 北口: "North exit", 東口: "East exit",
    南池袋: "Minami-Ikebukuro", 東池袋: "Higashi-Ikebukuro",
    駅ナカ: "In the station", 周縁: "Outskirts",
  },
  ja: {
    西口: "西口", 北口: "北口", 東口: "東口", 南池袋: "南池袋",
    東池袋: "東池袋", 駅ナカ: "駅ナカ", 周縁: "周縁",
  },
};

// Only tags that actually appear in the data. Anything else falls back to
// the raw Japanese string, which is fine for one-off tags.
export const TAG_LABELS = {
  行列: "queue", カウンター: "counter seats", 老舗: "long-established",
  百名店: "tabelog top 100", 味噌: "miso", 淡麗: "clear broth", 塩: "shio",
  家系: "iekei", 担担麺: "dandan", 二郎: "jiro", 二郎系: "jiro-style",
  つけ麺: "tsukemen", 濃厚: "rich", 辛い: "spicy", 煮干し: "niboshi",
  鶏白湯: "chicken paitan", 豚骨醤油: "tonkotsu shoyu", 醤油: "shoyu",
  まぜそば: "mazesoba", 通し営業: "open all day", 深夜: "late night",
  "24時間": "24 hours", 早朝: "early morning", 朝: "morning", 朝食: "breakfast",
  新店: "new", コスパ: "good value", 大盛り: "big portions",
  ワンコイン: "under 500 yen", 食券: "ticket machine", 静か: "quiet",
  昭和: "showa era", 町の食堂: "neighbourhood diner", 町中華: "machi-chuka",
  ガチ中華: "regional Chinese", 東北料理: "Dongbei", 四川: "Sichuan",
  湖南: "Hunan", 羊: "lamb", 串焼き: "skewers", 麻辣湯: "malatang",
  点心: "dim sum", フードコート: "food court", 一人向き: "built for one",
  要予約: "booking needed", 餃子: "gyoza", 野菜: "vegetables",
  生姜焼き: "ginger pork", 豚汁: "pork miso soup", 健康: "healthy",
  ご飯うまい: "great rice", 立ち食い: "eat standing", 駅ナカ: "in the station",
  駅直結: "station-linked", 十割: "100% buckwheat", 手打ち: "hand-cut",
  うどん: "udon", そば: "soba", 屋上: "rooftop",
  孤独のグルメ: "Kodoku no Gurume", 一人焼肉: "solo yakiniku", 和牛: "wagyu",
  軍鶏: "shamo chicken", ハンバーグ: "hamburg steak", 純喫茶: "kissaten",
  モーニング: "morning set", レトロ: "retro", パフェ: "parfait",
  席多い: "plenty of seats", スペシャルティ: "specialty coffee",
  立ち飲み: "standing bar", 角打ち: "bottle shop bar", おでん: "oden",
  せんべろ: "cheap drinks", ひとり飲み: "drinking alone",
  始発待ち: "waiting for first train", 電源: "power sockets",
  スパイスカレー: "spice curry", スープカレー: "soup curry",
  南インド: "South Indian", インド: "Indian", ネパール: "Nepali",
  ビリヤニ: "biryani", ミールス: "meals", ビュッフェ: "buffet",
  タイ: "Thai", イサーン: "Isaan", 小箱: "tiny room",
  アジア各国: "pan-Asian", 定食: "set meal", 韓国: "Korean",
  モンゴル: "Mongolian",
};

const DICT = {
  en: {
    "doc.title": "GULA",
    "noren.sub": "GULA — eat every one of them, alone",
    "lang.other": "日本語",
    "lang.aria": "Switch to Japanese",

    "draw.h": "TODAY'S TICKET",
    "draw.again": "Draw another",

    "tab.rank": "Ranking",
    "tab.todo": "To go",
    "tab.love": "Loved",
    "tab.sheet": "Sheets",
    "tab.map": "Map",
    "tab.all": "Everything",

    "sift.search": "Search name or tag",
    "sift.onlyNew": "Only places I haven't been",

    "rank.lead": "Ordered by the stars you gave.",
    "rank.howto": "How the overall score works",
    "rank.howtoBody": "A weighted mean of four stars: <b>taste ×3</b>, <b>solo comfort ×2</b>, <b>value ×1</b>, <b>ease of entry ×1</b>. Axes you left blank drop out, so rating taste alone is enough to get ranked.",
    "rank.empty": "Nothing rated yet. Open a card and give stars to whatever was good.",

    "todo.lead": "Where you're going next. Switch a card to \"been\" and the sheet gets stamped.",
    "todo.empty": "Nothing on the list. Pick something from Everything and mark it to go.",

    "love.lead": "The ones you go back to. Start here when you can't decide.",
    "love.empty": "Empty so far. Mark a place you'd keep returning to.",

    "sheet.lead": "One sheet per area. Every place you eat at gets stamped.",
    "sheet.next": (name) => `Next up: ${name}`,
    "sheet.done": "This sheet is complete.",
    "sheet.count": (done, total, pct) => `${done} / ${total}　${pct}%`,

    "map.lead": (placed, rest) => `${placed} places have coordinates. The other ${rest} open in a maps search by name.`,
    "map.unlisted": "Not on the map yet",

    "all.lead": (shown, total) => `${shown} of ${total} places`,
    "all.empty": "Nothing matches those filters.",

    "ed.todo": "To go",
    "ed.visited": "Been",
    "ed.love": "Love",
    "ed.statusGroup": "Status",
    "ed.memo": "Notes",
    "ed.memoPh": "What did you eat? What next?",
    "ed.date": "Date you went",
    "ed.issue": "Save as an issue",
    "ed.tabelog": "tabelog",
    "ed.maps": "Map",
    "ed.web": "Find reviews",
    "ed.clear": "Clear rating",
    "ed.close": "Close",

    "axis.taste": "Taste",
    "axis.taste.hint": "Would you eat it again",
    "axis.solo": "Solo comfort",
    "axis.solo.hint": "Comfortable on your own",
    "axis.value": "Value",
    "axis.value.hint": "For what you paid",
    "axis.ease": "Ease of entry",
    "axis.ease.hint": "Seated without queuing",
    "axis.weight": (w) => `weight ×${w}`,

    "foot.data": 'Places live in <code>data/shops.json</code>, stars in <code>data/ratings.json</code>. Stars are also kept in this browser.',
    "foot.export": "Export stars as JSON",
    "foot.issue": "Update via an issue",
    "foot.osm": "Map data",

    "card.tabelog": (n) => `tabelog ${n}`,
    "card.stamp": "済",
    "stars.aria": (n) => `${n} out of 5`,
    "tabs.aria": "Change view",
  },

  ja: {
    "doc.title": "GULA — 暴食",
    "noren.sub": "GULA — ぜんぶ、ひとりで食う",
    "lang.other": "English",
    "lang.aria": "英語に切り替える",

    "draw.h": "きょうの一枚",
    "draw.again": "もう一枚ひく",

    "tab.rank": "番付",
    "tab.todo": "行きたい",
    "tab.love": "好き",
    "tab.sheet": "制覇",
    "tab.map": "地図",
    "tab.all": "ぜんぶ",

    "sift.search": "店名・タグで探す",
    "sift.onlyNew": "まだ行ってない店だけ",

    "rank.lead": "自分でつけた星の順。",
    "rank.howto": "総合点の出し方",
    "rank.howtoBody": "4つの星に重みをつけた平均。<b>うまい ×3</b>／<b>ひとり居心地 ×2</b>／<b>安い ×1</b>／<b>入りやすい ×1</b>。つけていない項目は計算から外れるので、うまいだけ星を入れてもちゃんと順位はつく。",
    "rank.empty": "まだ一枚も星がついていない。カードを押して、うまかったところに星を入れるとここに並ぶ。",

    "todo.lead": "次に行く店。カードを押して「行った」に変えると制覇台紙にハンコが押される。",
    "todo.empty": "行きたい店がまだない。「ぜんぶ」から気になる店を選んで「行きたい」を押す。",

    "love.lead": "また行く店。迷ったらここから選ぶ。",
    "love.empty": "まだない。通いたくなった店に「好き」を押す。",

    "sheet.lead": "エリアごとの台紙。食べた店にハンコが押される。",
    "sheet.next": (name) => `次の一軒：${name}`,
    "sheet.done": "この台紙は満了。",
    "sheet.count": (done, total, pct) => `${done} / ${total} 軒　${pct}%`,

    "map.lead": (placed, rest) => `座標がわかっているのは ${placed} 軒。残り ${rest} 軒は名前から地図アプリを開く。`,
    "map.unlisted": "地図未登録の店",

    "all.lead": (shown, total) => `${shown} 軒 / 全 ${total} 軒`,
    "all.empty": "その条件だと一軒も残らない。",

    "ed.todo": "行きたい",
    "ed.visited": "行った",
    "ed.love": "好き",
    "ed.statusGroup": "この店の状態",
    "ed.memo": "メモ",
    "ed.memoPh": "何を食べた？次はどうする？",
    "ed.date": "行った日",
    "ed.issue": "Issueにして残す",
    "ed.tabelog": "食べログ",
    "ed.maps": "地図",
    "ed.web": "口コミを探す",
    "ed.clear": "評価を消す",
    "ed.close": "閉じる",

    "axis.taste": "うまい",
    "axis.taste.hint": "また食べたい味か",
    "axis.solo": "ひとり居心地",
    "axis.solo.hint": "一人で浮かないか",
    "axis.value": "安い",
    "axis.value.hint": "払った額に対して",
    "axis.ease": "入りやすい",
    "axis.ease.hint": "並ばず座れるか",
    "axis.weight": (w) => `重み×${w}`,

    "foot.data": 'データは <code>data/shops.json</code>、星は <code>data/ratings.json</code>。星はこの端末にも自動で保存される。',
    "foot.export": "星をJSONで書き出す",
    "foot.issue": "Issueで更新する",
    "foot.osm": "地図データ",

    "card.tabelog": (n) => `食べログ ${n}`,
    "card.stamp": "済",
    "stars.aria": (n) => `5段階で${n}`,
    "tabs.aria": "表示の切り替え",
  },
};

let lang = "en";

export function setLang(next) {
  lang = DICT[next] ? next : "en";
  document.documentElement.lang = lang === "ja" ? "ja" : "en";
  return lang;
}

export function getLang() {
  return lang;
}

export function t(key, ...args) {
  const entry = DICT[lang][key] ?? DICT.en[key] ?? key;
  return typeof entry === "function" ? entry(...args) : entry;
}

export function genre(key) {
  return GENRE_LABELS[lang][key] || GENRE_LABELS.en[key] || key;
}

export function area(key) {
  return AREA_LABELS[lang][key] || key;
}

export function tag(raw) {
  return lang === "en" ? TAG_LABELS[raw] || raw : raw;
}
