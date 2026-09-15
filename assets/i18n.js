// UI strings. English is the default; Japanese is a toggle.
// Shop names stay Japanese — that is what the signage says and what you type
// into a maps search.

export const GENRE_LABELS = {
  en: {
    ramen: "Ramen", teishoku: "Set meal", chinese: "Chinese", curry: "Curry",
    soba: "Soba & udon", yoshoku: "Western", yakiniku: "Yakiniku",
    yakitori: "Yakitori", sushi: "Sushi", ethnic: "Asian", korean: "Korean",
    kissa: "Coffee house", nomi: "Standing bar",
  },
  ja: {
    ramen: "麺", teishoku: "定食", chinese: "中華", curry: "カレー", soba: "そば",
    yoshoku: "洋食", yakiniku: "焼肉", yakitori: "焼鳥", sushi: "寿司",
    ethnic: "アジア", korean: "韓国", kissa: "喫茶", nomi: "呑み",
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

// Tags are stored in Japanese; anything missing here falls back to the raw
// string, which is fine for one-offs.
export const TAG_LABELS = {
  行列: "queue", カウンター: "counter seats", 老舗: "long-established",
  百名店: "tabelog top 100", 味噌: "miso", 淡麗: "clear broth", 塩: "shio",
  家系: "iekei", 担担麺: "dandan", 二郎: "jiro", つけ麺: "tsukemen",
  濃厚: "rich", 辛い: "spicy", 煮干し: "niboshi", 鶏白湯: "chicken paitan",
  豚骨醤油: "tonkotsu shoyu", 醤油: "shoyu", まぜそば: "mazesoba",
  通し営業: "open all day", 深夜: "late night", 朝: "morning", 新店: "new",
  コスパ: "good value", 大盛り: "big portions", ワンコイン: "under ¥600",
  食券: "ticket machine", 静か: "quiet", 昭和: "showa era",
  町の食堂: "neighbourhood diner", 町中華: "machi-chuka",
  ガチ中華: "regional Chinese", 四川: "Sichuan", 羊: "lamb",
  フードコート: "food court", 一人向き: "built for one",
  要予約: "booking needed", 餃子: "gyoza", 野菜: "vegetables",
  立ち食い: "eat standing", 駅ナカ: "in the station", 駅直結: "station-linked",
  十割: "100% buckwheat", 手打ち: "hand-cut", うどん: "udon",
  カレーうどん: "curry udon", 屋上: "rooftop",
  孤独のグルメ: "Kodoku no Gurume", 一人焼肉: "solo yakiniku", 和牛: "wagyu",
  軍鶏: "shamo chicken", ハンバーグ: "hamburg steak", 純喫茶: "kissaten",
  モーニング: "morning set", レトロ: "retro", パフェ: "parfait",
  席多い: "plenty of seats", 立ち飲み: "standing bar",
  角打ち: "bottle shop bar", おでん: "oden", ひとり飲み: "drinking alone",
  スパイスカレー: "spice curry", スープカレー: "soup curry",
  南インド: "South Indian", ネパール: "Nepali", ビリヤニ: "biryani",
  ミールス: "meals", タイ: "Thai", イサーン: "Isaan", 小箱: "tiny room",
  アジア各国: "pan-Asian", 定食: "set meal",
};

const DICT = {
  en: {
    "doc.title": "I ate out",
    "tagline": "Every place I eat, scored out of ten.",
    "lang.other": "日本語",
    "lang.aria": "Switch to Japanese",

    "tab.candidates": "Candidates",
    "tab.rank": "Ranking",
    "tab.map": "Map",
    "tabs.aria": "Change view",

    "sift.search": "Search a name, a tag, a dish",
    "sift.solo": "Fine on your own",

    "cand.lead": (n, total) => (n === total
      ? `${total} places on the shortlist, none scored yet.`
      : `${n} of ${total} unscored places.`),
    "cand.empty": "Nothing matches. Clear the filters.",
    "cand.allRated": "Every candidate has a score. Add somewhere new.",

    "rank.lead": "Your scores, highest first.",
    "rank.empty": "Nothing scored yet. Pick something from Candidates and give it a number out of ten.",

    "map.lead": (placed, rest) => `${placed} places are plotted. ${rest} more have no coordinates yet and open in a maps search instead.`,
    "map.unlisted": "Not plotted yet",

    "ed.score": "Score out of ten",
    "ed.memo": "Notes",
    "ed.memoPh": "What did you eat? Going back?",
    "ed.date": "Date you went",
    "ed.issue": "Save as an issue",
    "ed.tabelog": "tabelog",
    "ed.maps": "Map",
    "ed.photos": "Photos",
    "ed.clear": "Clear score",
    "ed.close": "Close",
    "ed.unscored": "—",

    "score.aria": (n) => `${n} out of 10`,

    "foot.data": 'Places live in <code>data/shops.json</code>, scores in <code>data/ratings.json</code>. Scores are also kept in this browser.',
    "foot.export": "Export scores as JSON",
    "foot.issue": "Update via an issue",
    "foot.osm": "Map data",

    "card.tabelog": (n) => `tabelog ${n}`,
    "card.noPhoto": "No photo yet",
  },

  ja: {
    "doc.title": "I ate out",
    "tagline": "食べた店を10点満点で。",
    "lang.other": "English",
    "lang.aria": "英語に切り替える",

    "tab.candidates": "候補",
    "tab.rank": "番付",
    "tab.map": "地図",
    "tabs.aria": "表示の切り替え",

    "sift.search": "店名・タグ・料理で探す",
    "sift.solo": "ひとりでも平気",

    "cand.lead": (n, total) => (n === total
      ? `候補 ${total} 軒。まだ点はついていない。`
      : `${total} 軒のうち ${n} 軒。`),
    "cand.empty": "その条件だと残らない。条件をリセットする。",
    "cand.allRated": "候補は全部点がついた。新しい店を足す。",

    "rank.lead": "つけた点の高い順。",
    "rank.empty": "まだ点がついていない。候補から一軒選んで10点満点で入れる。",

    "map.lead": (placed, rest) => `地図に出ているのは ${placed} 軒。残り ${rest} 軒は座標がまだないので、名前で地図アプリを開く。`,
    "map.unlisted": "地図にまだ出ていない店",

    "ed.score": "10点満点で",
    "ed.memo": "メモ",
    "ed.memoPh": "何を食べた？また行く？",
    "ed.date": "行った日",
    "ed.issue": "Issueにして残す",
    "ed.tabelog": "食べログ",
    "ed.maps": "地図",
    "ed.photos": "写真",
    "ed.clear": "点を消す",
    "ed.close": "閉じる",
    "ed.unscored": "—",

    "score.aria": (n) => `10点中${n}点`,

    "foot.data": '店は <code>data/shops.json</code>、点は <code>data/ratings.json</code>。点はこの端末にも保存される。',
    "foot.export": "点をJSONで書き出す",
    "foot.issue": "Issueで更新する",
    "foot.osm": "地図データ",

    "card.tabelog": (n) => `食べログ ${n}`,
    "card.noPhoto": "写真なし",
  },
};

let lang = "en";

export function setLang(next) {
  lang = DICT[next] ? next : "en";
  document.documentElement.lang = lang;
  return lang;
}

export const getLang = () => lang;

export function t(key, ...args) {
  const entry = DICT[lang][key] ?? DICT.en[key] ?? key;
  return typeof entry === "function" ? entry(...args) : entry;
}

export const genre = (key) => GENRE_LABELS[lang][key] || GENRE_LABELS.en[key] || key;
export const area = (key) => AREA_LABELS[lang][key] || key;
export const tag = (raw) => (lang === "en" ? TAG_LABELS[raw] || raw : raw);
