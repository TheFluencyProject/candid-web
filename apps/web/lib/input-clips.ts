// The home "Comprehensible Input" section's four lesson lines (InputPhone; mockup
// tmp/tutor-roster-mockups/section-ci.html, plan plans/landing-ci-section-2026-11-17.md).
// Words, timings, chip groupings and star come from the prod rows (caption segment + vocab uses +
// word groupings). The public marketing-clips API carries none of the vocab data, so the lines live here.
// Meanings and line translations: prod's where they were right, written by hand where prod had none or the
// wrong sense (de/it 찍다, zh 타다, de/it/zh 나오다). The Korean page shows the English text: a Korean
// meaning of a Korean word tells a Korean reader nothing.

import type { Locale } from "@/i18n/routing";

type Text = { en: string } & Partial<Record<Locale, string>>;

export type InputClip = {
  lesson_id: string; // its localized title is fetched live; `title` is the fallback
  title: string;
  mux_playback_id: string;
  start: number;
  end: number;
  avatar: string;
  bars: number[]; // the title row's part bars (fill 0-1)
  chips: [string, number][]; // the app's merged chips, each from its first word's start (s)
  star: number; // chip index of the floating bubble's word
  bubble: [string, Text]; // key term: lemma, meanings
  peek: [number, string, Text]; // tapped chip index, lemma, meanings
  translation: Text;
};

// The word on top of the deck before anything is saved.
export const DECK_SEED: [string, Text] = [
  "날씨",
  { en: "weather", de: "Wetter", es: "tiempo · clima", fr: "temps · météo", id: "cuaca", it: "tempo · meteo", ja: "天気", ru: "погода", th: "อากาศ", vi: "thời tiết", zh: "天气", "zh-Hant": "天氣" },
];

