import {
  PlayerPosition,
  WindRound,
  MeldType,
  DiscardType,
  GameCategory,
  Meld,
  DiscardedTile,
  PlayerState,
  MultiViewGameState,
  MultiViewGameRecord,
  MultiViewUploadForm,
  RelativePositions
} from './types';

// 名称映射函数
export const getPlayerPositionName = (position: PlayerPosition): string => {
  const positionNames = {
    [PlayerPosition.EAST]: '东家',
    [PlayerPosition.SOUTH]: '南家',
    [PlayerPosition.WEST]: '西家',
    [PlayerPosition.NORTH]: '北家'
  };
  return positionNames[position] || position;
};

export const getWindRoundName = (wind: WindRound): string => {
  const windNames = {
    [WindRound.EAST]: '东场',
    [WindRound.SOUTH]: '南场',
    [WindRound.WEST]: '西场',
    [WindRound.NORTH]: '北场'
  };
  return windNames[wind] || wind;
};

export const getMeldTypeName = (type: MeldType): string => {
  const typeNames = {
    [MeldType.CHI]: '吃',
    [MeldType.PENG]: '碰',
    [MeldType.MING_GANG]: '明杠',
    [MeldType.AN_GANG]: '暗杠'
  };
  return typeNames[type] || type;
};

export const getDiscardTypeName = (type: DiscardType): string => {
  const typeNames = {
    [DiscardType.HAND_CUT]: '手切',
    [DiscardType.DRAW_CUT]: '摸切'
  };
  return typeNames[type] || type;
};

export const getCategoryName = (category: GameCategory): string => {
  const categoryNames = {
    [GameCategory.BASIC_PATTERNS]: '基础牌型',
    [GameCategory.DEFENSIVE_PLAY]: '防守技巧',
    [GameCategory.OFFENSIVE_PLAY]: '进攻技巧',
    [GameCategory.ENDGAME]: '终盘技巧',
    [GameCategory.RIICHI_STRATEGY]: '立直策略',
    [GameCategory.TILE_EFFICIENCY]: '效率打法',
    [GameCategory.READING_OPPONENTS]: '读牌技巧',
    [GameCategory.PROFESSIONAL_GAMES]: '职业对局'
  };
  return categoryNames[category] || category;
};

// 相对位置计算
export const getRelativePositions = (mainViewPlayer: PlayerPosition): RelativePositions => {
  const positions = [PlayerPosition.EAST, PlayerPosition.SOUTH, PlayerPosition.WEST, PlayerPosition.NORTH];
  const mainIndex = positions.indexOf(mainViewPlayer);
  
  return {
    bottom: positions[mainIndex],                           // 主视角在下方
    right: positions[(mainIndex + 1) % 4],                // 顺时针下一位在右方
    top: positions[(mainIndex + 2) % 4],                  // 对面在上方
    left: positions[(mainIndex + 3) % 4]                  // 逆时针下一位在左方
  };
};

// 解析手牌字符串
export const parseHandTiles = (handTilesStr: string): string[] => {
  if (!handTilesStr.trim()) return [];
  
  return handTilesStr.trim()
    .replace(/\s+/g, ' ')
    .split(/[,，\s]+/)
    .filter(tile => tile.length > 0)
    .map(tile => tile.toLowerCase());
};

// 解析副露字符串（复用单视角的逻辑）
export const parseMelds = (meldsStr: string): Meld[] => {
  if (!meldsStr || !meldsStr.trim()) return [];
  
  const melds: Meld[] = [];
  const meldPatterns = meldsStr.trim().split(/\s+/);
  
  for (const pattern of meldPatterns) {
    if (!pattern) continue;
    
    try {
      const meld = parseSingleMeld(pattern);
      if (meld) {
        melds.push(meld);
      }
    } catch (error) {
      console.warn(`解析副露失败: ${pattern}`, error);
    }
  }
  
  return melds;
};

