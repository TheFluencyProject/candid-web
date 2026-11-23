// Copy for joincandid.co/invite/{username}. English is Adam's text word for word (2026-11-23);
// Korean is a translation Adam approves before it ships. Pages render `copy[locale] ?? copy.en`,
// so every other site locale shows English. Adding a language = adding one key per string.
//
// Placeholders, filled by the page:
//   {name}      the creator's name
//   {language}  their teaching language in the page's language ("Korean" / "한국어")
//   {app_link}, {grace}, {didi}  inline links

export type InviteCopy = { en: string; ko?: string };

export const CREATOR_INVITE_COPY = {
  meta_title: {
    en: "You’re invited to be a Candid creator",
    ko: "Candid 크리에이터로 초대합니다",
  },
  og_title: {
    en: "{name}, you’re invited",
    ko: "{name}님, 초대합니다",
  },
  headline: {
    en: "Dear {name},",
    ko: "{name}님께,",
  },
  invited: {
    en: "You’re invited to be a creator on Candid.",
    ko: "Candid의 크리에이터로 초대합니다.",
  },
  intro: {
    en: "Candid helps you make money through your {language} content by making it part of a daily {language} learning app for your followers.",
    ko: "Candid는 크리에이터님의 {language} 콘텐츠를 팔로워들이 매일 공부하는 {language} 학습 앱에 담아, 수익을 낼 수 있도록 도와드려요.",
  },

  what_candid_is: { en: "⭐️ How Candid works", ko: "⭐️ Candid란?" },

  for_you: { en: "For you", ko: "크리에이터님께" },
  for_you_items: [
    {
      en: "💰 **Candid helps you earn money** by making your {language} content part of a language learning app which your followers can study with & pay for.",
      ko: "💰 **Candid로 수익을 낼 수 있어요.** 크리에이터님의 {language} 콘텐츠를 팔로워들이 공부하고 결제하는 언어 학습 앱에 담아 드려요.",
    },
    {
      en: "✅ **Candid doesn’t require any additional time from you**—you simply share with us the {language} content you already upload to social media.",
      ko: "✅ **Candid는 추가 시간이 전혀 들지 않아요.** 이미 소셜 미디어에 올리고 계신 {language} 콘텐츠를 저희와 공유해 주시기만 하면 돼요.",
    },
    {
      en: "⏱️ **Candid saves you time** through the video editing tools we’ve built. They have saved our creators as much as 1 hour of editing per video. You’ll get free access to these.",
      ko: "⏱️ **Candid로 시간을 아낄 수 있어요.** 저희가 만든 영상 편집 도구 덕분이에요. 영상 하나당 편집 시간을 최대 1시간까지 줄인 크리에이터도 있어요. 이 도구들은 무료로 이용하실 수 있어요.",
    },
  ],

  for_students: { en: "For students", ko: "학생들에게" },
  for_students_intro: {
    en: "Candid is the best way for your students to study with your content. Candid is valuable because it:",
    ko: "Candid는 학생들이 크리에이터님의 콘텐츠로 공부하는 가장 좋은 방법이에요. Candid는 이런 점이 좋아요:",
  },
  for_students_items: [
    {
      en: "🌌 Brings together {language} content not just from you, but also from a variety of other creators",
      ko: "🌌 크리에이터님뿐만 아니라 다양한 다른 크리에이터의 {language} 콘텐츠도 한곳에 모아요",
    },
    {
      en: "💪 Splits videos into structured, shorter lessons for a daily 10 minute habit",
      ko: "💪 영상을 짧고 체계적인 레슨으로 나눠, 매일 10분 공부하는 습관을 만들어 줘요",
    },
    {
      en: "📝 Includes many helpful language learning features, such as: shadowing practice, vocab review, looking up & saving words, listening in the background",
      ko: "📝 섀도잉 연습, 단어 복습, 단어 찾기와 저장, 백그라운드 듣기 같은 유용한 언어 학습 기능이 많아요",
    },
    {
      en: "😄 Brings together a variety of fun gamified features, like streaks, widgets, & stickers",
      ko: "😄 스트릭, 위젯, 스티커 같은 재미있는 게임 요소가 다양하게 있어요",
    },
  ],
  feedback_intro: {
    en: "Although the app is still early, we’ve received very positive feedback from our students:",
    ko: "아직 초기 단계인 앱이지만, 학생들에게서 아주 긍정적인 피드백을 받고 있어요:",
  },
  try_app: {
    en: "You can try out the app here: {app_link}",
    ko: "앱은 여기에서 체험해 보실 수 있어요: {app_link}",
  },

  what_youll_do: { en: "📋 What you’ll do", ko: "📋 크리에이터님이 하실 일" },
  what_youll_do_intro: {
    en: "We’ve intentionally made Candid as simple & flexible as possible for you.",
    ko: "Candid는 크리에이터님이 최대한 간단하고 유연하게 쓰실 수 있도록 의도적으로 설계했어요.",
  },
  what_youll_do_items: [
    {
      en: "🎥 Share the videos that you already upload to social media with Candid",
      ko: "🎥 이미 소셜 미디어에 올리고 계신 영상을 Candid와 공유해 주세요",
    },
    {
      en: "✉️ Invite your students to study with your video in Candid through an invite link",
      ko: "✉️ 초대 링크로 학생들이 Candid에서 크리에이터님의 영상으로 공부하도록 초대해 주세요",
    },
  ],
  no_requirements: {
    en: "Beyond this, there are no additional requirements, such as a minimum upload frequency. Candid is meant to be a tool for you, which you benefit more from the more you use.",
    ko: "그 외에는 최소 업로드 횟수 같은 추가 조건이 전혀 없어요. Candid는 크리에이터님을 위한 도구라서, 많이 활용하실수록 더 많은 혜택을 누리실 수 있어요.",
  },
  our_team: {
    en: "Our team will spend all our time improving the app & website, iterating on pricing, building new features, etc to create a great language learning experience for students & help us all earn more money.",
    ko: "저희 팀은 앱과 웹사이트 개선, 가격 조정, 새로운 기능 개발 등에 모든 시간을 쏟아, 학생들에게 훌륭한 언어 학습 경험을 만들고 모두가 더 많은 수익을 낼 수 있도록 할 거예요.",
  },

  how_you_make_money: { en: "💰 How you make money", ko: "💰 수익을 얻는 방법" },
  revenue_share: {
    en: "With Candid, you’ll earn money through a revenue share.",
    ko: "Candid에서는 수익 배분 방식으로 수익을 얻으시게 돼요.",
  },
  invited_students: {
    en: "When a student that you invited into the app subscribes, you earn a large proportion of their subscription for as long as they’re subscribed.",
    ko: "크리에이터님이 앱에 초대한 학생이 구독하면, 그 학생이 구독을 유지하는 동안 구독료의 큰 비율을 받으시게 돼요.",
  },
  other_students: {
    en: "Even for students you didn’t personally invite into the app, you’ll still earn money. A smaller proportion of their subscription is shared with Candid creators based on who the student studied with.",
    ko: "직접 초대하지 않은 학생에게서도 수익이 생겨요. 그 학생들의 구독료 중 더 작은 비율이, 학생이 누구의 콘텐츠로 공부했는지에 따라 Candid 크리에이터들에게 나눠 지급돼요.",
  },

  faq: { en: "🤔 FAQ", ko: "🤔 자주 묻는 질문" },
  faq_items: [
    {
      en: "📄 You continue to own all the content you create; you simply allow Candid to use it in the app. At any point in time, for whatever reason, you may end our working relationship & remove your content from the app.",
      ko: "📄 크리에이터님이 만든 모든 콘텐츠의 소유권은 계속 크리에이터님께 있어요. Candid가 앱에서 사용하도록 허락만 해 주시는 거예요. 언제든, 어떤 이유로든 협업을 끝내고 앱에서 콘텐츠를 내리실 수 있어요.",
    },
    {
      en: "✅ Candid does not compete with any of your existing offers. You may continue to sell any other language learning products & services to your students on top of Candid.",
      ko: "✅ Candid는 크리에이터님의 기존 상품과 경쟁하지 않아요. Candid와 별개로 다른 언어 학습 상품이나 서비스도 계속 학생들에게 판매하실 수 있어요.",
    },
  ],

  youre_invited: { en: "✉️ You’re Invited", ko: "✉️ 초대합니다" },
  slowly_partner: {
    en: "We’re now looking to slowly partner with more creators, and we’d like to personally extend an invite to you.",
    ko: "이제 조금씩 더 많은 크리에이터와 함께하려고 해요. 그래서 크리에이터님을 직접 초대하고 싶어요.",
  },
} satisfies Record<string, InviteCopy | InviteCopy[]>;

