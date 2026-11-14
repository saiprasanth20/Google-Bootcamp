import bengaluruAiImg from '@/src/assets/images/event_bengaluru_ai_1794641175828.jpg';
import sfSummitImg from '@/src/assets/images/event_sf_summit_1794641173416.jpg';
import londonFintechImg from '@/src/assets/images/event_london_fintech_1794641174955.jpg';
import tokyoRoboticsImg from '@/src/assets/images/event_tokyo_robotics_1794641175352.jpg';
import nycDesignImg from '@/src/assets/images/event_nyc_design_1794641174788.jpg';

export const EVENT_COVER_IMAGES = {
  bengaluru: bengaluruAiImg,
  sf: sfSummitImg,
  london: londonFintechImg,
  tokyo: tokyoRoboticsImg,
  nyc: nycDesignImg,
} as const;

export function pickCoverImageForCity(city: string): string {
  const lower = city.toLowerCase();
  if (lower.includes('bengaluru') || lower.includes('bangalore') || lower.includes('india')) {
    return bengaluruAiImg;
  }
  if (lower.includes('san francisco') || lower.includes('sf') || lower.includes('bay')) {
    return sfSummitImg;
  }
  if (lower.includes('london') || lower.includes('uk') || lower.includes('berlin')) {
    return londonFintechImg;
  }
  if (lower.includes('tokyo') || lower.includes('japan') || lower.includes('singapore')) {
    return tokyoRoboticsImg;
  }
  if (lower.includes('new york') || lower.includes('nyc') || lower.includes('boston')) {
    return nycDesignImg;
  }
  return sfSummitImg;
}
