import { prisma } from './prisma';

export type MaintenanceSettings = { enabled: boolean; message: string };
export type BannerSettings      = { enabled: boolean; text: string; type: 'info' | 'warning' | 'success'; link: string };
export type SiteSettings = {
  maintenance:  MaintenanceSettings;
  banner:       BannerSettings;
  heroHeadline: string;
  heroSubtext:  string;
  playStoreUrl: string;
  appStoreUrl:  string;
};

const DEFAULTS: SiteSettings = {
  maintenance:  { enabled: false, message: 'We are performing maintenance. Please check back soon.' },
  banner:       { enabled: false, text: '', type: 'info', link: '' },
  heroHeadline: '',
  heroSubtext:  '',
  playStoreUrl: 'https://play.google.com/store',
  appStoreUrl:  '',
};

function parse<T>(v: string, fallback: T): T {
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

const ALL_KEYS = ['site_maintenance', 'site_banner', 'site_hero_headline', 'site_hero_subtext', 'play_store_url', 'app_store_url'] as const;

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await (prisma as any).feeConfig.findMany({
      where: { key: { in: [...ALL_KEYS] } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return {
      maintenance: map['site_maintenance']
        ? parse<MaintenanceSettings>(map['site_maintenance'], DEFAULTS.maintenance)
        : DEFAULTS.maintenance,
      banner: map['site_banner']
        ? parse<BannerSettings>(map['site_banner'], DEFAULTS.banner)
        : DEFAULTS.banner,
      heroHeadline: map['site_hero_headline'] ?? DEFAULTS.heroHeadline,
      heroSubtext:  map['site_hero_subtext']  ?? DEFAULTS.heroSubtext,
      playStoreUrl: map['play_store_url']     ?? DEFAULTS.playStoreUrl,
      appStoreUrl:  map['app_store_url']      ?? DEFAULTS.appStoreUrl,
    };
  } catch {
    return DEFAULTS;
  }
}
