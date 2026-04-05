var Game = Game || {};

Game.SCENE_WIDTH = 1400;
Game.SCENE_HEIGHT = 792;
Game.RENDER_SCALE = 1;

Game.palette = {
  paper: "#f3efc8",
  orange: "#f59b3a",
  orangeDeep: "#de6d33",
  brown: "#3d2d21",
  brownLight: "#7b5b45",
  pink: "#ffc0d2",
  pinkDeep: "#ff739a",
  blush: "#ff9bb8",
  blue: "#7aa8ff",
  blueDeep: "#4666cd",
  aqua: "#6cd5ff",
  aquaDeep: "#1b7abe",
  cream: "#fff5d7",
  lemon: "#edf063",
  mint: "#d3f0c8",
  lilac: "#cfbef8",
  red: "#eb3f31",
  dark: "#1d2025",
  gray: "#dfe3eb",
  shadow: "#c7bc9f"
};

Game.cabinets = [
  { id: "sad-run", x: 534, y: 504, w: 176, h: 228, label: "大股の社員", message: "水たまりを全部よけたのに、最後だけしっかり濡れるゲーム。" },
  { id: "train", x: 736, y: 504, w: 176, h: 228, label: "んぽちゃむルンバ", message: "電車には乗れたのに、忘れものだけは毎回ちゃんと発生します。" },
  { id: "maint", x: 942, y: 504, w: 176, h: 228, label: "おぱんちゅ速履き", message: "故障してるみたい...！\nだれか関係者を呼んできて...！" },
  { id: "mic", x: 678, y: 270, w: 126, h: 204, label: "うたう部屋", message: "画面の中のうさぎが、マイクをにぎって気合いだけはあります。" },
  { id: "rail", x: 820, y: 270, w: 126, h: 204, label: "かえりみち", message: "電車に乗っても、だいたいひと駅ぶん切なさが残ります。" },
  { id: "season", x: 960, y: 270, w: 126, h: 204, label: "SEASON GAME", message: "季節イベントは華やかなのに、景品コメントだけ妙にしみます。" }
];

Game.frontCabinetThemes = [
  {
    body: "#ff50a0",
    stroke: "#2a2a2a",
    screenFrame: "#ff68b0",
    screenBg: "#00ccff",
    panel: "#e01878",
    base: "#ff88c0"
  },
  {
    body: "#7718e0",
    stroke: "#2a2a2a",
    screenFrame: "#8828f0",
    screenBg: "#5500cc",
    panel: "#2a0060",
    base: "#b070f0"
  },
  {
    body: "#a0e800",
    stroke: "#2a2a2a",
    screenFrame: "#b8ff00",
    screenBg: "#0a0a0a",
    panel: "#38aa00",
    base: "#d0ff60"
  }
];

Game.ufoCatchers = [
  { id: "ufo-1", x: -40, y: 320, w: 140, h: 220, label: "UFOキャッチャー1", message: "景品がいつも奥に逃げていくタイプの筐体です。" },
  { id: "ufo-2", x: 116, y: 320, w: 140, h: 220, label: "UFOキャッチャー2", message: "アームの握力がちょうどギリギリ足りない設定です。" },
  { id: "ufo-3", x: 272, y: 320, w: 140, h: 220, label: "UFOキャッチャー3", message: "取れそうで取れない、でもたまに取れる希望の筐体。" }
];

Game.ufoCatcherColors = [
  { body: "#ffb8cb", panel: "#ffa0b8", accent: "#ff7898" },
  { body: "#a8d8ff", panel: "#8ec8f0", accent: "#6ab0e8" },
  { body: "#ffb8cb", panel: "#ffa0b8", accent: "#ff7898" }
];

Game.hoveredCabinet = null;
Game.selectedCabinet = null;
