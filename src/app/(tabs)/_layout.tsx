import AppTabs from '@/components/app-tabs';

/** The tab navigator. Lives in a group so a Stack can push non-tab screens (e.g. /dish/[id]) over it. */
export default function TabsLayout() {
  return <AppTabs />;
}