// 解析单个副露
const parseSingleMeld = (pattern: string): Meld | null => {
  const regex = /^(吃|碰|明杠|暗杠)([0-9mpsz]+)(?:\(([东南西北])\))?$/;
  const match = pattern.match(regex);
  
  if (!match) return null;
  
  const [, typeStr, tilesStr, fromPlayerStr] = match;
  
  // 确定副露类型
  let type: MeldType;
  switch (typeStr) {
    case '吃': type = MeldType.CHI; break;
    case '碰': type = MeldType.PENG; break;
    case '明杠': type = MeldType.MING_GANG; break;
    case '暗杠': type = MeldType.AN_GANG; break;
    default: return null;
  }
  
  // 解析牌组
  const tiles = parseMeldTiles(tilesStr, type);
  if (!tiles.length) return null;
  
  // 解析来源玩家
  let fromPlayer: PlayerPosition | undefined;
  if (fromPlayerStr && type !== MeldType.AN_GANG) {
    switch (fromPlayerStr) {
      case '东': fromPlayer = PlayerPosition.EAST; break;
      case '南': fromPlayer = PlayerPosition.SOUTH; break;
      case '西': fromPlayer = PlayerPosition.WEST; break;
      case '北': fromPlayer = PlayerPosition.NORTH; break;
    }
  }
  
  return { type, tiles, fromPlayer };
};

// 解析副露牌组
const parseMeldTiles = (tilesStr: string, type: MeldType): string[] => {
  const tiles: string[] = [];
  const regex = /([0-9]+)([mpsz])/g;
  let match;
  
  while ((match = regex.exec(tilesStr)) !== null) {
    const numbers = match[1];
    const suit = match[2];
    
    for (const num of numbers) {
      tiles.push(num + suit);
    }
  }
  
  // 验证副露牌组的合法性
  if (!validateMeldTiles(tiles, type)) {
    return [];
  }
  
  return tiles;
};

// 验证副露牌组
const validateMeldTiles = (tiles: string[], type: MeldType): boolean => {
  switch (type) {
    case MeldType.CHI:
      return tiles.length === 3 && isSequence(tiles);
    case MeldType.PENG:
      return tiles.length === 3 && isTriplet(tiles);
    case MeldType.MING_GANG:
    case MeldType.AN_GANG:
      return tiles.length === 4 && isQuad(tiles);
    default:
      return false;
  }
};

// 检查是否为顺子
const isSequence = (tiles: string[]): boolean => {
  if (tiles.length !== 3) return false;
  
  const sorted = tiles.map(tile => ({
    num: parseInt(tile[0]),
    suit: tile[1]
  })).sort((a, b) => a.num - b.num);
  
  const suit = sorted[0].suit;
  if (!['m', 'p', 's'].includes(suit)) return false;
  if (!sorted.every(t => t.suit === suit)) return false;
  
  return sorted[1].num === sorted[0].num + 1 && sorted[2].num === sorted[1].num + 1;
};

// 检查是否为刻子
const isTriplet = (tiles: string[]): boolean => {
  if (tiles.length !== 3) return false;
  return tiles.every(tile => tile === tiles[0]);
};

// 检查是否为杠子
const isQuad = (tiles: string[]): boolean => {
  if (tiles.length !== 4) return false;
  return tiles.every(tile => tile === tiles[0]);
};

// 解析弃牌河字符串（包含手切/摸切标记）
export const parseDiscardedTiles = (discardedStr: string): DiscardedTile[] => {
  if (!discardedStr.trim()) return [];
  
  const discardedTiles: DiscardedTile[] = [];
  const parts = discardedStr.trim().split(/\s+/);
  
  let order = 1;
  for (const part of parts) {
    if (!part) continue;
    
    // 解析格式：1m* 表示手切，1m 表示摸切，1m! 表示立直宣言
    const match = part.match(/^([0-9][mpsz])([*!]?)$/);
    if (!match) continue;
    
    const [, tile, modifier] = match;
    const isRiichi = modifier === '!';
    const type = modifier === '*' ? DiscardType.HAND_CUT : DiscardType.DRAW_CUT;
    
    discardedTiles.push({
      tile: tile.toLowerCase(),
      type,
      isRiichi,
      order: order++
    });
  }
  
  return discardedTiles;
};

