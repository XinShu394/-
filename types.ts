// 多视角麻将牌谱数据结构

// 玩家位置
export enum PlayerPosition {
  EAST = 'east',     // 东家
  SOUTH = 'south',   // 南家
  WEST = 'west',     // 西家
  NORTH = 'north'    // 北家
}

// 场风
export enum WindRound {
  EAST = 'east',     // 东场
  SOUTH = 'south',   // 南场
  WEST = 'west',     // 西场
  NORTH = 'north'    // 北场
}

// 副露类型
export enum MeldType {
  CHI = 'chi',       // 吃
  PENG = 'peng',     // 碰
  MING_GANG = 'ming_gang',   // 明杠
  AN_GANG = 'an_gang'        // 暗杠
}

// 弃牌状态
export enum DiscardType {
  HAND_CUT = 'hand_cut',     // 手切（从手牌中主动打出）
  DRAW_CUT = 'draw_cut'      // 摸切（摸牌后立即打出）
}

// 副露信息
export interface Meld {
  type: MeldType;              // 副露类型
  tiles: string[];             // 副露的牌（如 ['1m', '2m', '3m'] 或 ['5s', '5s', '5s']）
  fromPlayer?: PlayerPosition; // 牌的来源玩家（暗杠时为undefined）
  calledTile?: string;         // 鸣牌的那张牌（用于区分哪张是别家打出的）
}

// 弃牌信息
export interface DiscardedTile {
  tile: string;                // 弃牌
  type: DiscardType;           // 弃牌类型（手切/摸切）
  isRiichi?: boolean;          // 是否为立直宣言牌
  order: number;               // 弃牌顺序
}

// 单个玩家的状态
export interface PlayerState {
  position: PlayerPosition;    // 玩家位置
  handTiles: string[];         // 手牌（只有主视角玩家可见完整手牌）
  melds: Meld[];              // 副露区
  discardedTiles: DiscardedTile[]; // 弃牌河（按顺序）
  score: number;              // 当前分数
  isRiichi: boolean;          // 是否立直状态
  riichiTurn?: number;        // 立直宣言的巡目
}

// 多视角牌局状态
export interface MultiViewGameState {
  // 基本信息
  mainViewPlayer: PlayerPosition;  // 主视角玩家位置
  windRound: WindRound;           // 场风
  roundNumber: number;            // 局数（1-4）
  honbaCount: number;             // 本场数
  riichiSticks: number;           // 立直棒数量
  
  // 四个玩家的状态
  players: {
    [PlayerPosition.EAST]: PlayerState;
    [PlayerPosition.SOUTH]: PlayerState;
    [PlayerPosition.WEST]: PlayerState;
    [PlayerPosition.NORTH]: PlayerState;
  };
  
  // 全局信息
  remainingTiles: number;         // 剩余牌数
  doraIndicators: string[];       // 宝牌指示牌
  uraDoraIndicators?: string[];   // 里宝牌指示牌（立直后可见）
  currentTurn: PlayerPosition;    // 当前轮到的玩家
  turnCount: number;              // 当前巡目
  
  // 可选的牌局特殊状态
  isLastTile: boolean;           // 是否海底/河底
  isFirstTurn: boolean;          // 是否天和/地和状态
}

// 多视角牌谱记录
export interface MultiViewGameRecord {
  id: string;
  title: string;                  // 牌谱标题
  source: string;                 // 来源（书籍、章节等）
  tags: string[];                 // 标签
  category: GameCategory;         // 分类
  gameState: MultiViewGameState;  // 牌局状态
  keyPoints: GameKeyPoint[];      // 关键要点
  learningObjectives: string[];   // 学习目标
  createdAt: Date;
  updatedAt: Date;
  metadata: GameMetadata;
}

// 牌谱分类（复用单视角的）
export enum GameCategory {
  BASIC_PATTERNS = 'basic_patterns',           // 基础牌型
  DEFENSIVE_PLAY = 'defensive_play',           // 防守技巧
  OFFENSIVE_PLAY = 'offensive_play',           // 进攻技巧
  ENDGAME = 'endgame',                        // 终盘技巧
  RIICHI_STRATEGY = 'riichi_strategy',        // 立直策略
  TILE_EFFICIENCY = 'tile_efficiency',        // 效率打法
  READING_OPPONENTS = 'reading_opponents',     // 读牌技巧
  PROFESSIONAL_GAMES = 'professional_games'   // 职业对局
}

// 关键要点（复用单视角的）
export interface GameKeyPoint {
  id: string;
  title: string;                  // 要点标题
  description: string;            // 详细说明
  importance: 'low' | 'medium' | 'high' | 'critical'; // 重要程度
  concept: string;                // 涉及的概念
  relatedPlayer?: PlayerPosition; // 相关的玩家位置（多视角特有）
}

// 牌谱元数据（复用单视角的）
export interface GameMetadata {
  bookChapter?: string;           // 书籍章节
  pageNumber?: number;            // 页码
  estimatedTime: number;          // 预估学习时间(分钟)
  prerequisites: string[];        // 前置知识
  relatedRecords: string[];       // 相关牌谱ID
  author?: string;                // 作者
  publishDate?: Date;             // 发布日期
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'; // 难度等级
}

// 多视角上传表单数据
export interface MultiViewUploadForm {
  // 基本信息
  title: string;
  source: string;
  tags: string[];
  category: GameCategory;
  
  // 场况设置
  mainViewPlayer: PlayerPosition;
  windRound: WindRound;
  roundNumber: number;
  honbaCount: number;
  riichiSticks: number;
  
  // 四个玩家的数据（字符串形式，用于表单输入）
  players: {
    [key in PlayerPosition]: {
      handTiles: string;          // 手牌字符串（主视角玩家填写，其他玩家可选）
      melds: string;              // 副露字符串
      discardedTiles: string;     // 弃牌河字符串（包含手切/摸切标记）
      score: number;              // 分数
      isRiichi: boolean;          // 是否立直
    }
  };
  
  // 全局信息
  remainingTiles: number;
  doraIndicators: string;
  currentTurn: PlayerPosition;
  turnCount: number;
  
  // 可选信息
  isLastTile: boolean;
  isFirstTurn: boolean;
  
  // 学习相关
  keyPoints?: {
    title: string;
    description: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    concept: string;
    relatedPlayer?: PlayerPosition;
  }[];
  learningObjectives?: string[];
  metadata?: Partial<GameMetadata>;
}

// 玩家相对位置（用于界面布局）
export interface RelativePositions {
  bottom: PlayerPosition;    // 下方（主视角）
  right: PlayerPosition;     // 右方
  top: PlayerPosition;       // 上方
  left: PlayerPosition;      // 左方
}

// 获取相对位置的工具函数类型
export type GetRelativePositions = (mainView: PlayerPosition) => RelativePositions; 