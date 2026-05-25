import type { BannerSettings } from '@/lib/site-settings';

const TYPE_STYLES = {
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-green-50 border-green-200 text-green-800',
};

const TYPE_ICONS = {
  info:    'ℹ️',
  warning: '⚠️',
  success: '✅',
};

export default function SiteBanner({ banner }: { banner: BannerSettings }) {
  if (!banner.enabled || !banner.text) return null;

  const style = TYPE_STYLES[banner.type] ?? TYPE_STYLES.info;
  const icon  = TYPE_ICONS[banner.type]  ?? TYPE_ICONS.info;
  const content = (
    <div className={`w-full border-b px-4 py-2.5 text-center text-xs font-medium flex items-center justify-center gap-2 ${style}`}>
      <span>{icon}</span>
      <span>{banner.text}</span>
      {banner.link && <span className="underline underline-offset-2">Learn more →</span>}
    </div>
  );

  if (banner.link) {
    return (
      <a href={banner.link} className="block hover:opacity-90 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}