// 计算副露牌数
export const countMeldTiles = (melds: Meld[]): number => {
  return melds.reduce((total, meld) => total + meld.tiles.length, 0);
};

// 验证手牌总数（手牌 + 副露 = 13 或 14）
export const validatePlayerTileCount = (handTiles: string[], melds: Meld[]): boolean => {
  const handCount = handTiles.length;
  const meldCount = countMeldTiles(melds);
  const total = handCount + meldCount;
  
  return total === 13 || total === 14;
};

// 验证牌的格式
export const validateTileFormat = (tile: string): boolean => {
  const tilePattern = /^[1-9][mps]$|^[1-7]z$/;
  return tilePattern.test(tile);
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 处理多视角牌谱上传
export const processMultiViewUpload = (upload: MultiViewUploadForm): MultiViewGameRecord => {
  // 验证基本信息
  if (!upload.title.trim()) {
    throw new Error('牌谱标题不能为空');
  }
  
  // 构建玩家状态
  const players: MultiViewGameState['players'] = {} as any;
  
  for (const position of [PlayerPosition.EAST, PlayerPosition.SOUTH, PlayerPosition.WEST, PlayerPosition.NORTH]) {
    const playerData = upload.players[position];
    
    // 解析玩家数据
    const handTiles = parseHandTiles(playerData.handTiles);
    const melds = parseMelds(playerData.melds);
    const discardedTiles = parseDiscardedTiles(playerData.discardedTiles);
    
    // 验证主视角玩家必须有手牌
    if (position === upload.mainViewPlayer && handTiles.length === 0) {
      throw new Error(`主视角玩家（${getPlayerPositionName(position)}）必须输入手牌`);
    }
    
    // 验证手牌总数（主视角玩家）
    if (position === upload.mainViewPlayer && !validatePlayerTileCount(handTiles, melds)) {
      const handCount = handTiles.length;
      const meldCount = countMeldTiles(melds);
      throw new Error(`${getPlayerPositionName(position)}手牌总数不正确：手牌${handCount}张 + 副露${meldCount}张 = ${handCount + meldCount}张，应为13张或14张`);
    }
    
    // 验证牌格式
    const allPlayerTiles = [...handTiles, ...discardedTiles.map(d => d.tile), ...melds.flatMap(m => m.tiles)];
    const invalidTiles = allPlayerTiles.filter(tile => !validateTileFormat(tile));
    if (invalidTiles.length > 0) {
      throw new Error(`${getPlayerPositionName(position)}的牌格式有误: ${invalidTiles.join(', ')}`);
    }
    
    players[position] = {
      position,
      handTiles,
      melds,
      discardedTiles,
      score: playerData.score,
      isRiichi: playerData.isRiichi,
      riichiTurn: playerData.isRiichi ? upload.turnCount : undefined
    };
  }
  
  // 解析宝牌指示牌
  const doraIndicators = parseHandTiles(upload.doraIndicators);
  if (doraIndicators.length === 0) {
    throw new Error('宝牌指示牌不能为空');
  }
  
  // 构建游戏状态
  const gameState: MultiViewGameState = {
    mainViewPlayer: upload.mainViewPlayer,
    windRound: upload.windRound,
    roundNumber: upload.roundNumber,
    honbaCount: upload.honbaCount,
    riichiSticks: upload.riichiSticks,
    players,
    remainingTiles: upload.remainingTiles,
    doraIndicators,
    currentTurn: upload.currentTurn,
    turnCount: upload.turnCount,
    isLastTile: upload.isLastTile,
    isFirstTurn: upload.isFirstTurn
  };
  
  // 创建牌谱记录
  const record: MultiViewGameRecord = {
    id: generateId(),
    title: upload.title,
    source: upload.source,
    tags: upload.tags,
    category: upload.category,
    gameState,
    keyPoints: upload.keyPoints?.map(point => ({
      id: generateId(),
      ...point
    })) || [],
    learningObjectives: upload.learningObjectives || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      estimatedTime: upload.metadata?.estimatedTime || 15,
      prerequisites: upload.metadata?.prerequisites || [],
      relatedRecords: upload.metadata?.relatedRecords || [],
      difficulty: upload.metadata?.difficulty || 'intermediate',
      ...upload.metadata
    }
  };
  
  return record;
};

