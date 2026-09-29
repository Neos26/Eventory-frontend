import { useParams } from 'react-router-dom';
import PagePlaceholder from '../components/PagePlaceholder';

export default function EventReadiness() {
  const { id } = useParams<{ id: string }>();
  return (
    <PagePlaceholder
      title={`Readiness — Event #${id}`}
      description="How prepared this event is: fulfilled requirements, gaps and warnings."
      route="/events/:id/readiness"
    />
  );
}
