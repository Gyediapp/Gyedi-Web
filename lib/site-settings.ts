import { prisma } from './prisma';

export type MaintenanceSettings = { enabled: boolean; message: string };
export type BannerSettings      = { enabled: boolean; text: string; type: 'info' | 'warning' | 'success'; link: string };
export type SiteSettings = {
  maintenance: MaintenanceSettings;
  banner:      BannerSettings;
};

const DEFAULTS: SiteSettings = {
  maintenance: { enabled: false, message: 'We are performing maintenance. Please check back soon.' },
  banner:      { enabled: false, text: '', type: 'info', link: '' },
};

function parse<T>(v: string, fallback: T): T {
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await (prisma as any).feeConfig.findMany({
      where: { key: { in: ['site_maintenance', 'site_banner'] } },
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
    };
  } catch {
    return DEFAULTS;
  }
}