// 本地存储相关函数
const STORAGE_KEY = 'mahjong_multi_view_records';

export const saveMultiViewRecordsToLocal = (records: MultiViewGameRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('保存多视角牌谱到本地存储失败:', error);
  }
};

export const loadMultiViewRecordsFromLocal = (): MultiViewGameRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const records = JSON.parse(stored);
    return records.map((record: any) => ({
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }));
  } catch (error) {
    console.error('从本地存储加载多视角牌谱失败:', error);
    return [];
  }
};

// 生成示例数据
export const generateSampleMultiViewRecord = (): MultiViewGameRecord => {
  const sampleGameState: MultiViewGameState = {
    mainViewPlayer: PlayerPosition.SOUTH,
    windRound: WindRound.EAST,
    roundNumber: 1,
    honbaCount: 0,
    riichiSticks: 0,
    players: {
      [PlayerPosition.EAST]: {
        position: PlayerPosition.EAST,
        handTiles: [], // 其他玩家手牌不可见
        melds: [],
        discardedTiles: [
          { tile: '1z', type: DiscardType.DRAW_CUT, order: 1 },
          { tile: '2z', type: DiscardType.HAND_CUT, order: 5 }
        ],
        score: 25000,
        isRiichi: false
      },
      [PlayerPosition.SOUTH]: {
        position: PlayerPosition.SOUTH,
        handTiles: ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '1z'],
        melds: [
          {
            type: MeldType.PENG,
            tiles: ['5s', '5s', '5s'],
            fromPlayer: PlayerPosition.EAST
          }
        ],
        discardedTiles: [
          { tile: '3z', type: DiscardType.DRAW_CUT, order: 2 },
          { tile: '4z', type: DiscardType.HAND_CUT, order: 6 }
        ],
        score: 25000,
        isRiichi: false
      },
      [PlayerPosition.WEST]: {
        position: PlayerPosition.WEST,
        handTiles: [],
        melds: [],
        discardedTiles: [
          { tile: '5z', type: DiscardType.HAND_CUT, order: 3 },
          { tile: '6z', type: DiscardType.DRAW_CUT, order: 7 }
        ],
        score: 25000,
        isRiichi: false
      },
      [PlayerPosition.NORTH]: {
        position: PlayerPosition.NORTH,
        handTiles: [],
        melds: [],
        discardedTiles: [
          { tile: '7z', type: DiscardType.DRAW_CUT, order: 4 },
          { tile: '1p', type: DiscardType.HAND_CUT, order: 8 }
        ],
        score: 25000,
        isRiichi: false
      }
    },
    remainingTiles: 70,
    doraIndicators: ['5m'],
    currentTurn: PlayerPosition.SOUTH,
    turnCount: 3,
    isLastTile: false,
    isFirstTurn: false
  };

  return {
    id: generateId(),
    title: '多视角听牌练习（含副露）',
    source: '麻将进阶教程 第5章',
    tags: ['多视角', '听牌', '副露', '读牌'],
    category: GameCategory.READING_OPPONENTS,
    gameState: sampleGameState,
    keyPoints: [
      {
        id: generateId(),
        title: '主视角玩家听牌分析',
        description: '南家碰5s后，手牌形成简单的听牌形，需要结合其他家的弃牌分析安全牌',
        importance: 'high',
        concept: '多视角听牌',
        relatedPlayer: PlayerPosition.SOUTH
      },
      {
        id: generateId(),
        title: '他家弃牌读取',
        description: '观察东家和西家的弃牌模式，判断危险牌',
        importance: 'medium',
        concept: '读牌技巧',
        relatedPlayer: PlayerPosition.EAST
      }
    ],
    learningObjectives: ['掌握多视角下的听牌判断', '学会通过他家弃牌分析局势', '理解副露对全局的影响'],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      estimatedTime: 20,
      prerequisites: ['基础牌型认识', '副露基础', '单视角分析'],
      relatedRecords: [],
      difficulty: 'intermediate'
    }
  };
}; 