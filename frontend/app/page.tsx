import type { Metadata } from 'next';
import { HomePreview } from '@/components/theranetrix/home-preview';
import { seedWorkspace } from '@/lib/theranetrix';
import { ensureShowcaseData } from '@/lib/demo-showcase';
import { normalizeWorkspace } from '@/lib/medications';
import { ReportChartPreview } from '@/components/theranetrix/report-score';
import styles from '../../app/current-theme/home-preview.module.css';

export const metadata: Metadata = {
  title: 'TheraNetrix | Doctor Focus',
  robots: { index: false, follow: false },
};

export default function Home() {
  const data = normalizeWorkspace(ensureShowcaseData(seedWorkspace(), 'Demo care team', '2026-10-02T12:00:00Z'));
  return (
    <div className={styles.preview}>
      <ReportChartPreview><HomePreview data={data} /></ReportChartPreview>
    </div>
  );
}