// "Candid has partnered with ..." — per teaching language. A language with no entry hides the
// sentence (the "we'd like to personally extend an invite" line still shows).
export const CREATOR_INVITE_PARTNERS: Partial<Record<string, InviteCopy>> = {
  korean: {
    en: "Candid has partnered with some of the top Korean language creators, such as Grace Sooda on Instagram ({grace}, 300k) and Didi on YouTube ({didi}, 200k).",
    ko: "Candid는 인스타그램의 Grace Sooda({grace}, 30만), 유튜브의 Didi({didi}, 20만) 같은 최고의 한국어 크리에이터들과 함께하고 있어요.",
  },
};

export const CREATOR_INVITE_LINKS: Record<"app_link" | "grace" | "didi", { label: string; href: string }> = {
  app_link: { label: "joincandid.co/app", href: "https://joincandid.co/app" },
  grace: { label: "@gracesooda", href: "https://instagram.com/gracesooda" },
  didi: { label: "@didikoreanpodcast", href: "https://youtube.com/@didikoreanpodcast" },
};

// Same 4 screenshots in every language. Alt text quotes the highlighted line.
export const CREATOR_INVITE_FEEDBACK = [
  { src: "/creator-invite/feedback-1.webp", width: 1030, height: 518, alt: "Claire S: “I really like how it combines all aspects of the learning (speaking, reading, listening).”" },
  { src: "/creator-invite/feedback-2.webp", width: 1052, height: 650, alt: "Мадина О: “I just wanted to say that your app has become my favorite way to learn Korean.”" },
  { src: "/creator-invite/feedback-3.webp", width: 1036, height: 430, alt: "moi m: “It’s been really good so far and really stands out compared to other language apps I’ve been using.”" },
  { src: "/creator-invite/feedback-4.webp", width: 1206, height: 809, alt: "Luke: “Recent features really make it feel like the best Korean learning app, feels better than Duolingo and memrise.”" },
];