export const INPUT_CLIPS: InputClip[] = [
  {
    // Mia, segment 4b7096e7
    lesson_id: "02fda8b2-ab9a-4be3-ba60-7dfa4e3a745a",
    title: "Come To Work With Me 💼",
    mux_playback_id: "M02KLw8HoIxOnQNJ2027yvAG02atAtIcCCUIx2VlI5pT4I",
    start: 40.64,
    end: 43.84,
    avatar: "https://d34wi8tgnrszdl.cloudfront.net/korean-mia/profile/profile.jpg",
    bars: [1, 0.58, 0, 0],
    chips: [["한국 버스에", 40.64], ["탈 때는", 41.54], ["카드를", 42.21], ["찍고", 42.94], ["타요.", 43.34]],
    star: 3,
    bubble: ["찍다", { en: "to tap (a card)", de: "(Karte) scannen", es: "pasar la tarjeta", fr: "badger", id: "menempelkan (kartu)", it: "timbrare (la carta)", ja: "かざす", ru: "прикладывать (карту)", th: "แตะบัตร", vi: "quẹt (thẻ)", zh: "刷（卡）", "zh-Hant": "刷（卡）" }],
    peek: [4, "타다", { en: "to ride · to take (a vehicle)", de: "fahren · einsteigen", es: "subir · tomar", fr: "prendre · monter", id: "naik", it: "prendere · salire", ja: "乗る", ru: "садиться · ехать", th: "ขึ้น · นั่ง", vi: "đi · lên (xe)", zh: "乘坐 · 上（车）", "zh-Hant": "搭乘 · 上（車）" }],
    translation: {
      en: "In Korea, you tap your card when you get on the bus.",
      de: "In Korea hält man beim Einsteigen in den Bus die Karte ans Lesegerät.",
      es: "En Corea, pasas la tarjeta al subir al autobús.",
      fr: "En Corée, on badge sa carte en montant dans le bus.",
      id: "Di Korea, kamu menempelkan kartu saat naik bus.",
      it: "In Corea, quando sali sull'autobus timbri la carta.",
      ja: "韓国ではバスに乗るとき、カードをかざして乗ります。",
      ru: "В Корее, садясь в автобус, прикладывают карту.",
      th: "ที่เกาหลี เวลาขึ้นรถเมล์ต้องแตะบัตรก่อน",
      vi: "Ở Hàn Quốc, khi lên xe buýt bạn phải quẹt thẻ.",
      zh: "在韩国上公交车时，要先刷卡再上车。",
      "zh-Hant": "在韓國搭公車時，要先刷卡再上車。",
    },
  },
  {
    // Hansoo, segment abb053d7 ("서울 지하철" is a word grouping)
    lesson_id: "f1bb60ba-e659-4991-80a3-ec75f80d1fc3",
    title: "Korean Subways 🚇",
    mux_playback_id: "Y6SGLzEmkrd5mQlF1L01hQYDa96QaDq4X48h4Zwjhv84",
    start: 11.22,
    end: 15.58,
    avatar: "https://d34wi8tgnrszdl.cloudfront.net/korean-hansoo/profile_thumb.jpg",
    bars: [1, 1, 0.3, 0],
    chips: [["서울 지하철은", 11.22], ["에어컨", 13.03], ["때문에", 13.82], ["시원해요.", 14.64]],
    star: 1,
    bubble: ["에어컨", { en: "air conditioner", de: "Klimaanlage", es: "aire acondicionado", fr: "climatiseur · clim", id: "AC", it: "condizionatore", ja: "エアコン · クーラー", ru: "кондиционер", th: "แอร์ · เครื่องปรับอากาศ", vi: "máy lạnh · máy điều hòa", zh: "空调", "zh-Hant": "冷氣" }],
    peek: [3, "시원하다", { en: "cool · refreshing", de: "kühl · erfrischend", es: "fresco", fr: "frais · rafraîchissant", id: "sejuk · segar", it: "fresco · rinfrescante", ja: "涼しい · 爽やかだ", ru: "прохладный · освежающий", th: "เย็นสบาย · สดชื่น", vi: "mát mẻ · sảng khoái", zh: "凉快", "zh-Hant": "涼快" }],
    translation: {
      en: "It's cool inside because of the air conditioning.",
      de: "In der Seouler U-Bahn ist es dank der Klimaanlage kühl.",
      es: "El metro de Seúl está fresco gracias al aire acondicionado.",
      fr: "Le métro de Séoul est frais grâce à la clim.",
      id: "Kereta bawah tanah Seoul sejuk karena ada AC.",
      it: "La metro di Seul è fresca grazie all'aria condizionata.",
      ja: "ソウルの地下鉄はエアコンのおかげで涼しいです。",
      ru: "В сеульском метро прохладно благодаря кондиционерам.",
      th: "รถไฟใต้ดินโซลเย็นสบายเพราะมีแอร์",
      vi: "Tàu điện ngầm Seoul mát mẻ nhờ có máy lạnh.",
      zh: "首尔地铁因为有空调，所以很凉快。",
      "zh-Hant": "首爾地鐵因為有冷氣，所以很涼快。",
    },
  },
  {
    // Hayden, segment a9b8e81a
    lesson_id: "97c601b9-8aef-4bac-9660-255e4be267c2",
    title: "Let's Take a Walk 🍁",
    mux_playback_id: "tit9P7rbN60176RQhrwe1r7Dth8BZUiX7kLsXcwKxxgw",
    start: 12.85,
    end: 17.42,
    avatar: "https://d34wi8tgnrszdl.cloudfront.net/korean-hayden/profile_thumb.jpg",
    bars: [0.45, 0, 0, 0],
    chips: [["오늘은", 12.85], ["날씨가", 13.56], ["따뜻해서", 14.32], ["걷기", 15.48], ["딱", 16.54], ["좋아요.", 16.88]],
    star: 2,
    bubble: ["따뜻하다", { en: "warm", de: "warm", es: "cálido · templado", fr: "chaud · doux", id: "hangat", it: "caldo · tiepido", ja: "暖かい", ru: "тёплый", th: "อุ่น · อบอุ่น", vi: "ấm áp", zh: "暖和 · 温暖", "zh-Hant": "暖和 · 溫暖" }],
    peek: [4, "딱", { en: "perfectly · exactly", de: "genau · perfekt", es: "justo · exactamente", fr: "pile · exactement", id: "pas · tepat", it: "proprio · perfettamente", ja: "ぴったり · まさに", ru: "как раз · в самый раз", th: "พอดี · เป๊ะ", vi: "vừa vặn · đúng", zh: "正好", "zh-Hant": "正好" }],
    translation: {
      en: "Today it's warm and just perfect for walking.",
      de: "Heute ist es warm, perfekt zum Spazierengehen.",
      es: "Hoy el día está cálido y es perfecto para caminar.",
      fr: "Aujourd'hui, il fait doux, parfait pour marcher.",
      id: "Hari ini cuacanya hangat, pas sekali untuk jalan-jalan.",
      it: "Oggi fa caldo, è perfetto per camminare.",
      ja: "今日は暖かくて、歩くのにちょうどいい天気です。",
      ru: "Сегодня тепло, как раз для прогулки.",
      th: "วันนี้อากาศอุ่น เหมาะกับการเดินเล่นมาก",
      vi: "Hôm nay trời ấm, rất hợp để đi dạo.",
      zh: "今天天气特别暖和，正适合走路。",
      "zh-Hant": "今天天氣特別暖和，正適合散步。",
    },
  },
  {
    // Tina, segment 71253705
    lesson_id: "0edc0d81-7b6b-49d4-9446-94ec1046b49b",
    title: "Alone or Together 🤝",
    mux_playback_id: "FFi63mTZKKLn1hAfawbcxIsnLMkJwdR2600UxkVhcS9I",
    start: 6.27,
    end: 12.32,
    avatar: "https://d34wi8tgnrszdl.cloudfront.net/korean-tina/profile_thumb.jpg",
    bars: [1, 1, 1, 0.2],
    chips: [["오늘은", 6.27], ["날씨가", 7.6], ["좋아서", 8.74], ["카페에", 10.15], ["나왔어요.", 11.12]],
    star: 3,
    bubble: ["카페", { en: "cafe · coffee shop", de: "Café", es: "café · cafetería", fr: "café", id: "kafe · kedai kopi", it: "caffè · caffetteria", ja: "カフェ · 喫茶店", ru: "кафе", th: "ร้านกาแฟ · คาเฟ่", vi: "quán cà phê", zh: "咖啡店", "zh-Hant": "咖啡廳" }],
    peek: [4, "나오다", { en: "to come out", de: "herauskommen · rausgehen", es: "salir", fr: "sortir", id: "keluar", it: "uscire", ja: "出る · 出てくる", ru: "выходить", th: "ออกมา", vi: "ra · đi ra", zh: "出来", "zh-Hant": "出來" }],
    translation: {
      en: "The weather is so nice today that I came out to a cafe.",
      de: "Heute ist so schönes Wetter, dass ich in ein Café gegangen bin.",
      es: "Hoy hace buen tiempo, así que vine a un café.",
      fr: "Il fait beau aujourd'hui, alors je suis venue dans un café.",
      id: "Cuaca hari ini bagus, jadi aku keluar ke kafe.",
      it: "Oggi è bel tempo, così sono uscita in un caffè.",
      ja: "今日は天気がいいので、カフェに来ました。",
      ru: "Сегодня хорошая погода, поэтому я пришла в кафе.",
      th: "วันนี้อากาศดี เลยออกมานั่งคาเฟ่",
      vi: "Hôm nay trời đẹp nên mình ra quán cà phê.",
      zh: "今天天气很好，所以我来咖啡馆了。",
      "zh-Hant": "今天天氣很好，所以我來咖啡廳了。",
    },
  },
];

// A line's text in the page's language: the locale's, else English (always the case on /ko).
export const text_in = (t: Text, locale: string): string => (locale === "ko" ? t.en : (t[locale as Locale] ?? t.en));
